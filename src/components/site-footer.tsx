import { Link } from "@tanstack/react-router";

import { BuildathonSticker } from "@/components/buildathon-sticker";

const FOOTER_LINKS = [
  { to: "/", label: "Home" },
  { to: "/check", label: "Check a message" },
  { to: "/practice", label: "Practice" },
  { to: "/help", label: "Get Help" },
  { to: "/about", label: "About" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="font-semibold">ScamShield BD</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            An AI scam checker for Bangladesh. Check a message, learn the red flags, protect your
            family.
          </p>
          <p className="text-xs text-muted-foreground">
            Built For Ostad Presents YUNet AIgnite Buildathon 2026
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-4 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-muted-foreground">
            © 2026 ScamShield BD. AI-based risk estimates, not legal or financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
