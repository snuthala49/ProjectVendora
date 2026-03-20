/**
 * lib/pollers/index.ts
 *
 * Orchestrates polling all active vendors.
 * Used by:  GET /api/cron/poll
 */

import prisma from "@/lib/prisma";
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
      const pollResult =
        vendor.feedType === "JSON"
          ? await pollJSONFeed(vendor.id, vendor.feedUrl)
          : await pollRSSFeed(vendor.id, vendor.feedUrl);

      result.newOutageCount = pollResult.newOutages.length;
      result.errors = pollResult.errors;
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
