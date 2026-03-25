"use client";

import { Bell, RefreshCw } from "lucide-react";
import Logo from "@/components/Logo";
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
    <header className="sticky top-0 z-40 border-b border-[var(--oi-border)] bg-[var(--oi-dark)]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo variant="dark" size="sm" showWordmark />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 text-[var(--oi-muted)] hover:text-white"
            title="Refresh now"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            onClick={onSubscribeClick}
            size="sm"
            className="gap-1.5 bg-[var(--oi-primary)] text-white hover:bg-[var(--oi-primary-lt)]"
          >
            <Bell className="h-3.5 w-3.5" />
            Subscribe
          </Button>
        </div>
      </div>
    </header>
  );
}
