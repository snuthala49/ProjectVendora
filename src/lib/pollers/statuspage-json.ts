/**
 * lib/pollers/statuspage-json.ts
 *
 * Poller for vendors hosted on Atlassian Statuspage (api/v2/incidents/unresolved.json).
 * Handles: GitHub, Cloudflare, Zoom
 *
 * API shape expected:
 *   GET /api/v2/incidents/unresolved.json
 *   → { incidents: [{ id, name, status, impact, incident_updates, created_at, resolved_at, shortlink }] }
 */

import prisma from "@/lib/prisma";
import {
  inferSeverity,
  statuspageImpactToSeverity,
  statuspageStatusToOutageStatus,
} from "@/lib/utils/severity";
import type { Vendor } from "@prisma/client";

const VENDOR_SELECT = {
  id: true,
  name: true,
  slug: true,
  logoEmoji: true,
  category: true,
  statusPageUrl: true,
} as const;

export async function pollStatuspageJson(vendor: Vendor) {
  if (!vendor.feedUrl) return { newOutages: [], errors: [] };

  // Prefer the dedicated unresolved incidents endpoint; fall back to feedUrl summary
  const incidentsUrl =
    vendor.incidentsUrl ??
    vendor.feedUrl.replace("/summary.json", "/incidents/unresolved.json");

  const newOutages: Awaited<ReturnType<typeof prisma.outage.create>>[] = [];
  const errors: string[] = [];

  let data: { incidents?: unknown[] };
  try {
    const res = await fetch(incidentsUrl, {
      headers: {
        "User-Agent": "OutageIntel/1.0 (+https://outageintel.org)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    data = await res.json();
  } catch (err) {
    errors.push(
      `Statuspage fetch failed [${vendor.slug}]: ${err instanceof Error ? err.message : String(err)}`
    );
    return { newOutages, errors };
  }

  const incidents = (data.incidents ?? []) as Record<string, unknown>[];

  for (const inc of incidents.slice(0, 50)) {
    try {
      const rawId = inc.id as string | undefined;
      if (!rawId) continue;

      const sourceId = String(rawId).slice(0, 512);
      const titleText = String(inc.name ?? "Unknown Statuspage incident").slice(0, 500);
      const impactText = String(inc.impact ?? "");
      const statusText = String(inc.status ?? "");

      const updates = inc.incident_updates as Array<{ body?: string }> | undefined;
      const descText = String(updates?.[0]?.body ?? inc.body ?? "").slice(0, 5_000);

      // Deduplication
      const existing = await prisma.outage.findUnique({
        where: { vendorId_sourceId: { vendorId: vendor.id, sourceId } },
      });

      if (existing) {
        // Mark resolved if now resolved
        if (statusText === "resolved" && !existing.resolvedAt) {
          await prisma.outage.update({
            where: { id: existing.id },
            data: { status: "RESOLVED", resolvedAt: new Date(), updatedAt: new Date() },
          });
        }
        continue;
      }

      const severity = statuspageImpactToSeverity(
        impactText,
        `${titleText} ${descText}`
      );
      const outageStatus = statuspageStatusToOutageStatus(statusText);
      const resolvedAt = inc.resolved_at ? new Date(inc.resolved_at as string) : null;
      const startedAt = inc.created_at
        ? new Date(inc.created_at as string)
        : new Date();

      const outage = await prisma.outage.create({
        data: {
          vendorId: vendor.id,
          title: titleText,
          description: descText || null,
          severity,
          status: resolvedAt ? "RESOLVED" : outageStatus,
          sourceId,
          sourceUrl:
            (inc.shortlink as string | null) ??
            (inc.url as string | null) ??
            vendor.statusPageUrl ??
            null,
          startedAt,
          resolvedAt,
        },
        include: { vendor: { select: VENDOR_SELECT } },
      });

      newOutages.push(outage);
    } catch (itemErr) {
      errors.push(
        `Item error [${vendor.slug}]: ${itemErr instanceof Error ? itemErr.message : String(itemErr)}`
      );
    }
  }

  return { newOutages, errors };
}
