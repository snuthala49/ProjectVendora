"use client";

import { Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  onSubscribeClick: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function DashboardHeader({
  onSubscribeClick,
  onRefresh,
  isRefreshing,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm shadow-lg">
            🔔
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-white">
              Vendora
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400">
              IT Outage Intelligence
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 text-slate-400 hover:text-white"
            title="Refresh now"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            onClick={onSubscribeClick}
            size="sm"
            className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Bell className="h-3.5 w-3.5" />
            Subscribe
          </Button>
        </div>
      </div>
    </header>
  );
}
