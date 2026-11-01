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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GOLDEN_RULES, SCAM_TYPES } from "@/lib/sample-data";

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
  {
    icon: MessageSquareText,
    title: "1. Paste the message",
    description:
      "Copy the SMS, Messenger text or bKash notification — or upload a screenshot of it.",
  },
  {
    icon: ShieldCheck,
    title: "2. Get the verdict",
    description:
      "ScamShield reads it and gives a risk score, the exact red flags and what the scammer is trying to do.",
  },
  {
    icon: Languages,
    title: "3. Share it safely",
    description:
      "Read a simple Bangla explanation and pass it on to parents and grandparents before anyone sends money.",
  },
];

function Index() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-accent/60 to-background">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:py-20">
          <div>
            <Badge variant="secondary" className="mb-4">
              Free · Nothing you check is stored on a server
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
              Spot the scam before it costs you
            </h1>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">
              ScamShield BD checks suspicious messages — fake bKash “wrong sends”, OTP thieves, fake
              jobs and lottery wins — and explains the red flags in simple English and Bangla.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/check">
                  Check a message <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/practice">
                  <Gamepad2 aria-hidden="true" /> Try the practice game
                </Link>
              </Button>
            </div>
          </div>
          <img
            src={heroImage}
            alt="Illustration of a person checking a suspicious message with ScamShield BD"
            className="mx-auto w-full max-w-md rounded-2xl border border-border shadow-lg md:max-w-none"
            loading="eager"
          />
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-it-works" className="mx-auto w-full max-w-6xl px-4 py-14">
        <h2 id="how-it-works" className="text-2xl font-bold tracking-tight md:text-3xl">
          How it works
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {HOW_IT_WORKS.map((step) => (
            <Card key={step.title}>
              <CardHeader>
                <span className="mb-2 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <CardTitle className="text-lg">{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Scam types */}
      <section aria-labelledby="scam-types" className="border-y border-border bg-card/50">
        <div className="mx-auto w-full max-w-6xl px-4 py-14">
          <h2 id="scam-types" className="text-2xl font-bold tracking-tight md:text-3xl">
            Scams we catch
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            These are the tricks most used in Bangladesh right now. Every one of them can be spotted
            with a quick check.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SCAM_TYPES.map((scam) => (
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
          Golden rules
        </h2>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {GOLDEN_RULES.slice(0, 6).map((rule) => (
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
            See all rules and helplines <ArrowRight aria-hidden="true" />
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
              Already replied to a suspicious message?
            </h2>
            <p className="mt-2 max-w-xl text-primary-foreground/85">
              Describe what happened in your own words and get a personalised action plan: who to
              call first, how to protect your account, and what to watch out for next.
            </p>
          </div>
          <Button asChild size="lg" variant="secondary" className="shrink-0">
            <Link to="/help" hash="recover">
              <HeartHandshake aria-hidden="true" /> Get my next steps
            </Link>
          </Button>
        </div>
      </section>

      {/* Emergency strip */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5 sm:flex-row sm:items-center">
          <Siren className="size-6 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-sm text-foreground">
            If money is leaving your account right now, don't wait for a website — call{" "}
            <strong>bKash 16247</strong>, <strong>Nagad 16167</strong> or{" "}
            <strong>emergency 999</strong> first.
          </p>
        </div>
      </section>
    </div>
  );
}
