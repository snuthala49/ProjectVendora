// ─────────────────────────────────────────────────────────────────────────────
// Shared TypeScript types used across the Vendora dashboard.
// These mirror the Prisma models but are serialisation-safe (no Date objects).
// ─────────────────────────────────────────────────────────────────────────────

// ─── Enum mirrors ────────────────────────────────────────────────────────────

export type FeedType = "RSS" | "JSON" | "ATOM";

export type VendorCategory =
  | "CLOUD"
  | "SECURITY"
  | "PRODUCTIVITY"
  | "DEVOPS"
  | "COMMUNICATION"
  | "CRM"
  | "ITSM"
  | "NETWORKING"
  | "MONITORING"
  | "OTHER";

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

export type OutageStatus =
  | "INVESTIGATING"
  | "IDENTIFIED"
  | "MONITORING"
  | "RESOLVED";

export type NotificationStatus = "SENT" | "FAILED" | "SKIPPED";

/** Computed status derived from the vendor's active outages. */
export type VendorStatus = "operational" | "degraded" | "outage" | "unknown";

// ─── API response shapes ─────────────────────────────────────────────────────

export interface VendorWithStatus {
  id: string;
  name: string;
  slug: string;
  feedUrl: string;
  feedType: FeedType;
  statusPageUrl: string | null;
  logoEmoji: string | null;
  category: VendorCategory;
  isActive: boolean;
  currentStatus: VendorStatus;
  activeOutageCount: number;
  lastChecked: string; // ISO-8601
}

export interface OutageVendorSnippet {
  id: string;
  name: string;
  slug: string;
  logoEmoji: string | null;
  category: VendorCategory;
  statusPageUrl: string | null;
}

export interface OutageWithVendor {
  id: string;
  vendorId: string;
  vendor: OutageVendorSnippet;
  title: string;
  description: string | null;
  severity: Severity;
  status: OutageStatus;
  sourceId: string | null;
  sourceUrl: string | null;
  startedAt: string; // ISO-8601
  resolvedAt: string | null; // ISO-8601
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}

export interface OutagesResponse {
  outages: OutageWithVendor[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VendorsSummary {
  total: number;
  operational: number;
  degraded: number;
  outage: number;
  unknown: number;
}

export interface VendorsResponse {
  vendors: VendorWithStatus[];
  summary: VendorsSummary;
}

// ─── Subscribe ────────────────────────────────────────────────────────────────

export interface SubscribeRequest {
  email: string;
  vendorFilter?: string[];
  severityFilter?: Severity[];
}

export interface SubscribeResponse {
  success: boolean;
  message: string;
}

// ─── Poller ───────────────────────────────────────────────────────────────────

export interface PollVendorResult {
  vendorId: string;
  vendorName: string;
  newOutageCount: number;
  errors: string[];
}

export interface CronPollResponse {
  success: boolean;
  vendorsPolled: number;
  newOutages: number;
  criticalOutages: number;
  emailsSent: number;
  errors: string[];
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface OutageFilters {
  vendor?: string; // slug
  severity?: Severity;
  status?: OutageStatus;
  hours?: number;
  page?: number;
  pageSize?: number;
}
