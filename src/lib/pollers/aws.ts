/**
 * lib/pollers/aws.ts
 *
 * AWS Health Status — global RSS feed.
 * Uses the existing pollRSSFeed function.
 *
 * Feed: https://status.aws.amazon.com/rss/health.rss
 * Note: 1800+ per-service RSS feeds exist but health.rss is the global summary.
 * Note: AWS Health API (paid) is not used here — RSS is the public method.
 */

import { pollRSSFeed } from "@/lib/pollers/generic-rss";
import type { Vendor } from "@prisma/client";

export async function pollAwsRss(vendor: Vendor) {
  if (!vendor.feedUrl) return { newOutages: [], errors: [] };
  return pollRSSFeed(vendor.id, vendor.feedUrl);
}
