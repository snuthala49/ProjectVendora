// scripts/validate-seed.ts
// Run: npx tsx scripts/validate-seed.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function validateSeed() {
  console.log("\n=== OutageIntel Seed Validation ===\n");

  const vendors = await prisma.vendor.findMany({ orderBy: { name: "asc" } });
  console.log(`Total vendors in DB: ${vendors.length}`);

  const expected = [
    "github",
    "cloudflare",
    "zoom",
    "okta",
    "slack",
    "salesforce",
    "aws",
    "azure",
    "google-cloud",
    "google-workspace",
    "crowdstrike",
    "servicenow",
    "microsoft-365",
    "broadcom",
  ];

  const found    = vendors.map((v) => v.slug);
  const missing  = expected.filter((slug) => !found.includes(slug));
  const retired  = ["atlassian", "datadog", "twilio", "gcp", "m365"];
  const retiredStillPresent = retired.filter((slug) => found.includes(slug));
  const noFeed   = vendors.filter(
    (v) => !v.feedUrl && v.feedType !== "NONE"
  );

  console.log("\n" + "Vendor".padEnd(25) + "FeedType".padEnd(32) + "FeedUrl");
  console.log("─".repeat(95));
  for (const v of vendors) {
    const url = v.feedUrl
      ? v.feedUrl.length > 45
        ? v.feedUrl.substring(0, 45) + "…"
        : v.feedUrl
      : "(none)";
    console.log(
      v.name.padEnd(25) + v.feedType.padEnd(32) + url
    );
  }

  let exitCode = 0;

  if (missing.length > 0) {
    console.error(`\n❌ Missing vendor slugs: ${missing.join(", ")}`);
    exitCode = 1;
  }

  if (retiredStillPresent.length > 0) {
    console.warn(
      `\n⚠️  Retired vendors still in DB: ${retiredStillPresent.join(", ")}`
    );
  }

  if (noFeed.length > 0) {
    console.warn(
      `\n⚠️  Vendors with no feedUrl (not NONE type): ${noFeed.map((v) => v.slug).join(", ")}`
    );
  }

  if (exitCode === 0) {
    console.log(
      `\n✅ Seed validation complete — all ${expected.length} expected vendors present.\n`
    );
  }

  await prisma.$disconnect();
  process.exit(exitCode);
}

validateSeed().catch(async (err) => {
  console.error("Seed validation error:", err);
  await prisma.$disconnect();
  process.exit(1);
});
