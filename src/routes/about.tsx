import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ShieldCheck, Sparkles, Target } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { localizedGoldenRules } from "@/lib/sample-data";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  const { t, lang } = useLanguage();
  const goldenRules = localizedGoldenRules(lang);

  return (
    <>
      <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{t("about.title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("about.paragraph")}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <Target className="size-6 text-primary" aria-hidden="true" />
              <CardTitle className="mt-2 text-base">{t("about.missionTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t("about.missionDesc")}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <BookOpen className="size-6 text-primary" aria-hidden="true" />
              <CardTitle className="mt-2 text-base">{t("about.howTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{t("about.howDesc")}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Sparkles className="size-6 text-primary" aria-hidden="true" />
              <CardTitle className="mt-2 text-base">{t("about.builtForTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t("about.builtForDesc")}
            </CardContent>
          </Card>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold tracking-tight">{t("about.goldenRulesTitle")}</h2>
          <Card className="mt-4">
            <CardContent className="pt-5">
              <ul className="list-inside list-disc space-y-2 text-sm">
                {goldenRules.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("about.footerNote")}</p>
          <Button asChild className="mt-4">
            <Link to="/check">{t("about.checkFirstMessage")}</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
