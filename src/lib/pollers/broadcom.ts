/**
 * lib/pollers/broadcom.ts
 *
 * Broadcom Service Status — uses Sorry™ platform (sorryapp.com), NOT Statuspage.
 * Verified API: GET https://status.broadcom.com/api/v1/notices
 * Response: { notices: [{ id, type, state, subject, url, begins_at, ends_at, latest_update }] }
 *
 * Notice types: "planned" (maintenance) | "incident"
 * Notice states: "scheduled" | "active" | "complete"
 */

import prisma from "@/lib/prisma";
import { inferSeverity } from "@/lib/utils/severity";
import type { Vendor } from "@prisma/client";

interface SorryNotice {
  id: number | string;
  type: "planned" | "incident" | string;
  state: "scheduled" | "active" | "complete" | string;
  subject: string;
  url?: string;
  begins_at?: string;
  ends_at?: string;
  began_at?: string;
  ended_at?: string;
  created_at?: string;
  updated_at?: string;
  latest_update?: {
    content?: string;
    state?: string;
  };
}

export async function pollBroadcomStatus(vendor: Vendor) {
  if (!vendor.feedUrl) return { newOutages: [], errors: [] };

  const newOutages: Awaited<ReturnType<typeof prisma.outage.create>>[] = [];
  const errors: string[] = [];

  let notices: SorryNotice[];
  try {
    const res = await fetch(vendor.feedUrl, {
      headers: {
        "User-Agent": "OutageIntel/1.0 (+https://outageintel.org)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const data = await res.json();
    notices = (data.notices as SorryNotice[]) ?? [];
  } catch (err) {
    errors.push(
      `Broadcom fetch failed: ${err instanceof Error ? err.message : String(err)}`
    );
    return { newOutages, errors };
  }

  // Focus on active incidents (not planned maintenance or completed events)
  const activeNotices = notices.filter(
    (n) => n.state === "active" || n.type === "incident"
  );

  for (const notice of activeNotices.slice(0, 50)) {
    try {
      const sourceId = `broadcom-${String(notice.id)}`.slice(0, 512);

      const existing = await prisma.outage.findUnique({
        where: { vendorId_sourceId: { vendorId: vendor.id, sourceId } },
      });

      if (existing) {
        if (notice.state === "complete" && !existing.resolvedAt) {
          const endedAt = notice.ended_at ?? notice.ends_at;
          await prisma.outage.update({
            where: { id: existing.id },
            data: {
              status: "RESOLVED",
              resolvedAt: endedAt ? new Date(endedAt) : new Date(),
              updatedAt: new Date(),
            },
          });
        }
        continue;
      }

      const titleText = String(notice.subject ?? "Broadcom service incident").slice(0, 500);
      const descText = String(notice.latest_update?.content ?? "").slice(0, 5_000);

      const isResolved = notice.state === "complete";
      const startedAt = notice.began_at ?? notice.begins_at ?? notice.created_at;
      const endedAt = notice.ended_at ?? notice.ends_at;

      const outage = await prisma.outage.create({
        data: {
          vendorId: vendor.id,
          title: titleText,
          description: descText || null,
          severity: inferSeverity(titleText),
          status: isResolved ? "RESOLVED" : "INVESTIGATING",
          sourceId,
          sourceUrl: notice.url ?? vendor.statusPageUrl ?? null,
          startedAt: startedAt ? new Date(startedAt) : new Date(),
          resolvedAt: isResolved && endedAt ? new Date(endedAt) : null,
        },
      });

      newOutages.push(outage);
    } catch (itemErr) {
      errors.push(
        `Broadcom item error: ${itemErr instanceof Error ? itemErr.message : String(itemErr)}`
      );
    }
  }

  return { newOutages, errors };
}
