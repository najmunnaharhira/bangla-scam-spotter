import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ShieldCheck, Sparkles, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GOLDEN_RULES } from "@/lib/sample-data";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">About ScamShield BD</h1>
        <p className="mt-3 text-muted-foreground">
          Scams targeting mobile financial services, job seekers and families cost people in
          Bangladesh real money every day — and the people most at risk are often the ones with the
          least access to tools that explain the warning signs in plain language. ScamShield BD uses
          AI to read any suspicious message or screenshot and explain, in simple English or Bangla,
          whether it's safe, suspicious, or a likely scam.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <Target className="size-6 text-primary" aria-hidden="true" />
              <CardTitle className="mt-2 text-base">Our mission</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Help everyday people in Bangladesh recognise scams before they lose money, not after.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <BookOpen className="size-6 text-primary" aria-hidden="true" />
              <CardTitle className="mt-2 text-base">How it works</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              AI trained on common Bangladeshi scam patterns reads your message or screenshot and
              scores the risk with clear reasons, not a black box.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Sparkles className="size-6 text-primary" aria-hidden="true" />
              <CardTitle className="mt-2 text-base">Built for everyone</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Simple language, Bangla explanations for family members, and a practice game to build
              lasting awareness.
            </CardContent>
          </Card>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold tracking-tight">Golden rules to stay safe</h2>
          <Card className="mt-4">
            <CardContent className="pt-5">
              <ul className="list-inside list-disc space-y-2 text-sm">
                {GOLDEN_RULES.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Built For Ostad Presents YUNet AIgnite Buildathon 2026. AI-based risk estimates, not
            legal or financial advice.
          </p>
          <Button asChild className="mt-4">
            <Link to="/check">Check your first message</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
