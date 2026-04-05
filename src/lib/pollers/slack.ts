/**
 * lib/pollers/slack.ts
 *
 * Slack uses its own unique Status API at slack-status.com — NOT Statuspage.
 * Official docs: https://api.slack.com/apis/slack-status
 *
 * API: GET https://slack-status.com/api/v2.0.0/current
 * Response: { status: "ok"|"active_incident", active_incidents: [...] }
 */

import prisma from "@/lib/prisma";
import { inferSeverity } from "@/lib/utils/severity";
import type { Vendor } from "@prisma/client";

export async function pollSlackStatus(vendor: Vendor) {
  const res = await fetch("https://slack-status.com/api/v2.0.0/current", {
    headers: {
      "User-Agent": "OutageIntel/1.0 (+https://outageintel.org)",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) throw new Error(`Slack status API returned ${res.status}`);

  const data = await res.json();

  // No active incidents — all clear
  if (data.status === "ok" || !data.active_incidents?.length) {
    return { newOutages: [], errors: [] };
  }

  const newOutages: Awaited<ReturnType<typeof prisma.outage.create>>[] = [];
  const errors: string[] = [];

  for (const incident of data.active_incidents as Record<string, unknown>[]) {
    try {
      const rawId = incident.id ?? incident.date_created;
      if (!rawId) continue;

      const sourceId = `slack-${String(rawId)}`.slice(0, 512);

      const existing = await prisma.outage.findUnique({
        where: { vendorId_sourceId: { vendorId: vendor.id, sourceId } },
      });
      if (existing) continue;

      const notes = incident.notes as Array<{ body?: string; date_updated?: string }> | undefined;
      const descText = notes?.map((n) => n.body ?? "").join("\n") ?? "";
      const titleText = String(incident.title ?? "Slack service incident").slice(0, 500);

      const outage = await prisma.outage.create({
        data: {
          vendorId: vendor.id,
          title: titleText,
          description: descText.slice(0, 5_000) || null,
          severity: inferSeverity(titleText),
          status: "INVESTIGATING",
          sourceId,
          sourceUrl: "https://slack-status.com",
          startedAt: incident.date_created
            ? new Date(incident.date_created as string)
            : new Date(),
          resolvedAt: null,
        },
      });

      newOutages.push(outage);
    } catch (itemErr) {
      errors.push(
        `Slack item error: ${itemErr instanceof Error ? itemErr.message : String(itemErr)}`
      );
    }
  }

  return { newOutages, errors };
}
