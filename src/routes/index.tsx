import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Gamepad2,
  HeartHandshake,
  Languages,
  MessageSquareText,
  ShieldCheck,
  Siren,
} from "lucide-react";

import heroImage from "@/assets/hero-scamshield.png";
import { useLanguage } from "@/components/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { localizedGoldenRules, localizedScamTypes } from "@/lib/sample-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "ScamShield BD — Check scams before they cost you",
      },
      {
        name: "description",
        content:
          "Paste a suspicious SMS, Messenger or bKash message and get an instant AI risk check with red flags, next steps and a simple Bangla explanation. Free and private.",
      },
      {
        property: "og:title",
        content: "ScamShield BD — Check scams before they cost you",
      },
      {
        property: "og:description",
        content:
          "Instant AI risk check for suspicious messages in Bangladesh: red flags, next steps and a simple Bangla explanation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        name: "twitter:title",
        content: "ScamShield BD — Check scams before they cost you",
      },
      {
        name: "twitter:description",
        content:
          "Instant AI risk check for suspicious messages in Bangladesh: red flags, next steps and a simple Bangla explanation.",
      },
    ],
  }),
  component: Index,
});

const HOW_IT_WORKS = [
  { icon: MessageSquareText, titleKey: "home.step1Title", descriptionKey: "home.step1Desc" },
  { icon: ShieldCheck, titleKey: "home.step2Title", descriptionKey: "home.step2Desc" },
  { icon: Languages, titleKey: "home.step3Title", descriptionKey: "home.step3Desc" },
];

function Index() {
  const { t, lang } = useLanguage();
  const scamTypes = localizedScamTypes(lang);
  const goldenRules = localizedGoldenRules(lang);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-accent/60 to-background">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:py-20">
          <div>
            <Badge variant="secondary" className="mb-4">
              {t("home.badge")}
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
              {t("home.heroTitle")}
            </h1>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">{t("home.heroParagraph")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/check">
                  {t("home.checkCta")} <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/practice">
                  <Gamepad2 aria-hidden="true" /> {t("home.practiceCta")}
                </Link>
              </Button>
            </div>
          </div>
          <img
            src={heroImage}
            alt={t("home.heroImageAlt")}
            className="mx-auto w-full max-w-md rounded-2xl border border-border shadow-lg md:max-w-none"
            loading="eager"
          />
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-it-works" className="mx-auto w-full max-w-6xl px-4 py-14">
        <h2 id="how-it-works" className="text-2xl font-bold tracking-tight md:text-3xl">
          {t("home.howItWorks")}
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {HOW_IT_WORKS.map((step) => (
            <Card key={step.titleKey}>
              <CardHeader>
                <span className="mb-2 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <CardTitle className="text-lg">{t(step.titleKey)}</CardTitle>
                <CardDescription>{t(step.descriptionKey)}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Scam types */}
      <section aria-labelledby="scam-types" className="border-y border-border bg-card/50">
        <div className="mx-auto w-full max-w-6xl px-4 py-14">
          <h2 id="scam-types" className="text-2xl font-bold tracking-tight md:text-3xl">
            {t("home.scamTypes")}
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t("home.scamTypesIntro")}</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scamTypes.map((scam) => (
              <li key={scam.title}>
                <Card className="h-full">
                  <CardHeader>
                    <span className="mb-2 inline-flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                      <scam.icon className="size-5" aria-hidden="true" />
                    </span>
                    <CardTitle className="text-base">{scam.title}</CardTitle>
                    <CardDescription className="text-sm">{scam.description}</CardDescription>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Golden rules */}
      <section aria-labelledby="golden-rules" className="mx-auto w-full max-w-6xl px-4 py-14">
        <h2 id="golden-rules" className="text-2xl font-bold tracking-tight md:text-3xl">
          {t("home.goldenRules")}
        </h2>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {goldenRules.slice(0, 6).map((rule) => (
            <li
              key={rule}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm"
            >
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-safe" aria-hidden="true" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
        <Button asChild variant="ghost" className="mt-4">
          <Link to="/help">
            {t("home.seeAllRules")} <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </section>

      {/* Already scammed CTA */}
      <section
        aria-labelledby="scammed-cta"
        className="border-t border-border bg-primary text-primary-foreground"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-4 px-4 py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="scammed-cta" className="text-2xl font-bold tracking-tight md:text-3xl">
              {t("home.alreadyRepliedTitle")}
            </h2>
            <p className="mt-2 max-w-xl text-primary-foreground/85">
              {t("home.alreadyRepliedParagraph")}
            </p>
          </div>
          <Button asChild size="lg" variant="secondary" className="shrink-0">
            <Link to="/help" hash="recover">
              <HeartHandshake aria-hidden="true" /> {t("home.getNextSteps")}
            </Link>
          </Button>
        </div>
      </section>

      {/* Emergency strip */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5 sm:flex-row sm:items-center">
          <Siren className="size-6 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-sm text-foreground">{t("home.emergencyText")}</p>
        </div>
      </section>
    </div>
  );
}
