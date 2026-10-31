import * as React from "react";
import { Link, useMatchRoute } from "@tanstack/react-router";
import { Menu, ShieldCheck, X } from "lucide-react";

import { BuildathonSticker } from "@/components/buildathon-sticker";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/check", label: "Check" },
  { to: "/practice", label: "Practice" },
  { to: "/help", label: "Get Help" },
  { to: "/about", label: "About" },
] as const;

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const matchRoute = useMatchRoute();

  const isActive = (to: string) => matchRoute({ to, fuzzy: true }) !== false;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="ScamShield BD home">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <span className="hidden text-base font-bold tracking-tight sm:inline">ScamShield BD</span>
        </Link>

        {/* Official buildathon sticker — visible on every page, desktop and mobile */}
        <BuildathonSticker />

        <nav aria-label="Main navigation" className="ml-auto hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              aria-current={isActive(link.to) ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive(link.to) && "bg-accent text-accent-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto md:ml-2">
          <ThemeToggle />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </Button>
      </div>

      {menuOpen ? (
        <nav id="mobile-nav" aria-label="Mobile navigation" className="border-t border-border md:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-accent",
                    isActive(link.to) && "bg-accent",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
