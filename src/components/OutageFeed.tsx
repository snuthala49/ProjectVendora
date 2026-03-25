"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { SeverityBadge, OutageStatusBadge } from "@/components/StatusBadge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OutageWithVendor, Severity, OutageStatus } from "@/types";

interface OutageFeedProps {
  outages?: OutageWithVendor[];
  isLoading?: boolean;
  selectedVendor?: string | null;
}

interface OutagesResponse {
  outages: OutageWithVendor[];
  total: number;
}

interface VendorsResponse {
  vendors: Array<{ slug: string; name: string }>;
}

async function fetchOutages(params: {
  vendor: string | null;
  severity: Severity | "ALL";
}): Promise<OutagesResponse> {
  const qs = new URLSearchParams({ hours: "24" });
  if (params.vendor) qs.set("vendor", params.vendor);
  if (params.severity !== "ALL") qs.set("severity", params.severity);

  const res = await fetch(`/api/outages?${qs}`);
  if (!res.ok) throw new Error("Failed to fetch outages");
  return res.json();
}

async function fetchVendorOptions(): Promise<VendorsResponse> {
  const res = await fetch("/api/vendors");
  if (!res.ok) throw new Error("Failed to fetch vendors");
  return res.json();
}

export function OutageFeed({
  outages: providedOutages,
  isLoading: providedLoading = false,
  selectedVendor,
}: OutageFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<Severity | "ALL">("ALL");
  const [vendorFilter, setVendorFilter] = useState<string>(
    selectedVendor ?? "ALL"
  );

  const isControlled = Array.isArray(providedOutages);

  const vendorsQuery = useQuery<VendorsResponse>({
    queryKey: ["vendors", "outage-feed-options"],
    queryFn: fetchVendorOptions,
    refetchInterval: 60_000,
    enabled: !isControlled,
  });

  const outagesQuery = useQuery<OutagesResponse>({
    queryKey: ["outages", "live-feed", vendorFilter, severityFilter],
    queryFn: () =>
      fetchOutages({
        vendor: vendorFilter === "ALL" ? null : vendorFilter,
        severity: severityFilter,
      }),
    refetchInterval: 60_000,
    enabled: !isControlled,
  });

  const outages = isControlled
    ? providedOutages
    : (outagesQuery.data?.outages ?? []);
  const isLoading = isControlled
    ? providedLoading
    : outagesQuery.isLoading;

  if (isLoading && outages.length === 0) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg bg-[var(--oi-dark)]/70"
          />
        ))}
      </div>
    );
  }

  if (outages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--oi-border)] bg-[var(--oi-dark)] py-16 text-center">
        <span className="mb-3 text-4xl">✅</span>
        <p className="text-sm font-medium text-slate-300">All systems operational</p>
        <p className="mt-1 text-xs text-[var(--oi-muted)]">
          No outages in the selected time window
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!isControlled && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1">
            {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map(
              (sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    severityFilter === sev
                      ? "border-[var(--oi-primary)] bg-[var(--oi-primary)]/20 text-[var(--oi-primary-lt)]"
                      : "border-[var(--oi-border)] bg-[var(--oi-dark)] text-[var(--oi-muted)]"
                  }`}
                >
                  {sev === "ALL" ? "All" : sev}
                </button>
              )
            )}
          </div>

          <Select value={vendorFilter} onValueChange={setVendorFilter}>
            <SelectTrigger className="ml-auto h-8 w-[220px] border-[var(--oi-border)] bg-[var(--oi-dark)] text-xs text-slate-200">
              <SelectValue placeholder="Filter by vendor" />
            </SelectTrigger>
            <SelectContent className="border-[var(--oi-border)] bg-[var(--oi-dark)] text-slate-200">
              <SelectItem value="ALL">All vendors</SelectItem>
              {(vendorsQuery.data?.vendors ?? []).map((v) => (
                <SelectItem key={v.slug} value={v.slug}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <ScrollArea className="h-[calc(100vh-20rem)] pr-1">
        <div className="space-y-2">
          {outages.map((outage) => {
            const isExpanded = expandedId === outage.id;
            const isResolved = outage.status === "RESOLVED";

            return (
              <div
                key={outage.id}
                className={`rounded-lg border transition-colors ${
                  isResolved
                    ? "border-[var(--oi-border)] bg-[var(--oi-dark)]/60 opacity-70"
                    : outage.severity === "CRITICAL"
                      ? "border-[var(--oi-alert)]/30 bg-[var(--oi-alert)]/10"
                      : outage.severity === "HIGH"
                        ? "border-orange-500/20 bg-orange-950/10"
                        : "border-[var(--oi-border)] bg-[var(--oi-dark)]"
                }`}
              >
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : outage.id)
                  }
                  className="flex w-full items-start gap-3 p-3 text-left"
                >
                  <span className="mt-0.5 shrink-0 text-xl leading-none">
                    {outage.vendor.logoEmoji ?? "🌐"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-medium text-[var(--oi-muted)]">
                        {outage.vendor.name}
                      </span>
                      <SeverityBadge severity={outage.severity as Severity} />
                      <OutageStatusBadge
                        status={outage.status as OutageStatus}
                      />
                    </div>
                    <p className="line-clamp-2 text-sm font-medium text-slate-200">
                      {outage.title}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="whitespace-nowrap text-[11px] text-[var(--oi-muted)]">
                      {formatDistanceToNow(new Date(outage.startedAt), {
                        addSuffix: true,
                      })}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-[var(--oi-muted)]" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-[var(--oi-muted)]" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-[var(--oi-border)] px-3 pb-3 pt-2.5">
                    {outage.description && (
                      <p className="mb-3 text-xs leading-relaxed text-[var(--oi-muted)]">
                        {outage.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--oi-muted)]">
                      <span>
                        Started: {new Date(outage.startedAt).toLocaleString()}
                      </span>
                      {outage.resolvedAt && (
                        <span>
                          Resolved: {new Date(outage.resolvedAt).toLocaleString()}
                        </span>
                      )}
                      {outage.sourceUrl && (
                        <a
                          href={outage.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[var(--oi-primary-lt)] hover:text-[var(--oi-primary)]"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Source
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
