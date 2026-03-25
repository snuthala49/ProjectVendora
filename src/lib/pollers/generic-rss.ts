/**
 * lib/pollers/generic-rss.ts
 *
 * Core polling logic for RSS, ATOM and JSON status feeds.
 *
 * Key responsibilities
 * ────────────────────
 *  • Fetch & parse the feed
 *  • Deduplicate via externalId (`sourceId` column) + `vendorId`
 *  • Update an existing outage's status when it moves to RESOLVED
 *  • Return newly created outage records (with vendor snippet included)
 *  • Infer Severity + OutageStatus from natural-language title/body text
 */

import Parser from "rss-parser";
import prisma from "@/lib/prisma";
import type { Severity, OutageStatus } from "@/types";

// ─── RSS parser ──────────────────────────────────────────────────────────────

const parser = new Parser({
  timeout: 12_000,
  headers: {
    "User-Agent": "OutageIntelOutageBot/1.0 (https://github.com/outageintel)",
    Accept:
      "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
  },
  customFields: {
    feed: ["subtitle"],
    item: [["content:encoded", "contentEncoded"]],
  },
});

// ─── Severity inference ──────────────────────────────────────────────────────

const SEVERITY_PATTERNS: Array<[Severity, RegExp]> = [
  [
    "CRITICAL",
    /critical|major\s+outage|complete\s+outage|service\s+unavailable|total\s+failure|widespread\s+outage|emergency/i,
  ],
  [
    "HIGH",
    /high\s+impact|significant|partial\s+outage|major\s+degradation|service\s+disruption|elevated\s+error/i,
  ],
  [
    "MEDIUM",
    /moderate|degraded\s+performance|slow\s+response|latency|intermittent|partial\s+degradation/i,
  ],
  [
    "LOW",
    /low\s+impact|minor|informational|maintenance|scheduled|post-?mortem|resolved/i,
  ],
];

export function inferSeverity(text: string): Severity {
  for (const [sev, re] of SEVERITY_PATTERNS) {
    if (re.test(text)) return sev;
  }
  return "UNKNOWN";
}

// ─── Status inference ────────────────────────────────────────────────────────

const STATUS_PATTERNS: Array<[OutageStatus, RegExp]> = [
  ["RESOLVED", /resolv|fixed|complet|clos|recover|restor|post-?mortem/i],
  ["MONITORING", /monitor|watch|verif|observ|checking/i],
  ["IDENTIFIED", /identif|found|diagnos|root\s+cause/i],
  ["INVESTIGATING", /investigat|looking\s+into|aware\s+of|started|reported/i],
];

export function inferStatus(text: string): OutageStatus {
  for (const [status, re] of STATUS_PATTERNS) {
    if (re.test(text)) return status;
  }
  return "INVESTIGATING";
}

// ─── Vendor selector ─────────────────────────────────────────────────────────

const VENDOR_SELECT = {
  id: true,
  name: true,
  slug: true,
  logoEmoji: true,
  category: true,
  statusPageUrl: true,
} as const;

// ─── RSS / ATOM poller ───────────────────────────────────────────────────────

export async function pollRSSFeed(vendorId: string, feedUrl: string) {
  const newOutages: Awaited<ReturnType<typeof prisma.outage.create>>[] = [];
  const errors: string[] = [];

  let feed;
  try {
    feed = await parser.parseURL(feedUrl);
  } catch (err) {
    errors.push(
      `Feed fetch failed: ${err instanceof Error ? err.message : String(err)}`
    );
    return { newOutages, errors };
  }

  for (const item of feed.items.slice(0, 50)) {
    try {
      const rawId =
        item.guid ??
        item.link ??
        ((item as { id?: string }).id ?? null) ??
        item.title;
      if (!rawId) continue;

      const externalId = String(rawId).slice(0, 512);
      const titleText = (item.title ?? "Unknown Outage").slice(0, 500);
      const descText = (
        item.contentSnippet ??
        item.content ??
        item.contentEncoded ??
        item.summary ??
        ""
      ).slice(0, 5_000);
      const fullText = `${titleText} ${descText}`;

      // ── Deduplication ────────────────────────────────────────────────────
      const existing = await prisma.outage.findUnique({
        where: { vendorId_sourceId: { vendorId, sourceId: externalId } },
      });

      if (existing) {
        // Upgrade to RESOLVED if the feed now says so and we haven't yet.
        if (inferStatus(fullText) === "RESOLVED" && !existing.resolvedAt) {
          await prisma.outage.update({
            where: { id: existing.id },
            data: {
              status: "RESOLVED",
              resolvedAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
        continue;
      }

      // ── New outage ───────────────────────────────────────────────────────
      const severity = inferSeverity(fullText);
      const status = inferStatus(fullText);
      const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
      const isResolved = status === "RESOLVED";

      const outage = await prisma.outage.create({
        data: {
          vendorId,
          title: titleText,
          description: descText || null,
          severity,
          status,
          sourceId: externalId,
          sourceUrl: item.link ?? null,
          startedAt: pubDate,
          resolvedAt: isResolved ? new Date() : null,
        },
        include: { vendor: { select: VENDOR_SELECT } },
      });

      newOutages.push(outage);
    } catch (itemErr) {
      errors.push(
        `Item error: ${itemErr instanceof Error ? itemErr.message : String(itemErr)}`
      );
    }
  }

  return { newOutages, errors };
}

// ─── JSON (Statuspage.io) poller ─────────────────────────────────────────────

export async function pollJSONFeed(vendorId: string, feedUrl: string) {
  const newOutages: Awaited<ReturnType<typeof prisma.outage.create>>[] = [];
  const errors: string[] = [];

  let data: Record<string, unknown>;
  try {
    const res = await fetch(feedUrl, {
      headers: {
        "User-Agent": "OutageIntelOutageBot/1.0",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok)
      throw new Error(`HTTP ${res.status} ${res.statusText}`);

    data = await res.json();
  } catch (err) {
    errors.push(
      `Feed fetch failed: ${err instanceof Error ? err.message : String(err)}`
    );
    return { newOutages, errors };
  }

  // Statuspage.io format: { incidents: [...] }
  // Google Cloud format:  { items: [...] }
  const incidents: Record<string, unknown>[] =
    (data.incidents as Record<string, unknown>[]) ??
    (data.items as Record<string, unknown>[]) ??
    [];

  for (const inc of incidents.slice(0, 50)) {
    try {
      const rawId = (inc.id ?? inc.guid) as string | undefined;
      if (!rawId) continue;

      const externalId = String(rawId).slice(0, 512);
      const titleText = String(inc.name ?? inc.title ?? "Unknown Outage").slice(
        0,
        500
      );

      // Pull description from first incident_update body or summary field
      const updates = inc.incident_updates as
        | Array<{ body?: string }>
        | undefined;
      const descText = String(
        updates?.[0]?.body ?? inc.body ?? inc.description ?? ""
      ).slice(0, 5_000);
      const impactText = String(inc.impact ?? "");
      const statusText = String(inc.status ?? "");
      const fullText = `${impactText} ${statusText} ${titleText} ${descText}`;

      // ── Deduplication ────────────────────────────────────────────────────
      const existing = await prisma.outage.findUnique({
        where: { vendorId_sourceId: { vendorId, sourceId: externalId } },
      });

      if (existing) {
        const isNowResolved =
          statusText === "resolved" || !!(inc.resolved_at as string | null);
        if (isNowResolved && !existing.resolvedAt) {
          await prisma.outage.update({
            where: { id: existing.id },
            data: {
              status: "RESOLVED",
              resolvedAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
        continue;
      }

      // ── New outage ───────────────────────────────────────────────────────
      const severity = inferSeverity(fullText);
      const resolvedAt = inc.resolved_at
        ? new Date(inc.resolved_at as string)
        : null;
      const startedAt = inc.created_at
        ? new Date(inc.created_at as string)
        : inc.started_at
          ? new Date(inc.started_at as string)
          : new Date();

      const outage = await prisma.outage.create({
        data: {
          vendorId,
          title: titleText,
          description: descText || null,
          severity,
          status: resolvedAt ? "RESOLVED" : inferStatus(fullText),
          sourceId: externalId,
          sourceUrl:
            (inc.shortlink as string | null) ??
            (inc.url as string | null) ??
            null,
          startedAt,
          resolvedAt,
        },
        include: { vendor: { select: VENDOR_SELECT } },
      });

      newOutages.push(outage);
    } catch (itemErr) {
      errors.push(
        `Item error: ${itemErr instanceof Error ? itemErr.message : String(itemErr)}`
      );
    }
  }

  return { newOutages, errors };
}
