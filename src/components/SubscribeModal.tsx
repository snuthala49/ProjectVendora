"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Loader2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Severity } from "@/types";

interface SubscribeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormState = "idle" | "loading" | "success" | "error";

interface VendorsResponse {
  vendors: Array<{ id: string; name: string; slug: string; logoEmoji: string | null }>;
}

async function fetchVendors(): Promise<VendorsResponse> {
  const res = await fetch("/api/vendors");
  if (!res.ok) throw new Error("Failed to load vendors");
  return res.json();
}

const SEVERITIES: Array<{ value: Severity; label: string; emoji: string }> = [
  { value: "CRITICAL", label: "Critical", emoji: "🔴" },
  { value: "HIGH", label: "High", emoji: "🟠" },
  { value: "MEDIUM", label: "Medium", emoji: "🟡" },
  { value: "LOW", label: "Low", emoji: "🟢" },
];

export function SubscribeModal({ open, onOpenChange }: SubscribeModalProps) {
  const [email, setEmail] = useState("");
  const [selectedSeverities, setSelectedSeverities] = useState<Severity[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const vendorsQuery = useQuery<VendorsResponse>({
    queryKey: ["vendors", "subscribe-modal"],
    queryFn: fetchVendors,
    enabled: open,
  });

  const toggleSeverity = (sev: Severity) => {
    setSelectedSeverities((prev) =>
      prev.includes(sev) ? prev.filter((s) => s !== sev) : [...prev, sev]
    );
  };

  const toggleVendor = (slug: string) => {
    setSelectedVendors((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setFormState("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          severityFilter: selectedSeverities,
          vendorFilter: selectedVendors,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Subscription failed");
      }

      setFormState("success");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setFormState("error");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setEmail("");
      setSelectedSeverities([]);
      setSelectedVendors([]);
      setFormState("idle");
      setErrorMessage("");
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-[var(--oi-border)] bg-[var(--oi-dark)] text-slate-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Bell className="h-5 w-5 text-[var(--oi-primary-lt)]" />
            Subscribe to Outage Alerts
          </DialogTitle>
          <DialogDescription className="text-[var(--oi-muted)]">
            Get email notifications when critical outages are detected.
          </DialogDescription>
        </DialogHeader>

        {formState === "success" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-400" />
            <p className="text-sm font-medium text-white">You&apos;re subscribed!</p>
            <p className="text-xs text-[var(--oi-muted)]">
              Check your inbox to confirm your subscription.
            </p>
            <Button
              onClick={handleClose}
              className="mt-2 bg-[var(--oi-primary)] hover:bg-[var(--oi-primary-lt)]"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-[var(--oi-border)] bg-[var(--oi-dark)] text-slate-100 placeholder:text-[var(--oi-muted)] focus-visible:ring-[var(--oi-primary)]"
              />
            </div>

            {/* Severity filter */}
            <div className="space-y-2">
              <Label className="text-slate-200">
                Notify me for{" "}
                <span className="text-[var(--oi-muted)] font-normal">
                  (all if none selected)
                </span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {SEVERITIES.map((sev) => {
                  const active = selectedSeverities.includes(sev.value);
                  return (
                    <button
                      key={sev.value}
                      type="button"
                      onClick={() => toggleSeverity(sev.value)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        active
                          ? "border-[var(--oi-primary)] bg-[var(--oi-primary)]/20 text-[var(--oi-primary-lt)]"
                          : "border-[var(--oi-border)] bg-[var(--oi-dark)] text-[var(--oi-muted)] hover:border-[var(--oi-muted)]"
                      }`}
                    >
                      {sev.emoji} {sev.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vendor multiselect */}
            <div className="space-y-2">
              <Label className="text-slate-200">
                Vendors{" "}
                <span className="text-[var(--oi-muted)] font-normal">
                  (all if none selected)
                </span>
              </Label>

              <ScrollArea className="max-h-36 rounded-md border border-[var(--oi-border)] bg-[var(--oi-dark)] p-2">
                <div className="grid grid-cols-1 gap-1.5">
                  {(vendorsQuery.data?.vendors ?? []).map((vendor) => {
                    const checked = selectedVendors.includes(vendor.slug);
                    return (
                      <label
                        key={vendor.slug}
                        className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs ${
                          checked
                            ? "bg-[var(--oi-primary)]/15 text-[var(--oi-primary-lt)]"
                            : "text-slate-300 hover:bg-[var(--oi-dark)]/70"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleVendor(vendor.slug)}
                          className="h-3.5 w-3.5 rounded border-[var(--oi-border)] bg-[var(--oi-dark)]"
                        />
                        <span>{vendor.logoEmoji ?? "🌐"}</span>
                        <span className="truncate">{vendor.name}</span>
                      </label>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Error */}
            {formState === "error" && (
              <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {errorMessage}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="text-[var(--oi-muted)] hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formState === "loading" || !email}
                className="bg-[var(--oi-primary)] hover:bg-[var(--oi-primary-lt)]"
              >
                {formState === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Subscribing…
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4" />
                    Subscribe
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
