/**
 * lib/pollers/azure.ts
 *
 * Microsoft Azure / Microsoft 365 — RSS/Atom feed.
 * Uses the existing pollRSSFeed function.
 *
 * Feed: https://azure.status.microsoft/en-us/status/feed/
 * Note: Only reports widespread Scenario 1/2/3 events.
 * Note: This same feed is used for Microsoft 365 (partial coverage).
 */

import { pollRSSFeed } from "@/lib/pollers/generic-rss";
import type { Vendor } from "@prisma/client";

export async function pollAzureRss(vendor: Vendor) {
  if (!vendor.feedUrl) return { newOutages: [], errors: [] };
  return pollRSSFeed(vendor.id, vendor.feedUrl);
}
