// scripts/validate-feeds.ts
// Run: npx tsx scripts/validate-feeds.ts

const FEEDS = [
  // STATUSPAGE_JSON — expect JSON with { status, incidents, components }
  { name: 'GitHub',     url: 'https://www.githubstatus.com/api/v2/summary.json',    expect: 'json', field: 'status' },
  { name: 'Cloudflare', url: 'https://www.cloudflarestatus.com/api/v2/summary.json', expect: 'json', field: 'status' },
  { name: 'Zoom',       url: 'https://status.zoom.us/api/v2/summary.json',           expect: 'json', field: 'status' },
  // NOTE: Okta (status.okta.com) returns HTTP 401 for ALL requests — no public API.
  //       Seeded as feedType NONE and excluded below.

  // CUSTOM_JSON — Slack
  { name: 'Slack',      url: 'https://slack-status.com/api/v2.0.0/current',          expect: 'json', field: 'status' },

  // CUSTOM_JSON — Salesforce Trust API
  { name: 'Salesforce', url: 'https://api.status.salesforce.com/v1/incidents/active', expect: 'json', field: null },

  // CUSTOM_JSON — Google Cloud
  { name: 'Google Cloud', url: 'https://status.cloud.google.com/incidents.json',     expect: 'json', field: null },

  // CUSTOM_JSON — Google Workspace
  { name: 'Google Workspace', url: 'https://www.google.com/appsstatus/dashboard/incidents.json', expect: 'json', field: null },

  // RSS — AWS
  { name: 'AWS',        url: 'https://status.aws.amazon.com/rss/health.rss',          expect: 'rss',  field: null },

  // RSS — Azure
  { name: 'Azure',      url: 'https://azure.status.microsoft/en-us/status/feed/',     expect: 'rss',  field: null },

  // RSS FALLBACK — CrowdStrike blog
  { name: 'CrowdStrike (blog fallback)', url: 'https://www.crowdstrike.com/en-us/blog/feed/', expect: 'rss', field: null },

  // CUSTOM_JSON — Broadcom (Sorry™ platform, not Statuspage)
  { name: 'Broadcom', url: 'https://status.broadcom.com/api/v1/notices', expect: 'json', field: 'notices' },
];

// NOTE: Okta (status.okta.com) returns HTTP 401 for all requests — no public API exists.
//       It is seeded with feedType: NONE and excluded from this validation.
// NOTE: ServiceNow has no public status page — also seeded as NONE.

async function validate() {
  console.log('\n=== OutageIntel Feed Validation ===\n');
  const results: { name: string; status: string; note: string }[] = [];

  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'OutageIntel/1.0 (+https://outageintel.org)' },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        results.push({ name: feed.name, status: '❌ FAIL', note: `HTTP ${res.status}` });
        continue;
      }

      const contentType = res.headers.get('content-type') || '';

      if (feed.expect === 'json') {
        if (!contentType.includes('json')) {
          results.push({ name: feed.name, status: '⚠️  WARN', note: `Expected JSON, got ${contentType}` });
          continue;
        }
        const data = await res.json();
        if (feed.field && !(feed.field in data)) {
          results.push({ name: feed.name, status: '⚠️  WARN', note: `Missing field: ${feed.field}` });
          continue;
        }
        results.push({ name: feed.name, status: '✅ PASS', note: 'JSON OK' });

      } else if (feed.expect === 'rss') {
        const text = await res.text();
        if (!text.includes('<rss') && !text.includes('<feed') && !text.includes('<channel')) {
          results.push({ name: feed.name, status: '⚠️  WARN', note: 'No RSS/Atom tags found' });
          continue;
        }
        results.push({ name: feed.name, status: '✅ PASS', note: 'RSS/Atom OK' });
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ name: feed.name, status: '❌ ERROR', note: msg });
    }
  }

  // Print results table
  console.log('Vendor'.padEnd(35) + 'Status'.padEnd(17) + 'Note');
  console.log('─'.repeat(75));
  for (const r of results) {
    console.log(r.name.padEnd(35) + r.status.padEnd(17) + r.note);
  }

  const passed  = results.filter(r => r.status.startsWith('✅')).length;
  const failed  = results.filter(r => r.status.startsWith('❌')).length;
  const warned  = results.filter(r => r.status.startsWith('⚠️')).length;

  console.log(`\nResult: ${passed} passed, ${warned} warned, ${failed} failed`);

  if (failed > 0) {
    console.error('\n❌ Validation failed. Fix failing feeds before seeding.\n');
    process.exit(1);
  } else {
    console.log('\n✅ All critical feeds validated. Safe to seed.\n');
  }
}

validate();
