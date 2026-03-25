/**
 * Main dashboard page — client component that wires together:
 *   • React Query polls (vendors every 60 s, outages every 60 s)
 *   • VendorGrid — clickable cards to filter the outage feed
 *   • SeverityFilter — severity / status / time window dropdowns
 *   • OutageFeed — scrollable, expandable outage list
 *   • SubscribeModal — email subscription dialog
 */

"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardHeader } from "@/components/DashboardHeader";
import { SummaryBar } from "@/components/SummaryBar";
import { VendorGrid } from "@/components/VendorGrid";
import { SeverityFilter } from "@/components/SeverityFilter";
import { OutageFeed } from "@/components/OutageFeed";
import { SubscribeModal } from "@/components/SubscribeModal";
import type {
  VendorsResponse,
  OutagesResponse,
  Severity,
  OutageStatus,
} from "@/types";

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchVendors(): Promise<VendorsResponse> {
  const res = await fetch("/api/vendors");
  if (!res.ok) throw new Error("Failed to fetch vendors");
  return res.json();
}

async function fetchOutages(params: {
  vendor: string | null;
  severity: Severity | "ALL";
  status: OutageStatus | "ALL";
  hours: number;
}): Promise<OutagesResponse> {
  const qs = new URLSearchParams({ hours: String(params.hours) });
  if (params.vendor) qs.set("vendor", params.vendor);
  if (params.severity !== "ALL") qs.set("severity", params.severity);
  if (params.status !== "ALL") qs.set("status", params.status);

  const res = await fetch(`/api/outages?${qs}`);
  if (!res.ok) throw new Error("Failed to fetch outages");
  return res.json();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [severity, setSeverity] = useState<Severity | "ALL">("ALL");
  const [outageStatus, setOutageStatus] = useState<OutageStatus | "ALL">("ALL");
  const [hours, setHours] = useState(24);

  // ── Vendors query ──────────────────────────────────────────────────────────
  const vendorsQuery = useQuery<VendorsResponse>({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
  });

  // ── Outages query ──────────────────────────────────────────────────────────
  const outagesQuery = useQuery<OutagesResponse>({
    queryKey: ["outages", selectedVendor, severity, outageStatus, hours],
    queryFn: () =>
      fetchOutages({
        vendor: selectedVendor,
        severity,
        status: outageStatus,
        hours,
      }),
  });

  // ── Manual refresh ────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    vendorsQuery.refetch();
    outagesQuery.refetch();
  }, [vendorsQuery, outagesQuery]);

  const vendors = vendorsQuery.data?.vendors ?? [];
  const summary = vendorsQuery.data?.summary ?? {
    total: 0,
    operational: 0,
    degraded: 0,
    outage: 0,
    unknown: 0,
  };
  const outages = outagesQuery.data?.outages ?? [];
  const totalOutages = outagesQuery.data?.total ?? 0;

  const isRefreshing = vendorsQuery.isFetching || outagesQuery.isFetching;

  // Last successful update time
  const lastUpdated = vendorsQuery.dataUpdatedAt
    ? new Date(vendorsQuery.dataUpdatedAt)
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--oi-dark)] text-slate-100">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <DashboardHeader
        onSubscribeClick={() => setSubscribeOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* ── Summary bar ────────────────────────────────────────────────────── */}
      <SummaryBar summary={summary} lastUpdated={lastUpdated} />

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-screen-2xl flex-1 space-y-6 px-4 py-6 sm:px-6">
        {/* Vendor grid */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Vendor Status
            </h2>
            {selectedVendor && (
              <button
                onClick={() => setSelectedVendor(null)}
                className="text-xs text-[var(--oi-primary-lt)] hover:text-[var(--oi-primary)]"
              >
                Clear filter ✕
              </button>
            )}
          </div>

          {vendorsQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-lg bg-[var(--oi-surface)]/20"
                />
              ))}
            </div>
          ) : (
            <VendorGrid
              vendors={vendors}
              selectedVendor={selectedVendor}
              onVendorSelect={setSelectedVendor}
            />
          )}
        </section>

        {/* Outage feed */}
        <section>
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Outage Feed
              {selectedVendor && (
                <span className="ml-2 text-[var(--oi-primary-lt)]">
                  · Filtered by {selectedVendor}
                </span>
              )}
            </h2>
            <SeverityFilter
              severity={severity}
              status={outageStatus}
              hours={hours}
              onSeverityChange={setSeverity}
              onStatusChange={setOutageStatus}
              onHoursChange={setHours}
              totalCount={totalOutages}
            />
          </div>

          <OutageFeed
            outages={outages}
            isLoading={outagesQuery.isLoading}
          />
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--oi-border)] px-6 py-4 text-xs text-[var(--oi-muted)]">
        <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between">
          {/* Left — social links */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/snuthala49/ProjectVendora"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-slate-300"
            >
              {/* GitHub icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/company/outageintel/about/?viewAsMember=true"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-slate-300"
            >
              {/* LinkedIn icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </a>
          </div>

          {/* Right — copyright */}
          <span>© 2026 OutageIntel</span>
        </div>
      </footer>

      {/* ── Subscribe modal ─────────────────────────────────────────────────── */}
      <SubscribeModal open={subscribeOpen} onOpenChange={setSubscribeOpen} />
    </div>
  );
}
