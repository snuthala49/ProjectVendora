"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { VendorStatusBadge } from "@/components/StatusBadge";
import type { VendorsResponse, VendorWithStatus } from "@/types";

async function fetchVendors(): Promise<VendorsResponse> {
  const res = await fetch("/api/vendors");
  if (!res.ok) throw new Error("Failed to load vendors");
  return res.json();
}

interface VendorStatusGridProps {
  onVendorSelect?: (slug: string | null) => void;
  selectedVendor?: string | null;
}

export function VendorStatusGrid({
  onVendorSelect,
  selectedVendor = null,
}: VendorStatusGridProps) {
  const vendorsQuery = useQuery<VendorsResponse>({
    queryKey: ["vendors", "status-grid"],
    queryFn: fetchVendors,
    refetchInterval: 60_000,
  });

  const vendors: VendorWithStatus[] = vendorsQuery.data?.vendors ?? [];

  if (vendorsQuery.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
      {vendors.map((vendor) => {
        const isSelected = selectedVendor === vendor.slug;

        return (
          <button
            key={vendor.id}
            type="button"
            onClick={() => onVendorSelect?.(isSelected ? null : vendor.slug)}
            className={`group relative rounded-lg border bg-slate-900 p-3 text-left transition-colors ${
              isSelected
                ? "border-blue-500 ring-2 ring-blue-500/40"
                : vendor.currentStatus === "outage"
                  ? "border-red-500/40"
                  : vendor.currentStatus === "degraded"
                    ? "border-yellow-500/30"
                    : "border-slate-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl leading-none">{vendor.logoEmoji ?? "🌐"}</span>
              {vendor.statusPageUrl && (
                <a
                  href={vendor.statusPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="opacity-0 transition-opacity group-hover:opacity-100 text-slate-500 hover:text-slate-300"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            <p className="mt-2 line-clamp-2 text-xs font-medium text-slate-200">
              {vendor.name}
            </p>

            <div className="mt-2 flex items-center justify-between">
              <VendorStatusBadge status={vendor.currentStatus} showLabel={false} />
              {vendor.activeOutageCount > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {vendor.activeOutageCount}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default VendorStatusGrid;
