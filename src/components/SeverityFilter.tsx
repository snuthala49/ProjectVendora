"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Severity, OutageStatus } from "@/types";

interface SeverityFilterProps {
  severity: Severity | "ALL";
  status: OutageStatus | "ALL";
  hours: number;
  onSeverityChange: (v: Severity | "ALL") => void;
  onStatusChange: (v: OutageStatus | "ALL") => void;
  onHoursChange: (v: number) => void;
  totalCount: number;
}

export function SeverityFilter({
  severity,
  status,
  hours,
  onSeverityChange,
  onStatusChange,
  onHoursChange,
  totalCount,
}: SeverityFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Severity filter */}
      <Select
        value={severity}
        onValueChange={(v) => onSeverityChange(v as Severity | "ALL")}
      >
        <SelectTrigger className="h-8 w-[130px] border-[var(--oi-border)] bg-[var(--oi-dark)] text-xs text-slate-200 focus:ring-[var(--oi-primary)]">
          <SelectValue placeholder="Severity" />
        </SelectTrigger>
        <SelectContent className="border-[var(--oi-border)] bg-[var(--oi-dark)] text-slate-200">
          <SelectItem value="ALL">All severities</SelectItem>
          <SelectItem value="CRITICAL">🔴 Critical</SelectItem>
          <SelectItem value="HIGH">🟠 High</SelectItem>
          <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
          <SelectItem value="LOW">🟢 Low</SelectItem>
          <SelectItem value="UNKNOWN">⚪ Unknown</SelectItem>
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select
        value={status}
        onValueChange={(v) => onStatusChange(v as OutageStatus | "ALL")}
      >
        <SelectTrigger className="h-8 w-[140px] border-[var(--oi-border)] bg-[var(--oi-dark)] text-xs text-slate-200 focus:ring-[var(--oi-primary)]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="border-[var(--oi-border)] bg-[var(--oi-dark)] text-slate-200">
          <SelectItem value="ALL">All statuses</SelectItem>
          <SelectItem value="INVESTIGATING">Investigating</SelectItem>
          <SelectItem value="IDENTIFIED">Identified</SelectItem>
          <SelectItem value="MONITORING">Monitoring</SelectItem>
          <SelectItem value="RESOLVED">Resolved</SelectItem>
        </SelectContent>
      </Select>

      {/* Time window */}
      <Select
        value={String(hours)}
        onValueChange={(v) => onHoursChange(Number(v))}
      >
        <SelectTrigger className="h-8 w-[110px] border-[var(--oi-border)] bg-[var(--oi-dark)] text-xs text-slate-200 focus:ring-[var(--oi-primary)]">
          <SelectValue placeholder="Window" />
        </SelectTrigger>
        <SelectContent className="border-[var(--oi-border)] bg-[var(--oi-dark)] text-slate-200">
          <SelectItem value="6">Last 6h</SelectItem>
          <SelectItem value="12">Last 12h</SelectItem>
          <SelectItem value="24">Last 24h</SelectItem>
          <SelectItem value="48">Last 48h</SelectItem>
          <SelectItem value="168">Last 7d</SelectItem>
        </SelectContent>
      </Select>

      {/* Result count */}
      <span className="ml-auto text-xs text-[var(--oi-muted)]">
        {totalCount} event{totalCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
