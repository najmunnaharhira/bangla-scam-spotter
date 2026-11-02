import type * as React from "react";
import { Link } from "@tanstack/react-router";
import { LogOut, ShieldCheck } from "lucide-react";

import { BuildathonSticker } from "@/components/buildathon-sticker";
import { Button } from "@/components/ui/button";

/**
 * Standalone shell for the admin panel — deliberately NOT the public site's
 * header/footer/chat widget (those hide themselves on /admin routes; see
 * site-header.tsx, site-footer.tsx, pwa-install-prompt.tsx,
 * talk-to-scamshield.tsx). Fixed dark/light styling on purpose, independent
 * of the visitor's public-site theme toggle, so the admin panel always reads
 * the same way regardless of prior theme state.
 */
export function AdminShell({
  children,
  email,
  onSignOut,
}: {
  children: React.ReactNode;
  email?: string;
  onSignOut?: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:gap-4">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </span>
            <span className="font-bold tracking-tight text-white">ScamShield</span>
            <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
              Admin
            </span>
          </Link>

          <BuildathonSticker className="hidden shrink-0 items-center rounded-lg bg-white p-[2px] shadow-sm sm:inline-flex" />

          <div className="ml-auto flex items-center gap-3">
            {email ? (
              <span className="hidden max-w-[12rem] truncate text-sm text-slate-400 sm:inline">
                {email}
              </span>
            ) : null}
            {onSignOut ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800 hover:text-white"
                onClick={onSignOut}
              >
                <LogOut className="size-4" aria-hidden="true" />
                Sign out
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="flex-1 text-slate-900">{children}</main>

      <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500">
        ScamShield BD Admin · Authorized personnel only ·{" "}
        <Link to="/" className="font-medium text-primary hover:underline">
          Back to site
        </Link>
      </footer>
    </div>
  );
}
