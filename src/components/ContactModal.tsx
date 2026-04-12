"use client";

import React, { useState } from "react";
import { Mail, Loader2, CheckCircle2, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormState = "idle" | "loading" | "success" | "error";

export function ContactModal({ open, onOpenChange }: ContactModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setFormState("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to send message");
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
    setTimeout(() => {
      setName("");
      setEmail("");
      setMessage("");
      setFormState("idle");
      setErrorMessage("");
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-[var(--oi-border)] bg-[var(--oi-dark)] text-slate-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <MessageSquare className="h-5 w-5 text-[var(--oi-primary-lt)]" />
            Contact Us
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Have questions? We&apos;d love to hear from you — reach out and
            we&apos;ll get back to you as soon as possible.
          </DialogDescription>
        </DialogHeader>

        {/* ── Success state ─────────────────────────────────────────────────── */}
        {formState === "success" ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="h-14 w-14 text-emerald-400" />
            <div>
              <p className="text-lg font-semibold text-white">
                Thank you for Reaching us!
              </p>
              <p className="mt-1 text-sm text-slate-400">
                We will get back to you ASAP!!
              </p>
            </div>
            <Button
              onClick={handleClose}
              className="mt-2 bg-[var(--oi-primary)] text-white hover:bg-[var(--oi-primary-lt)]"
            >
              Close
            </Button>
          </div>
        ) : (
          /* ── Form ──────────────────────────────────────────────────────────── */
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="contact-name" className="text-slate-300">
                Name
              </Label>
              <Input
                id="contact-name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={formState === "loading"}
                className="border-[var(--oi-border)] bg-white/5 text-white placeholder:text-slate-500 focus:border-[var(--oi-primary-lt)] focus:ring-[var(--oi-primary-lt)]"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="contact-email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={formState === "loading"}
                className="border-[var(--oi-border)] bg-white/5 text-white placeholder:text-slate-500 focus:border-[var(--oi-primary-lt)] focus:ring-[var(--oi-primary-lt)]"
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label htmlFor="contact-message" className="text-slate-300">
                Message
              </Label>
              <textarea
                id="contact-message"
                rows={4}
                placeholder="How can we help you?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                disabled={formState === "loading"}
                className="w-full rounded-md border border-[var(--oi-border)] bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[var(--oi-primary-lt)] focus:outline-none focus:ring-1 focus:ring-[var(--oi-primary-lt)] disabled:opacity-50 resize-none"
              />
            </div>

            {/* Error message */}
            {formState === "error" && errorMessage && (
              <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {errorMessage}
              </p>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={formState === "loading"}
                className="text-slate-400 hover:text-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  formState === "loading" || !name || !email || !message
                }
                className="bg-[var(--oi-primary)] text-white hover:bg-[var(--oi-primary-lt)] disabled:opacity-50"
              >
                {formState === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
