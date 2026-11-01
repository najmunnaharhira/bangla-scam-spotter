import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ImageIcon, MessageSquareText, ShieldAlert, ShieldCheck, ShieldQuestion, Trash2 } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHistory } from "@/hooks/use-check-history";
import type { Verdict } from "@/lib/types";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

function verdictBadgeVariant(verdict: Verdict): "safe" | "suspicious" | "scam" {
  if (verdict === "safe") return "safe";
  if (verdict === "suspicious") return "suspicious";
  return "scam";
}

function VerdictIcon({ verdict, className }: { verdict: Verdict; className?: string }) {
  if (verdict === "safe") return <ShieldCheck className={className} aria-hidden="true" />;
  if (verdict === "suspicious") return <ShieldQuestion className={className} aria-hidden="true" />;
  return <ShieldAlert className={className} aria-hidden="true" />;
}

function HistoryPage() {
  const { t, lang } = useLanguage();
  const { history, hydrated, clear } = useHistory();
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const scamsCaught = history.filter((record) => record.result.verdict !== "safe").length;

  const handleClear = () => {
    if (window.confirm(t("history.clearConfirm"))) clear();
  };

  const dateFormatter = React.useMemo(
    () => new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-US", { dateStyle: "medium", timeStyle: "short" }),
    [lang],
  );

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("history.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("history.subtitle")}</p>
        </div>
        {hydrated && history.length > 0 ? (
          <Button type="button" variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="size-4" aria-hidden="true" />
            {t("history.clear")}
          </Button>
        ) : null}
      </div>

      {hydrated && history.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("history.totalChecked")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{history.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("history.scamsCaught")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums text-danger">{scamsCaught}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {!hydrated ? null : history.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <p>{t("history.empty")}</p>
          <Button asChild>
            <Link to="/check">{t("history.checkFirst")}</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {history.map((record) => {
            const isOpen = expanded === record.id;
            return (
              <li key={record.id}>
                <Card>
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : record.id)}
                    className="flex w-full items-start gap-3 p-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <VerdictIcon
                      verdict={record.result.verdict}
                      className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={verdictBadgeVariant(record.result.verdict)}>
                          {t(`verdict.${record.result.verdict}`)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {dateFormatter.format(record.createdAt)}
                        </span>
                        {record.inputType === "image" ? (
                          <ImageIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                        ) : (
                          <MessageSquareText className="size-3.5 text-muted-foreground" aria-hidden="true" />
                        )}
                      </div>
                      <p className="mt-1 truncate text-sm">{record.preview}</p>
                    </div>
                  </button>
                  {isOpen ? (
                    <CardContent className="space-y-3 border-t border-border pt-4">
                      <p className="text-sm text-muted-foreground">{record.result.summary}</p>
                      {record.result.redFlags.length > 0 ? (
                        <ul className="space-y-2">
                          {record.result.redFlags.map((flag, i) => (
                            <li key={i} className="rounded-lg bg-muted p-3 text-sm">
                              <p className="font-medium">&ldquo;{flag.quote}&rdquo;</p>
                              <p className="mt-1 text-muted-foreground">{flag.reason}</p>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </CardContent>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
