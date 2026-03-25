# OutageIntel — Rebrand + Logo Implementation Prompt for GitHub Copilot

## Context
I am renaming my IT outage monitoring project from "OutageIntel / OutageIntel" to **OutageIntel**.
The live site is at **outageintel.org**.
This prompt covers: (1) global find-replace rebrand, (2) SVG logo creation, (3) React logo component,
(4) favicon generation, (5) full UI brand application across the Next.js app.

---

## STEP 1 — Global Find & Replace (do this first)

Search the entire codebase and replace ALL occurrences of the following:

| Find | Replace With |
|------|-------------|
| `OutageIntel` | `OutageIntel` |
| `outageintel` | `outageintel` |
| `VENDORA` | `OUTAGEINTEL` |
| `OutageIntel` | `OutageIntel` |
| `outageintel` | `outageintel` |
| `vendor-dashboard` | `outageintel` |

Files to update: `package.json` (name field), `README.md`, all `.tsx`, `.ts`, `.css`,
`.env.example`, `vercel.json`, HTML `<title>` tags, and any `<meta>` description tags.

---

## STEP 2 — Brand Tokens (add to globals.css or tailwind.config.ts)

```css
/* globals.css — OutageIntel brand tokens */
:root {
  --oi-primary:     #0f4c8a;   /* deep navy blue — main brand color */
  --oi-primary-lt:  #1a6bb5;   /* lighter blue — hover states */
  --oi-alert:       #e84040;   /* alert red — critical outage dot */
  --oi-dark:        #0f1923;   /* dark navy — navbar, dark mode bg */
  --oi-surface:     #f5f7fa;   /* light grey — page background */
  --oi-text:        #1a2332;   /* near-black — body text */
  --oi-muted:       #6b7a8d;   /* muted grey — secondary text */
  --oi-border:      #e2e8f0;   /* border color */

  /* Severity palette */
  --oi-critical:    #e84040;
  --oi-major:       #f97316;
  --oi-minor:       #eab308;
  --oi-info:        #3b82f6;
  --oi-resolved:    #22c55e;
}
```

If using Tailwind, add to `tailwind.config.ts`:
```ts
extend: {
  colors: {
    'oi-primary':  '#0f4c8a',
    'oi-alert':    '#e84040',
    'oi-dark':     '#0f1923',
    'oi-surface':  '#f5f7fa',
    'oi-muted':    '#6b7a8d',
  }
}
```

---

## STEP 3 — SVG Logo File

Create the file `public/logo.svg` with this exact content:

```svg
<svg width="200" height="52" viewBox="0 0 200 52" xmlns="http://www.w3.org/2000/svg">
  <!-- Icon container -->
  <rect x="0" y="2" width="48" height="48" rx="10" fill="#0f4c8a"/>

  <!-- Radar ring outer -->
  <circle cx="24" cy="26" r="14" fill="none" stroke="#ffffff" stroke-width="1.8"/>

  <!-- Radar spokes (8 directions) -->
  <line x1="24" y1="12" x2="24" y2="6"  stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
  <line x1="24" y1="40" x2="24" y2="46" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
  <line x1="10" y1="26" x2="4"  y2="26" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
  <line x1="38" y1="26" x2="44" y2="26" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
  <line x1="14" y1="16" x2="10" y2="12" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="34" y1="36" x2="38" y2="40" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="14" y1="36" x2="10" y2="40" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="34" y1="16" x2="38" y2="12" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>

  <!-- Alert center dot -->
  <circle cx="24" cy="26" r="5.5" fill="#e84040"/>
  <circle cx="24" cy="26" r="2"   fill="#ffffff"/>

  <!-- Wordmark: Outage (bold) -->
  <text x="58" y="22"
        font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
        font-size="17"
        font-weight="700"
        fill="#0f1923"
        letter-spacing="-0.4">Outage</text>

  <!-- Wordmark: Intel (light) -->
  <text x="58" y="42"
        font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
        font-size="17"
        font-weight="400"
        fill="#0f4c8a"
        letter-spacing="-0.4">Intel</text>
</svg>
```

Also create `public/logo-dark.svg` — same SVG but:
- `rect fill` → `#1a3a5c`
- All `stroke="#ffffff"` stays the same
- `text fill="#0f1923"` → `fill="#ffffff"` (Outage wordmark)
- `text fill="#0f4c8a"` → `fill="#7eb8f7"` (Intel wordmark)

---

## STEP 4 — Favicon (public/favicon.svg)

```svg
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="14" fill="#0f4c8a"/>
  <circle cx="32" cy="32" r="16" fill="none" stroke="#ffffff" stroke-width="2.5"/>
  <circle cx="32" cy="32" r="7"  fill="#e84040"/>
  <circle cx="32" cy="32" r="2.5" fill="#ffffff"/>
  <line x1="32" y1="16" x2="32" y2="8"  stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="32" y1="48" x2="32" y2="56" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="16" y1="32" x2="8"  y2="32" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="48" y1="32" x2="56" y2="32" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="20" y1="20" x2="14" y2="14" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  <line x1="44" y1="44" x2="50" y2="50" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  <line x1="20" y1="44" x2="14" y2="50" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  <line x1="44" y1="20" x2="50" y2="14" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
</svg>
```

Update `app/layout.tsx` to reference it:
```tsx
export const metadata: Metadata = {
  title: 'OutageIntel — Real-Time IT Outage Intelligence',
  description: 'Live outage monitoring for AWS, Azure, Google Cloud, Microsoft 365, CrowdStrike, Salesforce, ServiceNow and more.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'OutageIntel',
    description: 'Your intelligence feed for enterprise IT outages.',
    url: 'https://outageintel.org',
    siteName: 'OutageIntel',
  },
};
```

---

## STEP 5 — React Logo Component

Create `components/Logo.tsx`:

```tsx
import React from 'react';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

const sizes = {
  sm: { icon: 32, fontSize: 13, gap: 8 },
  md: { icon: 44, fontSize: 17, gap: 10 },
  lg: { icon: 56, fontSize: 22, gap: 14 },
};

export default function Logo({
  variant = 'light',
  size = 'md',
  showWordmark = true,
}: LogoProps) {
  const { icon, fontSize, gap } = sizes[size];
  const isDark = variant === 'dark';

  const iconBg     = isDark ? '#1a3a5c' : '#0f4c8a';
  const ringColor  = '#ffffff';
  const alertRed   = '#e84040';
  const textMain   = isDark ? '#ffffff' : '#0f1923';
  const textAccent = isDark ? '#7eb8f7' : '#0f4c8a';

  const r = icon / 2;
  const outerR = r * 0.58;
  const innerR = r * 0.23;
  const dotR   = r * 0.08;
  const spokeLong  = r * 0.25;
  const spokeShort = r * 0.16;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap }}>
      {/* Icon mark */}
      <svg
        width={icon}
        height={icon}
        viewBox={`0 0 ${icon} ${icon}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width={icon} height={icon} rx={icon * 0.18} fill={iconBg} />
        <circle cx={r} cy={r} r={outerR} fill="none" stroke={ringColor} strokeWidth={icon * 0.035} />
        {/* Cardinal spokes */}
        {[[0,-1],[0,1],[-1,0],[1,0]].map(([dx, dy], i) => (
          <line key={i}
            x1={r + dx * outerR} y1={r + dy * outerR}
            x2={r + dx * (outerR + spokeLong)} y2={r + dy * (outerR + spokeLong)}
            stroke={ringColor} strokeWidth={icon * 0.035} strokeLinecap="round"
          />
        ))}
        {/* Diagonal spokes */}
        {[[-1,-1],[1,1],[-1,1],[1,-1]].map(([dx, dy], i) => {
          const d = Math.SQRT1_2;
          return <line key={i}
            x1={r + dx * d * outerR} y1={r + dy * d * outerR}
            x2={r + dx * d * (outerR + spokeShort)} y2={r + dy * d * (outerR + spokeShort)}
            stroke={ringColor} strokeWidth={icon * 0.025} strokeLinecap="round"
          />;
        })}
        <circle cx={r} cy={r} r={innerR} fill={alertRed} />
        <circle cx={r} cy={r} r={dotR}   fill="#ffffff" />
      </svg>

      {/* Wordmark */}
      {showWordmark && (
        <div style={{ lineHeight: 1.1 }}>
          <div style={{
            fontSize,
            fontWeight: 700,
            color: textMain,
            letterSpacing: '-0.02em',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}>
            Outage
          </div>
          <div style={{
            fontSize,
            fontWeight: 400,
            color: textAccent,
            letterSpacing: '-0.02em',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}>
            Intel
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## STEP 6 — Apply Logo to Navbar

Update `components/Navbar.tsx` (or wherever the top navigation lives):

```tsx
import Logo from '@/components/Logo';

export default function Navbar() {
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      height: '60px',
      borderBottom: '0.5px solid #e2e8f0',
      background: '#ffffff',
    }}>
      <Logo variant="light" size="md" showWordmark={true} />

      {/* Right side nav items */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <a href="/history" style={{ fontSize: 14, color: '#6b7a8d', textDecoration: 'none' }}>History</a>
        <a href="/subscribe" style={{
          fontSize: 13,
          padding: '6px 16px',
          background: '#0f4c8a',
          color: '#ffffff',
          borderRadius: 6,
          textDecoration: 'none',
          fontWeight: 500,
        }}>Subscribe</a>
      </div>
    </nav>
  );
}
```

---

## STEP 7 — Page Title & Meta Tags

In every page `<head>` or `layout.tsx`, use this pattern:

```tsx
// For the main dashboard
title: 'OutageIntel — Live IT Outage Intelligence'

// For history page
title: 'Outage History | OutageIntel'

// For subscribe page
title: 'Subscribe to Alerts | OutageIntel'

// Meta description (universal)
description: 'Real-time outage monitoring for AWS, Azure, Microsoft 365, Google Cloud, CrowdStrike, Salesforce, ServiceNow and 10+ enterprise vendors. Subscribe for instant email alerts.'
```

---

## STEP 8 — Email Template Branding Update

In `emails/OutageAlert.tsx` (React Email template), update the header:

```tsx
// Replace any OutageIntel branding with:
<Section style={{ background: '#0f4c8a', padding: '20px 32px', borderRadius: '8px 8px 0 0' }}>
  <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: 700, margin: 0 }}>
    Outage<span style={{ fontWeight: 400, color: '#7eb8f7' }}>Intel</span>
  </Text>
  <Text style={{ color: '#93b8d8', fontSize: 13, margin: '4px 0 0' }}>
    outageintel.org — Live IT Outage Intelligence
  </Text>
</Section>
```

---

## STEP 9 — README Update

Replace the top of `README.md` with:

```markdown
# OutageIntel

> Real-time IT outage intelligence for enterprise teams.

**outageintel.org** monitors AWS, Azure, Microsoft 365, Google Cloud, CrowdStrike,
Salesforce, ServiceNow, Okta, Cloudflare, GitHub, Zoom, Slack, Broadcom and more —
alerting your team the moment a vendor goes down.

## Features
- Live outage feed — auto-refreshes every 60 seconds
- 16+ vendor status pages monitored continuously
- Email alerts for Critical / Major outages within 90 seconds
- Severity filters: Critical, Major, Minor, Informational
- 24-hour outage history with resolution tracking
- Subscribe with vendor & severity preferences
- Microsoft Teams & Slack webhook support (Pro)

## Stack
Next.js 14 · TypeScript · Tailwind CSS · Prisma · PostgreSQL · Resend · Vercel

## Getting Started
...
```

---

## Copilot Chat Sequence — Execute in Order

Paste these into Copilot Chat one at a time:

1. `"Do a global find-and-replace across all files: replace OutageIntel with OutageIntel, outageintel with outageintel, outageintel with outageintel. Show me every file that was changed."`

2. `"Create public/logo.svg using the SVG code in the spec. Also create public/logo-dark.svg and public/favicon.svg."`

3. `"Create components/Logo.tsx as a React component with variant (light/dark), size (sm/md/lg), and showWordmark props using the spec above."`

4. `"Update app/layout.tsx metadata to use OutageIntel branding, reference /favicon.svg, and set the correct OpenGraph tags for outageintel.org"`

5. `"Update the Navbar component to use the new Logo component. Import Logo from @/components/Logo and place it on the left side."`

6. `"Update the React Email template header to use OutageIntel branding with navy background #0f4c8a and the Outage/Intel wordmark split."`

7. `"Add the OutageIntel brand CSS variables (--oi-primary, --oi-alert, --oi-dark, --oi-surface, --oi-muted, --oi-border) to globals.css and update all hardcoded color references in the dashboard to use these variables."`

8. `"Update README.md with the OutageIntel project description, feature list, and tech stack as specified."`

---

*OutageIntel Rebrand Specification — Generated by Claude for GitHub Copilot*
*Site: outageintel.org*
