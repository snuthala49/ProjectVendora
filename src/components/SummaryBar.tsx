"use client";

import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Activity,
} from "lucide-react";
import type { VendorsSummary } from "@/types";

interface SummaryBarProps {
  summary: VendorsSummary;
  lastUpdated: Date | null;
}

export function SummaryBar({ summary, lastUpdated }: SummaryBarProps) {
  const stats = [
    {
      label: "Operational",
      value: summary.operational,
      icon: CheckCircle2,
      cls: "text-green-400",
    },
    {
      label: "Degraded",
      value: summary.degraded,
      icon: AlertTriangle,
      cls: "text-yellow-400",
    },
    {
      label: "Outage",
      value: summary.outage,
      icon: XCircle,
      cls: "text-red-400",
    },
    {
      label: "Unknown",
      value: summary.unknown,
      icon: HelpCircle,
      cls: "text-slate-400",
    },
  ];

  return (
    <div className="border-b border-[var(--oi-border)] bg-[var(--oi-dark)]/70">
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        {/* Stats */}
        <div className="flex flex-wrap items-center gap-4">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <s.icon className={`h-3.5 w-3.5 ${s.cls}`} />
              <span className="text-sm font-semibold text-white">
                {s.value}
              </span>
              <span className="text-xs text-[var(--oi-muted)]">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Live indicator + last update */}
        <div className="flex items-center gap-2 text-xs text-[var(--oi-muted)]">
          <span className="flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-green-400" />
            <span className="text-green-400 font-medium">Live</span>
          </span>
          {lastUpdated && (
            <span>
              · Updated{" "}
              {lastUpdated.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
