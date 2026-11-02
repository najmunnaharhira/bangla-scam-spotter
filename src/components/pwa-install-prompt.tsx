import * as React from "react";
import { useLocation } from "@tanstack/react-router";
import { Download, X } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "scamshield-pwa-dismissed";

export function PwaInstallPrompt() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability still works without a successful registration; ignore.
      });
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      let dismissed = false;
      try {
        dismissed = window.localStorage.getItem(DISMISSED_KEY) === "1";
      } catch {
        // ignore
      }
      if (dismissed) return;
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  if (!visible || !deferred || pathname.startsWith("/admin")) return null;

  return (
    <div className="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-lg sm:inset-x-auto sm:right-4">
      <div className="flex-1">
        <p className="text-sm font-semibold">{t("pwa.installTitle")}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("pwa.installDesc")}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button type="button" size="sm" onClick={() => void install()}>
          <Download className="size-4" aria-hidden="true" />
          {t("pwa.install")}
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={dismiss} aria-label={t("pwa.dismiss")}>
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
