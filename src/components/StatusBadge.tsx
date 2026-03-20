"use client";

import { cn } from "@/lib/utils";
import type { VendorStatus, Severity, OutageStatus } from "@/types";

// ─── Vendor status dot + pill ────────────────────────────────────────────────

interface VendorStatusBadgeProps {
  status: VendorStatus;
  className?: string;
  showLabel?: boolean;
}

const STATUS_META: Record<
  VendorStatus,
  { label: string; dot: string; pill: string }
> = {
  operational: {
    label: "Operational",
    dot: "bg-green-500",
    pill: "border-green-500/30 bg-green-500/10 text-green-400",
  },
  degraded: {
    label: "Degraded",
    dot: "bg-yellow-400",
    pill: "border-yellow-400/30 bg-yellow-400/10 text-yellow-400",
  },
  outage: {
    label: "Outage",
    dot: "bg-red-500",
    pill: "border-red-500/30 bg-red-500/10 text-red-400",
  },
  unknown: {
    label: "Unknown",
    dot: "bg-slate-500",
    pill: "border-slate-500/30 bg-slate-500/10 text-slate-400",
  },
};

export function VendorStatusBadge({
  status,
  className,
  showLabel = true,
}: VendorStatusBadgeProps) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        meta.pill,
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          meta.dot,
          status !== "operational" && "animate-pulse-dot"
        )}
      />
      {showLabel && meta.label}
    </span>
  );
}

// ─── Severity badge ───────────────────────────────────────────────────────────

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

const SEV_META: Record<Severity, { label: string; cls: string }> = {
  CRITICAL: {
    label: "Critical",
    cls: "border-red-500/40 bg-red-500/15 text-red-400 font-bold",
  },
  HIGH: {
    label: "High",
    cls: "border-orange-500/40 bg-orange-500/15 text-orange-400",
  },
  MEDIUM: {
    label: "Medium",
    cls: "border-yellow-500/40 bg-yellow-500/15 text-yellow-400",
  },
  LOW: {
    label: "Low",
    cls: "border-green-500/40 bg-green-500/15 text-green-400",
  },
  UNKNOWN: {
    label: "Unknown",
    cls: "border-slate-500/40 bg-slate-500/15 text-slate-400",
  },
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const meta = SEV_META[severity] ?? SEV_META.UNKNOWN;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs",
        meta.cls,
        className
      )}
    >
      {meta.label}
    </span>
  );
}

// ─── Outage status badge ──────────────────────────────────────────────────────

interface OutageStatusBadgeProps {
  status: OutageStatus;
  className?: string;
}

const OSTATUS_META: Record<OutageStatus, { label: string; cls: string }> = {
  INVESTIGATING: {
    label: "Investigating",
    cls: "border-orange-500/40 bg-orange-500/10 text-orange-400",
  },
  IDENTIFIED: {
    label: "Identified",
    cls: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
  },
  MONITORING: {
    label: "Monitoring",
    cls: "border-blue-500/40 bg-blue-500/10 text-blue-400",
  },
  RESOLVED: {
    label: "Resolved",
    cls: "border-green-500/40 bg-green-500/10 text-green-400",
  },
};

export function OutageStatusBadge({
  status,
  className,
}: OutageStatusBadgeProps) {
  const meta = OSTATUS_META[status] ?? OSTATUS_META.INVESTIGATING;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        meta.cls,
        className
      )}
    >
      {meta.label}
    </span>
  );
}
