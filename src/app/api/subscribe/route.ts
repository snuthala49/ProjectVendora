import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import prisma from "@/lib/prisma";
import { OutageAlertEmail } from "@/emails/OutageAlert";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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

    // Send confirmation email if Resend is configured
    if (resend) {
      try {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

        await resend.emails.send({
          from:
            process.env.EMAIL_FROM ??
            "OutageIntel Alerts <alerts@yourdomain.com>",
          to: email,
          subject: "✅ Confirm your OutageIntel outage alerts",
          react: OutageAlertEmail({
            type: "confirmation",
            email,
            confirmUrl: `${appUrl}/api/subscribe/confirm?token=${subscriber.confirmToken}`,
            unsubscribeUrl: `${appUrl}/api/subscribe/unsubscribe?token=${subscriber.unsubscribeToken}`,
          }),
        });
      } catch (emailErr) {
        // Non-fatal — subscription still created
        console.error("[Subscribe] Email send failed:", emailErr);
      }
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
