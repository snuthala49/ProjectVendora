"use client";

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { VendorStatusBadge } from "@/components/StatusBadge";
import type { VendorWithStatus, VendorStatus } from "@/types";

interface VendorGridProps {
  vendors: VendorWithStatus[];
  selectedVendor: string | null;
  onVendorSelect: (slug: string | null) => void;
}

const STATUS_CARD: Record<VendorStatus, string> = {
  operational:
    "border-green-500/20 hover:border-green-500/40 bg-[var(--oi-dark)]",
  degraded:
    "border-yellow-400/30 hover:border-yellow-400/50 bg-[var(--oi-dark)]",
  outage: "border-red-500/40 hover:border-red-500/60 bg-[var(--oi-dark)]",
  unknown:
    "border-[var(--oi-border)] hover:border-[var(--oi-muted)] bg-[var(--oi-dark)]",
};

const STATUS_GLOW: Record<VendorStatus, string> = {
  operational: "",
  degraded: "shadow-yellow-500/10",
  outage: "shadow-red-500/20 shadow-lg",
  unknown: "",
};

export function VendorGrid({
  vendors,
  selectedVendor,
  onVendorSelect,
}: VendorGridProps) {
  if (vendors.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--oi-border)] bg-[var(--oi-dark)] px-6 py-12 text-center text-[var(--oi-muted)]">
        No vendors found. Run the seed script to populate vendor data.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
      {vendors.map((vendor) => {
        const isSelected = selectedVendor === vendor.slug;
        const cardBorder = STATUS_CARD[vendor.currentStatus];
        const glow = STATUS_GLOW[vendor.currentStatus];

        return (
          <button
            key={vendor.id}
            onClick={() =>
              onVendorSelect(isSelected ? null : vendor.slug)
            }
            className={cn(
              "group relative flex flex-col items-center gap-2 rounded-lg border p-3 text-left transition-all duration-200",
              cardBorder,
              glow,
              isSelected &&
                "ring-2 ring-[var(--oi-primary)] ring-offset-2 ring-offset-[var(--oi-dark)]"
            )}
          >
            {/* Logo + name */}
            <span className="text-2xl leading-none">{vendor.logoEmoji}</span>
            <span className="line-clamp-2 text-center text-xs font-medium text-slate-200 leading-tight">
              {vendor.name}
            </span>

            {/* Status */}
            <VendorStatusBadge
              status={vendor.currentStatus}
              showLabel={false}
              className="mx-auto"
            />

            {/* Active outage count badge */}
            {vendor.activeOutageCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--oi-alert)] px-1 text-[10px] font-bold text-white leading-none">
                {vendor.activeOutageCount}
              </span>
            )}

            {/* External link — shown on hover */}
            {vendor.statusPageUrl && (
              <a
                href={vendor.statusPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="absolute right-2 top-2 hidden rounded text-[var(--oi-muted)] opacity-0 transition-opacity hover:text-slate-300 group-hover:opacity-100 sm:block"
                title="Open status page"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </button>
        );
      })}
    </div>
  );
}
