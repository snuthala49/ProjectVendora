/**
 * lib/pollers/google-workspace.ts
 *
 * Google Workspace (Google Apps Status) — custom JSON incidents feed.
 * Dashboard: https://www.google.com/appsstatus/dashboard
 *
 * API: GET https://www.google.com/appsstatus/dashboard/incidents.json
 * Response is a JSON array of incident objects.
 */

import prisma from "@/lib/prisma";
import { inferSeverity, inferStatus } from "@/lib/utils/severity";
import type { Vendor } from "@prisma/client";

export async function pollGoogleWorkspaceJson(vendor: Vendor) {
  if (!vendor.feedUrl) return { newOutages: [], errors: [] };

  const newOutages: Awaited<ReturnType<typeof prisma.outage.create>>[] = [];
  const errors: string[] = [];

  let data: unknown;
  try {
    const res = await fetch(vendor.feedUrl, {
      headers: {
        "User-Agent": "OutageIntel/1.0 (+https://outageintel.org)",
        Accept: "application/json, */*",
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const text = await res.text();
    // Google sometimes prefixes with )]}' anti-hijacking prefix
    const cleaned = text.startsWith(")]}'\n") ? text.slice(5) : text;
    data = JSON.parse(cleaned);
  } catch (err) {
    errors.push(
      `Google Workspace fetch failed: ${err instanceof Error ? err.message : String(err)}`
    );
    return { newOutages, errors };
  }

  // The response can be an array or an object with an incidents/items key
  const incidents = (Array.isArray(data)
    ? data
    : (((data as Record<string, unknown>).incidents ??
        (data as Record<string, unknown>).items ??
        []) as unknown[])
  ) as Record<string, unknown>[];

  for (const inc of incidents.slice(0, 50)) {
    try {
      const rawId = (inc.id ?? inc.number) as string | number | undefined;
      if (rawId === undefined) continue;

      const sourceId = `gws-${String(rawId)}`.slice(0, 512);

      const existing = await prisma.outage.findUnique({
        where: { vendorId_sourceId: { vendorId: vendor.id, sourceId } },
      });
      if (existing) continue;

      const titleText = String(
        inc.title ?? inc.name ?? inc.external_desc ?? "Google Workspace incident"
      ).slice(0, 500);

      const updates = inc.updates as Array<{ text?: string }> | undefined;
      const descText = String(
        inc.most_recent_update
          ? (inc.most_recent_update as Record<string, string>).text
          : updates?.[0]?.text ?? ""
      ).slice(0, 5_000);

      const fullText = `${titleText} ${descText}`;
      const endDate = (inc.end ?? inc.resolved_at ?? inc.ended_at) as string | null | undefined;
      const startDate = (inc.begin ?? inc.created_at ?? inc.started_at) as string | undefined;

      const outage = await prisma.outage.create({
        data: {
          vendorId: vendor.id,
          title: titleText,
          description: descText || null,
          severity: inferSeverity(fullText),
          status: endDate ? "RESOLVED" : inferStatus(fullText),
          sourceId,
          sourceUrl: (inc.uri ?? inc.url ?? vendor.statusPageUrl ?? null) as string | null,
          startedAt: startDate ? new Date(startDate) : new Date(),
          resolvedAt: endDate ? new Date(endDate) : null,
        },
      });

      newOutages.push(outage);
    } catch (itemErr) {
      errors.push(
        `Google Workspace item error: ${itemErr instanceof Error ? itemErr.message : String(itemErr)}`
      );
    }
  }

  return { newOutages, errors };
}
