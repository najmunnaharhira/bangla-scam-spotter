import { Link } from "@tanstack/react-router";

import { useLanguage } from "@/components/language-provider";

const FOOTER_LINKS = [
  { to: "/", key: "nav.home" },
  { to: "/check", key: "nav.checkFull" },
  { to: "/history", key: "nav.history" },
  { to: "/practice", key: "nav.practice" },
  { to: "/scam-map", key: "nav.scamMap" },
  { to: "/help", key: "nav.help" },
  { to: "/about", key: "nav.about" },
] as const;

export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="font-semibold">ScamShield BD</p>
          <p className="max-w-sm text-sm text-muted-foreground">{t("footer.tagline")}</p>
          <p className="text-xs text-muted-foreground">{t("footer.builtFor")}</p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <nav aria-label={t("footer.navLabel")} className="flex flex-wrap gap-x-4 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-muted-foreground">{t("footer.copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
