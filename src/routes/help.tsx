import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Heart, Loader2, Phone, ShieldAlert } from "lucide-react";

import { AppLayout } from "@/components/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { generateRecoveryPlan } from "@/lib/ai/scamshield.functions";
import { isAiUnavailable, recoveryPlanLocally } from "@/lib/local-analyzer";
import { HELPLINES, WHAT_TO_DO_IF_SCAMMED } from "@/lib/sample-data";
import type { RecoveryPlan } from "@/lib/types";

export const Route = createFileRoute("/help")({
  component: HelpPage,
});

function friendlyErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/^[A-Z_]+:\s*/, "") || "Something went wrong. Please try again.";
}

function HelpPage() {
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [plan, setPlan] = React.useState<RecoveryPlan | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || loading) return;
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const result = await generateRecoveryPlan({ data: { description: description.trim() } });
      setPlan(result);
    } catch (err) {
      if (isAiUnavailable(err)) {
        // AI is unavailable: give the built-in plan so the person is never left without steps.
        setPlan(recoveryPlanLocally(description.trim()));
      } else {
        setError(friendlyErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
            <ShieldAlert className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Think you've been scammed?
            </h1>
            <p className="mt-1 text-muted-foreground">
              This is not your fault. Tell us what happened and get a step-by-step plan.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <label htmlFor="what-happened" className="text-sm font-medium">
            What happened?
          </label>
          <Textarea
            id="what-happened"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened, in your own words (English or Bangla)..."
            rows={5}
            maxLength={2000}
          />
          {error ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p>{error}</p>
            </div>
          ) : null}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!description.trim() || loading}
          >
            {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {loading ? "Building your plan..." : "Get my recovery plan"}
          </Button>
        </form>

        {plan ? (
          <div className="mt-8 space-y-5" aria-live="polite">
            <Card className="border-2 border-primary">
              <CardHeader>
                <Badge variant="primary" className="mb-2 w-fit">
                  {plan.scamType}
                </Badge>
                <CardTitle>What to do now</CardTitle>
                {plan.summary ? (
                  <CardDescription className="mt-1">{plan.summary}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.steps.map((step, i) => (
                  <div key={i} className="flex gap-3 rounded-lg border border-border bg-card p-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {i + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{step.title}</p>
                        {step.urgent ? <Badge variant="scam">Do this now</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {plan.helplines.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Call these numbers</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {plan.helplines.map((line, i) => (
                    <Badge key={i} variant="outline" className="text-sm">
                      <Phone className="size-3" aria-hidden="true" />
                      {line}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-safe/40 bg-safe/5">
              <CardContent className="flex items-start gap-3 pt-5">
                <Heart className="mt-0.5 size-5 shrink-0 text-safe" aria-hidden="true" />
                <p className="text-sm">{plan.reassurance}</p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="mt-12 space-y-5">
          <h2 className="text-xl font-bold tracking-tight">General steps if you've been scammed</h2>
          <Card>
            <CardContent className="pt-5">
              <ul className="list-inside list-disc space-y-2 text-sm">
                {WHAT_TO_DO_IF_SCAMMED.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <h2 className="text-xl font-bold tracking-tight">Official helplines</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {HELPLINES.map((line) => (
              <Card key={line.name}>
                <CardContent className="flex items-center justify-between gap-3 pt-5">
                  <div>
                    <p className="font-semibold">{line.name}</p>
                    <p className="text-sm text-muted-foreground">{line.note}</p>
                  </div>
                  <a
                    href={`tel:${line.number}`}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                  >
                    <Phone className="size-4" aria-hidden="true" />
                    {line.number}
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
