import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { sendSmtpEmail } from "@/lib/mailer";

const subscribeSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  vendorFilter: z.array(z.string()).optional().default([]),
  severityFilter: z
    .array(z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"]))
    .optional()
    .default([]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const { email, vendorFilter, severityFilter } = parsed.data;

    const existingSubscriber = await prisma.subscriber.findUnique({
      where: { email },
      select: { id: true },
    });

    // Upsert subscriber (safe to call again for existing subscribers)
    const subscriber = await prisma.subscriber.upsert({
      where: { email },
      create: {
        email,
        vendorFilter,
        severityFilter,
        isConfirmed: false,
      },
      update: {
        vendorFilter,
        severityFilter,
        isActive: true,
      },
    });

    try {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      const adminEmail = process.env.ADMIN_REPORT_EMAIL ?? "help@outageintel.org";
      const vendorNames = vendorFilter.length
        ? await prisma.vendor.findMany({
            where: { slug: { in: vendorFilter } },
            select: { name: true, slug: true },
          })
        : [];

      await sendSmtpEmail({
        to: adminEmail,
        subject: existingSubscriber
          ? `📬 Subscriber updated: ${email}`
          : `🆕 New subscriber: ${email}`,
        text: [
          `Subscriber email: ${email}`,
          `Status: ${existingSubscriber ? "Updated existing" : "New subscription"}`,
          `Severity filters: ${severityFilter.length ? severityFilter.join(", ") : "ALL"}`,
          `Vendor filters: ${vendorNames.length ? vendorNames.map((v) => `${v.name} (${v.slug})`).join(", ") : "ALL"}`,
          `Confirmed: ${subscriber.isConfirmed ? "Yes" : "No"}`,
          `Active: ${subscriber.isActive ? "Yes" : "No"}`,
        ].join("\n"),
      });

      await sendSmtpEmail({
        to: email,
        subject: "✅ Confirm your OutageIntel outage alerts",
        text: [
          "Thanks for subscribing to OutageIntel.",
          "",
          "Please confirm your subscription:",
          `${appUrl}/api/subscribe/confirm?token=${subscriber.confirmToken}`,
          "",
          "To unsubscribe at any time:",
          `${appUrl}/api/subscribe/unsubscribe?token=${subscriber.unsubscribeToken}`,
        ].join("\n"),
      });
    } catch (emailErr) {
      // Non-fatal — subscription still created
      console.error("[Subscribe] SMTP send failed:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message:
        "Subscription created! Check your inbox to confirm your email address.",
    });
  } catch (err) {
    console.error("[POST /api/subscribe]", err);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}
