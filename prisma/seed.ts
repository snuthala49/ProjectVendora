/**
 * OutageIntel – Database seed
 * Run with:  npm run db:seed
 *
 * Upserts 16 enterprise IT vendors with their public status feed URLs.
 * Re-running is safe — uses upsert on `slug`.
 */

import { PrismaClient, FeedType, VendorCategory } from "@prisma/client";

const prisma = new PrismaClient();

const vendors = [
  // ── Cloud Platforms ──────────────────────────────────────────────────────
  {
    name: "Amazon Web Services",
    slug: "aws",
    feedUrl: "https://status.aws.amazon.com/rss/all.rss",
    feedType: FeedType.RSS,
    statusPageUrl: "https://status.aws.amazon.com",
    logoEmoji: "☁️",
    category: VendorCategory.CLOUD,
  },
  {
    name: "Microsoft Azure",
    slug: "azure",
    feedUrl: "https://azurestatuscdn.azureedge.net/en-us/status/feed/",
    feedType: FeedType.RSS,
    statusPageUrl: "https://status.azure.com",
    logoEmoji: "🔷",
    category: VendorCategory.CLOUD,
  },
  {
    name: "Google Cloud Platform",
    slug: "gcp",
    feedUrl: "https://status.cloud.google.com/en/feed.atom",
    feedType: FeedType.ATOM,
    statusPageUrl: "https://status.cloud.google.com",
    logoEmoji: "🌩️",
    category: VendorCategory.CLOUD,
  },

  // ── Productivity / Collaboration ─────────────────────────────────────────
  {
    name: "Microsoft 365",
    slug: "m365",
    feedUrl: "https://status.office365.com/api/MSCommerce/2010/Products",
    feedType: FeedType.JSON,
    statusPageUrl: "https://status.office.com",
    logoEmoji: "📧",
    category: VendorCategory.PRODUCTIVITY,
  },
  {
    name: "Zoom",
    slug: "zoom",
    feedUrl: "https://status.zoom.us/history.rss",
    feedType: FeedType.RSS,
    statusPageUrl: "https://status.zoom.us",
    logoEmoji: "📹",
    category: VendorCategory.COMMUNICATION,
  },
  {
    name: "Slack",
    slug: "slack",
    feedUrl: "https://status.slack.com/history.rss",
    feedType: FeedType.RSS,
    statusPageUrl: "https://status.slack.com",
    logoEmoji: "💬",
    category: VendorCategory.COMMUNICATION,
  },

  // ── Security ─────────────────────────────────────────────────────────────
  {
    name: "CrowdStrike",
    slug: "crowdstrike",
    feedUrl: "https://status.crowdstrike.com/history.rss",
    feedType: FeedType.RSS,
    statusPageUrl: "https://status.crowdstrike.com",
    logoEmoji: "🦅",
    category: VendorCategory.SECURITY,
  },
  {
    name: "Okta",
    slug: "okta",
    feedUrl: "https://status.okta.com/history.rss",
    feedType: FeedType.RSS,
    statusPageUrl: "https://status.okta.com",
    logoEmoji: "🔐",
    category: VendorCategory.SECURITY,
  },
  {
    name: "Broadcom (Symantec / Carbon Black)",
    slug: "broadcom",
    feedUrl: "https://status.broadcom.com/history.rss",
    feedType: FeedType.RSS,
    statusPageUrl: "https://status.broadcom.com",
    logoEmoji: "⚡",
    category: VendorCategory.SECURITY,
  },

  // ── Networking / CDN ─────────────────────────────────────────────────────
  {
    name: "Cloudflare",
    slug: "cloudflare",
    feedUrl: "https://www.cloudflarestatus.com/history.rss",
    feedType: FeedType.RSS,
    statusPageUrl: "https://www.cloudflarestatus.com",
    logoEmoji: "🌐",
    category: VendorCategory.NETWORKING,
  },

  // ── DevOps / SCM ─────────────────────────────────────────────────────────
  {
    name: "GitHub",
    slug: "github",
    feedUrl: "https://www.githubstatus.com/history.rss",
    feedType: FeedType.RSS,
    statusPageUrl: "https://www.githubstatus.com",
    logoEmoji: "🐙",
    category: VendorCategory.DEVOPS,
  },
  {
    name: "Atlassian (Jira / Confluence)",
    slug: "atlassian",
    feedUrl: "https://status.atlassian.com/history.rss",
    feedType: FeedType.RSS,
    statusPageUrl: "https://status.atlassian.com",
    logoEmoji: "🔵",
    category: VendorCategory.DEVOPS,
  },

  // ── CRM / ITSM ───────────────────────────────────────────────────────────
  {
    name: "Salesforce",
    slug: "salesforce",
    feedUrl: "https://status.salesforce.com/history.rss",
    feedType: FeedType.RSS,
    statusPageUrl: "https://status.salesforce.com",
    logoEmoji: "☁️",
    category: VendorCategory.CRM,
  },
  {
    name: "ServiceNow",
    slug: "servicenow",
    feedUrl: "https://status.servicenow.com/history.rss",
    feedType: FeedType.RSS,
    statusPageUrl: "https://status.servicenow.com",
    logoEmoji: "🔧",
    category: VendorCategory.ITSM,
  },

  // ── Monitoring ───────────────────────────────────────────────────────────
  {
    name: "Datadog",
    slug: "datadog",
    feedUrl: "https://status.datadoghq.com/history.rss",
    feedType: FeedType.RSS,
    statusPageUrl: "https://status.datadoghq.com",
    logoEmoji: "📊",
    category: VendorCategory.MONITORING,
  },

  // ── Communications ───────────────────────────────────────────────────────
  {
    name: "Twilio",
    slug: "twilio",
    feedUrl: "https://status.twilio.com/history.rss",
    feedType: FeedType.RSS,
    statusPageUrl: "https://status.twilio.com",
    logoEmoji: "📱",
    category: VendorCategory.COMMUNICATION,
  },
] as const;

async function main() {
  console.log("🌱  Seeding OutageIntel database…\n");

  let created = 0;
  let updated = 0;

  for (const vendor of vendors) {
    const result = await prisma.vendor.upsert({
      where: { slug: vendor.slug },
      update: { ...vendor },
      create: { ...vendor },
    });

    const isNew = result.createdAt.getTime() === result.updatedAt.getTime();
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
