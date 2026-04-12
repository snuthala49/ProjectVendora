/**
 * OutageIntel – Database seed
 * Run with:  npm run db:seed
 *
 * Upserts 14 enterprise IT vendors with verified public status feed URLs.
 * Re-running is safe — uses upsert on `slug`.
 *
 * Validation notes (April 2026):
 *   - Okta:       status.okta.com returns 401 for ALL requests — no public API → NONE
 *   - Broadcom:   Uses Sorry™ (sorryapp.com), API at /api/v1/notices → CUSTOM_JSON
 *   - ServiceNow: No public status page exists → NONE
 *   - CrowdStrike: No public status page — blog RSS is only fallback
 */

import { PrismaClient, FeedType, VendorCategory } from "@prisma/client";

const prisma = new PrismaClient();

// Slugs present in the old seed that are being retired
const RETIRED_SLUGS = ["atlassian", "datadog", "twilio", "gcp", "m365"];

const vendors = [

  // ─── GROUP A: STATUSPAGE.IO VENDORS ───────────────────────────────────────
  {
    name: "GitHub",
    slug: "github",
    statusPageUrl: "https://www.githubstatus.com",
    feedUrl: "https://www.githubstatus.com/api/v2/summary.json",
    incidentsUrl: "https://www.githubstatus.com/api/v2/incidents/unresolved.json",
    allIncidentsUrl: "https://www.githubstatus.com/api/v2/incidents.json",
    rssUrl: "https://www.githubstatus.com/history.rss",
    feedType: FeedType.STATUSPAGE_JSON,
    logoEmoji: "🐙",
    category: VendorCategory.DEVOPS,
  },

  {
    name: "Cloudflare",
    slug: "cloudflare",
    statusPageUrl: "https://www.cloudflarestatus.com",
    feedUrl: "https://www.cloudflarestatus.com/api/v2/summary.json",
    incidentsUrl: "https://www.cloudflarestatus.com/api/v2/incidents/unresolved.json",
    allIncidentsUrl: "https://www.cloudflarestatus.com/api/v2/incidents.json",
    rssUrl: "https://www.cloudflarestatus.com/history.rss",
    feedType: FeedType.STATUSPAGE_JSON,
    logoEmoji: "🌐",
    category: VendorCategory.NETWORKING,
  },

  {
    name: "Zoom",
    slug: "zoom",
    statusPageUrl: "https://status.zoom.us",
    feedUrl: "https://status.zoom.us/api/v2/summary.json",
    incidentsUrl: "https://status.zoom.us/api/v2/incidents/unresolved.json",
    allIncidentsUrl: "https://status.zoom.us/api/v2/incidents.json",
    rssUrl: "https://status.zoom.us/history.rss",
    feedType: FeedType.STATUSPAGE_JSON,
    logoEmoji: "📹",
    category: VendorCategory.COMMUNICATION,
  },

  {
    name: "Okta",
    slug: "okta",
    statusPageUrl: "https://status.okta.com",
    feedUrl: null,          // status.okta.com returns 401 for all public requests
    incidentsUrl: null,
    allIncidentsUrl: null,
    rssUrl: null,
    feedType: FeedType.NONE,
    logoEmoji: "🔐",
    category: VendorCategory.SECURITY,
  },

  // ─── GROUP B: CUSTOM JSON APIs ────────────────────────────────────────────

  {
    name: "Slack",
    slug: "slack",
    statusPageUrl: "https://slack-status.com",
    feedUrl: "https://slack-status.com/api/v2.0.0/current",
    incidentsUrl: "https://slack-status.com/api/v2.0.0/current",
    allIncidentsUrl: "https://slack-status.com/api/v2.0.0/history",
    rssUrl: null,
    feedType: FeedType.CUSTOM_JSON,
    logoEmoji: "💬",
    category: VendorCategory.COMMUNICATION,
  },

  {
    name: "Salesforce",
    slug: "salesforce",
    statusPageUrl: "https://status.salesforce.com",
    feedUrl: "https://api.status.salesforce.com/v1/incidents/active",
    incidentsUrl: "https://api.status.salesforce.com/v1/incidents/active",
    allIncidentsUrl: "https://api.status.salesforce.com/v1/incidents",
    rssUrl: null,
    feedType: FeedType.CUSTOM_JSON,
    logoEmoji: "☁️",
    category: VendorCategory.CRM,
  },

  {
    name: "AWS",
    slug: "aws",
    statusPageUrl: "https://health.aws.amazon.com/health/status",
    feedUrl: "https://status.aws.amazon.com/rss/health.rss",
    incidentsUrl: "https://status.aws.amazon.com/rss/health.rss",
    allIncidentsUrl: "https://status.aws.amazon.com/rss/health.rss",
    rssUrl: "https://status.aws.amazon.com/rss/health.rss",
    feedType: FeedType.RSS,
    logoEmoji: "☁️",
    category: VendorCategory.CLOUD,
  },

  {
    name: "Microsoft Azure",
    slug: "azure",
    statusPageUrl: "https://azure.status.microsoft",
    feedUrl: "https://azure.status.microsoft/en-us/status/feed/",
    incidentsUrl: "https://azure.status.microsoft/en-us/status/feed/",
    allIncidentsUrl: "https://azure.status.microsoft/en-us/status/history/",
    rssUrl: "https://azure.status.microsoft/en-us/status/feed/",
    feedType: FeedType.RSS,
    logoEmoji: "🔷",
    category: VendorCategory.CLOUD,
  },

  {
    name: "Google Cloud",
    slug: "google-cloud",
    statusPageUrl: "https://status.cloud.google.com",
    feedUrl: "https://status.cloud.google.com/incidents.json",
    incidentsUrl: "https://status.cloud.google.com/incidents.json",
    allIncidentsUrl: "https://status.cloud.google.com/incidents.json",
    rssUrl: "https://status.cloud.google.com/en/feed.atom",
    feedType: FeedType.CUSTOM_JSON,
    logoEmoji: "🌩️",
    category: VendorCategory.CLOUD,
  },

  {
    name: "Google Workspace",
    slug: "google-workspace",
    statusPageUrl: "https://www.google.com/appsstatus/dashboard",
    feedUrl: "https://www.google.com/appsstatus/dashboard/incidents.json",
    incidentsUrl: "https://www.google.com/appsstatus/dashboard/incidents.json",
    allIncidentsUrl: "https://www.google.com/appsstatus/dashboard/incidents.json",
    rssUrl: "https://www.google.com/appsstatus/rss/en",
    feedType: FeedType.CUSTOM_JSON,
    logoEmoji: "📧",
    category: VendorCategory.PRODUCTIVITY,
  },

  // ─── GROUP C: NO/LIMITED PUBLIC API ───────────────────────────────────────

  {
    name: "CrowdStrike",
    slug: "crowdstrike",
    statusPageUrl: "https://www.crowdstrike.com/en-us/blog/",
    feedUrl: "https://www.crowdstrike.com/en-us/blog/feed/",
    incidentsUrl: "https://www.crowdstrike.com/en-us/blog/feed/",
    allIncidentsUrl: "https://www.crowdstrike.com/en-us/blog/feed/",
    rssUrl: "https://www.crowdstrike.com/en-us/blog/feed/",
    feedType: FeedType.RSS_BLOG_FALLBACK,
    logoEmoji: "🦅",
    category: VendorCategory.SECURITY,
  },

  {
    name: "ServiceNow",
    slug: "servicenow",
    statusPageUrl: null,
    feedUrl: null,
    incidentsUrl: null,
    allIncidentsUrl: null,
    rssUrl: null,
    feedType: FeedType.NONE,
    logoEmoji: "🔧",
    category: VendorCategory.ITSM,
  },

  {
    name: "Microsoft 365",
    slug: "microsoft-365",
    statusPageUrl: "https://portal.office.com/servicestatus",
    feedUrl: "https://azure.status.microsoft/en-us/status/feed/",
    incidentsUrl: "https://azure.status.microsoft/en-us/status/feed/",
    allIncidentsUrl: "https://azure.status.microsoft/en-us/status/history/",
    rssUrl: "https://azure.status.microsoft/en-us/status/feed/",
    feedType: FeedType.RSS_PARTIAL,
    logoEmoji: "📊",
    category: VendorCategory.PRODUCTIVITY,
  },

  {
    // Broadcom uses Sorry™ (sorryapp.com) — NOT Statuspage.
    // Verified API: GET /api/v1/notices returns { notices: [...] }
    name: "Broadcom",
    slug: "broadcom",
    statusPageUrl: "https://status.broadcom.com",
    feedUrl: "https://status.broadcom.com/api/v1/notices",
    incidentsUrl: "https://status.broadcom.com/api/v1/notices",
    allIncidentsUrl: "https://status.broadcom.com/api/v1/notices",
    rssUrl: null,
    feedType: FeedType.CUSTOM_JSON,
    logoEmoji: "⚡",
    category: VendorCategory.SECURITY,
  },
];

async function main() {
  console.log("🌱  Seeding OutageIntel database…\n");

  // Remove retired vendors that are no longer tracked
  const deleted = await prisma.vendor.deleteMany({
    where: { slug: { in: RETIRED_SLUGS } },
  });
  if (deleted.count > 0) {
    console.log(`🗑️   Removed ${deleted.count} retired vendor(s): ${RETIRED_SLUGS.join(", ")}\n`);
  }

  let created = 0;
  let updated = 0;

  for (const vendor of vendors) {
    const result = await prisma.vendor.upsert({
      where: { slug: vendor.slug },
      update: { ...vendor },
      create: { ...vendor },
    });

    const isNew =
      Math.abs(result.createdAt.getTime() - result.updatedAt.getTime()) < 1000;
    if (isNew) {
      console.log(`  ✅  Created  ${vendor.logoEmoji}  ${vendor.name}`);
      created++;
    } else {
      console.log(`  🔄  Updated  ${vendor.logoEmoji}  ${vendor.name}`);
      updated++;
    }
  }

  console.log(
    `\n🎉  Done — ${created} created, ${updated} updated (${vendors.length} total vendors)\n`
  );
}

main()
  .catch((err) => {
    console.error("❌  Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

