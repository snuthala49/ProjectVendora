/**
 * lib/pollers/gcp.ts
 *
 * Google Cloud Platform — custom JSON incidents feed.
 * Docs: https://cloud.google.com/support/docs/dashboard
 *
 * API: GET https://status.cloud.google.com/incidents.json
 * Response: JSON array of all incidents (most recent first when sorted by begin)
 *
 * Only polls incidents where is_currently_affecting is true (active incidents).
 */

import prisma from "@/lib/prisma";
import { inferSeverity, inferStatus } from "@/lib/utils/severity";
import type { Vendor } from "@prisma/client";

interface GcpIncident {
  id?: string;
  number?: number;
  external_desc?: string;
  begin?: string;
  end?: string | null;
  uri?: string;
  status_impact?: string;
  severity?: string;
  is_currently_affecting?: boolean;
  affected_products?: Array<{ title?: string; id?: string }>;
  most_recent_update?: { text?: string; created?: string };
  updates?: Array<{ text?: string; when?: string }>;
}

export async function pollGcpJson(vendor: Vendor) {
  if (!vendor.feedUrl) return { newOutages: [], errors: [] };

  const newOutages: Awaited<ReturnType<typeof prisma.outage.create>>[] = [];
  const errors: string[] = [];

  let incidents: GcpIncident[];
  try {
    const res = await fetch(vendor.feedUrl, {
      headers: {
        "User-Agent": "OutageIntel/1.0 (+https://outageintel.org)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    incidents = await res.json();
    if (!Array.isArray(incidents)) throw new Error("Expected JSON array");
  } catch (err) {
    errors.push(
      `GCP fetch failed: ${err instanceof Error ? err.message : String(err)}`
    );
    return { newOutages, errors };
  }

  // Process only active incidents (or recent — cap at 50)
  const relevant = incidents
    .filter((i) => i.is_currently_affecting === true || !i.end)
    .slice(0, 50);

  for (const inc of relevant) {
    try {
      const rawId = inc.id ?? String(inc.number ?? "");
      if (!rawId) continue;

      const sourceId = `gcp-${rawId}`.slice(0, 512);

      const existing = await prisma.outage.findUnique({
        where: { vendorId_sourceId: { vendorId: vendor.id, sourceId } },
      });

      if (existing) {
        // Mark resolved if end date is now present
        if (inc.end && !existing.resolvedAt) {
          await prisma.outage.update({
            where: { id: existing.id },
            data: { status: "RESOLVED", resolvedAt: new Date(inc.end), updatedAt: new Date() },
          });
        }
        continue;
      }

      const titleText = String(inc.external_desc ?? "Google Cloud incident").slice(0, 500);
      const descText = String(inc.most_recent_update?.text ?? "").slice(0, 5_000);
      const fullText = `${titleText} ${descText} ${inc.status_impact ?? ""}`;

      const severity = inferSeverity(fullText);
      const status = inc.end ? "RESOLVED" : inferStatus(fullText);
      const startedAt = inc.begin ? new Date(inc.begin) : new Date();
      const resolvedAt = inc.end ? new Date(inc.end) : null;

      const outage = await prisma.outage.create({
        data: {
          vendorId: vendor.id,
          title: titleText,
          description: descText || null,
          severity,
          status,
          sourceId,
          sourceUrl: inc.uri ?? vendor.statusPageUrl ?? null,
          startedAt,
          resolvedAt,
        },
      });

      newOutages.push(outage);
    } catch (itemErr) {
      errors.push(
        `GCP item error: ${itemErr instanceof Error ? itemErr.message : String(itemErr)}`
      );
    }
  }

  return { newOutages, errors };
}
