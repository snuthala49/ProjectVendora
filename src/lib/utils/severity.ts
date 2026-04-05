/**
 * lib/utils/severity.ts
 *
 * Shared severity and status inference utilities.
 * Used by all custom pollers. Also re-exported from generic-rss.ts for
 * backward compatibility.
 */

import type { Severity, OutageStatus } from "@/types";

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

// ─── Statuspage impact → Severity mapping ────────────────────────────────────

export function statuspageImpactToSeverity(
  impact: string,
  fallbackText = ""
): Severity {
  switch (impact) {
    case "critical":
      return "CRITICAL";
    case "major":
      return "HIGH";
    case "minor":
      return "MEDIUM";
    case "maintenance":
      return "LOW";
    case "none":
    default:
      return inferSeverity(fallbackText) ?? "UNKNOWN";
  }
}

// ─── Statuspage status string → OutageStatus mapping ─────────────────────────

export function statuspageStatusToOutageStatus(status: string): OutageStatus {
  switch (status) {
    case "investigating":
      return "INVESTIGATING";
    case "identified":
      return "IDENTIFIED";
    case "monitoring":
      return "MONITORING";
    case "resolved":
      return "RESOLVED";
    case "postmortem":
      return "RESOLVED";
    default:
      return "INVESTIGATING";
  }
}
