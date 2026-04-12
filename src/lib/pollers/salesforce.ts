/**
 * lib/pollers/salesforce.ts
 *
 * Salesforce Trust API — official incident feed.
 * Docs: https://api.status.salesforce.com/v1/docs/
 *
 * API: GET https://api.status.salesforce.com/v1/incidents/active
 * Response: Array of active incidents across all Salesforce instances
 */

import prisma from "@/lib/prisma";
import { inferSeverity } from "@/lib/utils/severity";
import type { Vendor } from "@prisma/client";

export async function pollSalesforceTrust(vendor: Vendor) {
  const res = await fetch(
    "https://api.status.salesforce.com/v1/incidents/active",
    {
      headers: {
        "User-Agent": "OutageIntel/1.0 (+https://outageintel.org)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(12_000),
    }
  );

  if (!res.ok) throw new Error(`Salesforce Trust API returned ${res.status}`);

  const incidents = await res.json();

  if (!Array.isArray(incidents) || incidents.length === 0) {
    return { newOutages: [], errors: [] };
  }

  const newOutages: Awaited<ReturnType<typeof prisma.outage.create>>[] = [];
  const errors: string[] = [];

  for (const incident of incidents as Record<string, unknown>[]) {
    try {
      const rawId = incident.id as string | undefined;
      if (!rawId) continue;

      const sourceId = `sf-${String(rawId)}`.slice(0, 512);

      const existing = await prisma.outage.findUnique({
        where: { vendorId_sourceId: { vendorId: vendor.id, sourceId } },
      });

      if (existing) {
        // Update resolved status if applicable
        if (!incident.isActive && !existing.resolvedAt) {
          await prisma.outage.update({
            where: { id: existing.id },
            data: { status: "RESOLVED", resolvedAt: new Date(), updatedAt: new Date() },
          });
        }
        continue;
      }

      const msg = incident.message as Record<string, unknown> | undefined;
      const summary = String(msg?.summary ?? "Salesforce service incident").slice(0, 500);
      const lastUpdate = msg?.lastUpdate as Record<string, unknown> | undefined;
      const descText = String(lastUpdate?.content ?? "").slice(0, 5_000);

      const isActive = Boolean(incident.isActive);
      const startedAt = incident.createdAt
        ? new Date(incident.createdAt as string)
        : new Date();

      const outage = await prisma.outage.create({
        data: {
          vendorId: vendor.id,
          title: summary,
          description: descText || null,
          severity: inferSeverity(summary),
          status: isActive ? "INVESTIGATING" : "RESOLVED",
          sourceId,
          sourceUrl: "https://status.salesforce.com",
          startedAt,
          resolvedAt: isActive ? null : new Date(),
        },
      });

      newOutages.push(outage);
    } catch (itemErr) {
      errors.push(
        `Salesforce item error: ${itemErr instanceof Error ? itemErr.message : String(itemErr)}`
      );
    }
  }

  return { newOutages, errors };
}
