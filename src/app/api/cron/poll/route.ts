/**
 * GET /api/cron/poll
 *
 * Polls all vendor status feeds, persists new outages, and emails
 * subscribed users about CRITICAL/HIGH incidents.
 *
 * Secure this endpoint with a Bearer token in production:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Example Vercel cron job (vercel.json):
 *   { "crons": [{ "path": "/api/cron/poll", "schedule": "* * * * *" }] }
 */

import { NextRequest, NextResponse } from "next/server";
import { subMinutes } from "date-fns";
import { Resend } from "resend";
import prisma from "@/lib/prisma";
import { runAllPollers } from "@/lib/pollers";
import { OutageAlertEmail } from "@/emails/OutageAlert";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel Pro/Enterprise only

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function GET(request: NextRequest) {
  // ── Auth check ────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const startedAt = Date.now();

  try {
    console.log("[Cron/poll] Starting vendor poll…");

    // ── 1. Poll all vendors ───────────────────────────────────────────────
    const pollResults = await runAllPollers();
    const totalNew = pollResults.reduce((sum, r) => sum + r.newOutageCount, 0);
    const allErrors = pollResults.flatMap((r) => r.errors).filter(Boolean);

    console.log(`[Cron/poll] Poll complete — ${totalNew} new outages`);

    // ── 2. Fetch recently-created critical outages for email dispatch ─────
    // We query outages created in the last 5 minutes so we don't re-notify
    // on subsequent cron runs.
    const recentWindow = subMinutes(new Date(), 5);

    const criticalOutages = await prisma.outage.findMany({
      where: {
        severity: { in: ["CRITICAL", "HIGH"] },
        status: { not: "RESOLVED" },
        createdAt: { gte: recentWindow },
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoEmoji: true,
            statusPageUrl: true,
          },
        },
      },
    });

    // ── 3. Email subscribers ──────────────────────────────────────────────
    let emailsSent = 0;

    if (criticalOutages.length > 0 && resend) {
      const subscribers = await prisma.subscriber.findMany({
        where: { isActive: true, isConfirmed: true },
      });

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      for (const outage of criticalOutages) {
        // Filter subscribers who want this vendor+severity
        const eligible = subscribers.filter((sub) => {
          const vendorMatch =
            sub.vendorFilter.length === 0 ||
            sub.vendorFilter.includes(outage.vendorId);
          const severityMatch =
            sub.severityFilter.length === 0 ||
            (sub.severityFilter as string[]).includes(outage.severity);
          return vendorMatch && severityMatch;
        });

        for (const sub of eligible) {
          // Dedup: skip if already notified
          const alreadyNotified = await prisma.notificationLog.findUnique({
            where: {
              subscriberId_outageId: {
                subscriberId: sub.id,
                outageId: outage.id,
              },
            },
          });
          if (alreadyNotified) continue;

          try {
            await resend.emails.send({
              from:
                process.env.EMAIL_FROM ??
                "OutageIntel Alerts <alerts@yourdomain.com>",
              to: sub.email,
              subject: `🚨 ${outage.severity}: ${outage.vendor.name} — ${outage.title}`,
              react: OutageAlertEmail({
                type: "alert",
                vendorName: outage.vendor.name,
                vendorEmoji: outage.vendor.logoEmoji ?? "🌐",
                outageTitle: outage.title,
                severity: outage.severity,
                status: outage.status,
                description: outage.description,
                startedAt: outage.startedAt.toISOString(),
                statusPageUrl: outage.vendor.statusPageUrl,
                unsubscribeUrl: `${appUrl}/api/subscribe/unsubscribe?token=${sub.unsubscribeToken}`,
              }),
            });

            await prisma.notificationLog.create({
              data: {
                subscriberId: sub.id,
                outageId: outage.id,
                status: "SENT",
              },
            });

            emailsSent++;
          } catch (emailErr) {
            const errMsg =
              emailErr instanceof Error
                ? emailErr.message
                : String(emailErr);

            await prisma.notificationLog.create({
              data: {
                subscriberId: sub.id,
                outageId: outage.id,
                status: "FAILED",
                errorMessage: errMsg,
              },
            });

            console.error("[Cron/poll] Email failed:", errMsg);
          }
        }
      }
    }

    const elapsed = Date.now() - startedAt;

    const response = {
      success: true,
      vendorsPolled: pollResults.length,
      newOutages: totalNew,
      criticalOutages: criticalOutages.length,
      emailsSent,
      errors: allErrors,
      elapsedMs: elapsed,
    };

    console.log("[Cron/poll] Done:", response);
    return NextResponse.json(response);
  } catch (err) {
    console.error("[Cron/poll] Fatal:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Date.now() - startedAt,
      },
      { status: 500 }
    );
  }
}
