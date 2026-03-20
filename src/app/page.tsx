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
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
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
                className="text-xs text-blue-400 hover:text-blue-300"
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
                  className="h-24 animate-pulse rounded-lg bg-slate-800"
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
                <span className="ml-2 text-blue-400">
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
      <footer className="border-t border-slate-800 px-6 py-4 text-center text-xs text-slate-600">
        Vendora · IT Outage Intelligence · Polls refresh every 60 s
      </footer>

      {/* ── Subscribe modal ─────────────────────────────────────────────────── */}
      <SubscribeModal open={subscribeOpen} onOpenChange={setSubscribeOpen} />
    </div>
  );
}
