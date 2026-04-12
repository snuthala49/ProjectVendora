/**
 * lib/pollers/index.ts
 *
 * Orchestrates polling all active vendors.
 * Routes each vendor to the correct poller based on feedType.
 * Used by:  GET /api/cron/poll
 */

import prisma from "@/lib/prisma";
import { pollStatuspageJson } from "./statuspage-json";
import { pollSlackStatus } from "./slack";
import { pollSalesforceTrust } from "./salesforce";
import { pollAwsRss } from "./aws";
import { pollAzureRss } from "./azure";
import { pollGcpJson } from "./gcp";
import { pollGoogleWorkspaceJson } from "./google-workspace";
import { pollBroadcomStatus } from "./broadcom";
import { pollRSSFeed, pollJSONFeed } from "./generic-rss";
import type { PollVendorResult } from "@/types";

/** How long to pause between vendor requests (ms) — be a good citizen. */
const INTER_REQUEST_DELAY_MS = 600;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function runAllPollers(): Promise<PollVendorResult[]> {
  const vendors = await prisma.vendor.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const results: PollVendorResult[] = [];

  for (const vendor of vendors) {
    const result: PollVendorResult = {
      vendorId: vendor.id,
      vendorName: vendor.name,
      newOutageCount: 0,
      errors: [],
    };

    try {
      let pollResult: { newOutages: unknown[]; errors: string[] } | undefined;

      switch (vendor.feedType) {

        // ── Atlassian Statuspage (GitHub, Cloudflare, Zoom) ────────────────
        case "STATUSPAGE_JSON":
          if (vendor.feedUrl) {
            pollResult = await pollStatuspageJson(vendor);
          }
          break;

        // ── Custom JSON APIs ────────────────────────────────────────────────
        case "CUSTOM_JSON":
          if (vendor.slug === "slack") {
            pollResult = await pollSlackStatus(vendor);
          } else if (vendor.slug === "salesforce") {
            pollResult = await pollSalesforceTrust(vendor);
          } else if (vendor.slug === "google-cloud") {
            pollResult = await pollGcpJson(vendor);
          } else if (vendor.slug === "google-workspace") {
            pollResult = await pollGoogleWorkspaceJson(vendor);
          } else if (vendor.slug === "broadcom") {
            pollResult = await pollBroadcomStatus(vendor);
          } else if (vendor.feedUrl) {
            // Generic fallback for any other CUSTOM_JSON vendor
            pollResult = await pollJSONFeed(vendor.id, vendor.feedUrl);
          }
          break;

        // ── Standard RSS ────────────────────────────────────────────────────
        case "RSS":
          if (vendor.slug === "aws") {
            pollResult = await pollAwsRss(vendor);
          } else if (vendor.slug === "azure") {
            pollResult = await pollAzureRss(vendor);
          } else if (vendor.feedUrl) {
            pollResult = await pollRSSFeed(vendor.id, vendor.feedUrl);
          }
          break;

        // ── RSS Blog / Partial coverage ─────────────────────────────────────
        case "RSS_BLOG_FALLBACK":
        case "RSS_PARTIAL":
          // Poll with the same RSS parser — lower confidence signal
          if (vendor.feedUrl) {
            pollResult = await pollRSSFeed(vendor.id, vendor.feedUrl);
          }
          break;

        // ── Legacy feed types (from original schema) ────────────────────────
        case "JSON":
          if (vendor.feedUrl) {
            pollResult = await pollJSONFeed(vendor.id, vendor.feedUrl);
          }
          break;

        case "ATOM":
          if (vendor.feedUrl) {
            pollResult = await pollRSSFeed(vendor.id, vendor.feedUrl);
          }
          break;

        // ── Unverified Statuspage attempt ───────────────────────────────────
        case "STATUSPAGE_JSON_UNVERIFIED":
          if (vendor.feedUrl) {
            try {
              pollResult = await pollStatuspageJson(vendor);
            } catch (e) {
              console.warn(`[${vendor.slug}] Unverified Statuspage feed failed:`, e);
            }
          }
          break;

        // ── No public feed — skip silently ──────────────────────────────────
        case "NONE":
          // Okta, ServiceNow — no public API, skip
          break;
      }

      result.newOutageCount = pollResult?.newOutages.length ?? 0;
      result.errors = pollResult?.errors ?? [];
    } catch (err) {
      result.errors.push(
        err instanceof Error ? err.message : String(err)
      );
    }

    results.push(result);
    await sleep(INTER_REQUEST_DELAY_MS);
  }

  return results;
}

export { pollRSSFeed, pollJSONFeed };

