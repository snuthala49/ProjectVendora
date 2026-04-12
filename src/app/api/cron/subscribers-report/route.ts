import { NextRequest, NextResponse } from "next/server";
import { subDays } from "date-fns";
import prisma from "@/lib/prisma";
import { sendSmtpEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const adminEmail = process.env.ADMIN_REPORT_EMAIL ?? "help@outageintel.org";
    const oneDayAgo = subDays(new Date(), 1);

    const [allSubscribers, recentSubscribers] = await Promise.all([
      prisma.subscriber.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.subscriber.findMany({
        where: { createdAt: { gte: oneDayAgo } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const activeCount = allSubscribers.filter((s) => s.isActive).length;
    const confirmedCount = allSubscribers.filter((s) => s.isConfirmed).length;

    const rows = allSubscribers
      .map(
        (s) => `
          - ${s.email} | confirmed: ${s.isConfirmed ? "Yes" : "No"} | active: ${s.isActive ? "Yes" : "No"} | severity: ${s.severityFilter.length ? s.severityFilter.join(", ") : "ALL"} | vendors: ${s.vendorFilter.length ? s.vendorFilter.join(", ") : "ALL"} | created: ${new Date(s.createdAt).toISOString()}
        `
      )
      .join("");

    await sendSmtpEmail({
      to: adminEmail,
      subject: `📊 OutageIntel Subscriber Report (${new Date().toISOString().slice(0, 10)})`,
      text: [
        `OutageIntel Subscriber Report`,
        `Admin report inbox: ${adminEmail}`,
        `Total subscribers: ${allSubscribers.length}`,
        `Active subscribers: ${activeCount}`,
        `Confirmed subscribers: ${confirmedCount}`,
        `New in last 24h: ${recentSubscribers.length}`,
        "",
        "Subscriber list:",
        rows || "No subscribers found",
      ].join("\n"),
    });

    return NextResponse.json({
      success: true,
      sentTo: adminEmail,
      totalSubscribers: allSubscribers.length,
      activeSubscribers: activeCount,
      confirmedSubscribers: confirmedCount,
      newLast24h: recentSubscribers.length,
    });
  } catch (err) {
    console.error("[Cron/subscribers-report] Fatal:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
