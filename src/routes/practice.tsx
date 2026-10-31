import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2, RefreshCw, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";

import { AppLayout } from "@/components/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generatePractice } from "@/lib/ai/scamshield.functions";
import { FALLBACK_PRACTICE, isAiUnavailable } from "@/lib/local-analyzer";
import type { PracticeItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/practice")({
  component: PracticePage,
});

function friendlyErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/^[A-Z_]+:\s*/, "") || "Something went wrong. Please try again.";
}

function PracticePage() {
  const [items, setItems] = React.useState<PracticeItem[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [answers, setAnswers] = React.useState<Record<number, boolean>>({});
  const [index, setIndex] = React.useState(0);
  const [offline, setOffline] = React.useState(false);

  const loadRound = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setAnswers({});
    setIndex(0);
    try {
      const round = await generatePractice({ data: {} });
      setItems(round);
      setOffline(false);
    } catch (err) {
      if (isAiUnavailable(err)) {
        // Keep the game playable when the AI is down: use the built-in round.
        setItems(FALLBACK_PRACTICE);
        setOffline(true);
      } else {
        setError(friendlyErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadRound();
  }, [loadRound]);

  const current = items?.[index];
  const answered = current ? answers[index] !== undefined : false;
  const score = Object.entries(answers).filter(
    ([i, guess]) => guess === items?.[Number(i)]?.isScam,
  ).length;

  const guess = (isScam: boolean) => {
    if (answered) return;
    setAnswers((prev) => ({ ...prev, [index]: isScam }));
  };

  const next = () => {
    if (!items) return;
    setIndex((i) => Math.min(i + 1, items.length - 1));
  };

  const roundDone = items != null && Object.keys(answers).length === items.length;

  return (
    <AppLayout>
      <section className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Scam Spotter practice</h1>
        <p className="mt-2 text-muted-foreground">
          Read each message and guess: is it a scam or genuine? Learn the red flags as you go.
        </p>

        {loading ? (
          <div className="mt-10 flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" aria-hidden="true" />
            <p>Generating a new round...</p>
          </div>
        ) : error ? (
          <div className="mt-10 rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
            <p>{error}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={() => void loadRound()}
            >
              Try again
            </Button>
          </div>
        ) : items && current ? (
          <div className="mt-6 space-y-5">
            {offline ? (
              <p className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
                The AI is busy, so this is a built-in practice round. Play again later for fresh AI
                messages.
              </p>
            ) : null}
            <div
              className="flex items-center justify-between text-sm text-muted-foreground"
              aria-live="polite"
            >
              <span>
                Message {index + 1} of {items.length}
              </span>
              <span>
                Score: {score}/{Object.keys(answers).length}
              </span>
            </div>

            <Card>
              <CardContent className="pt-6 text-base leading-relaxed">
                {current.message}
              </CardContent>
            </Card>

            {!answered ? (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="border-danger/40 hover:border-danger hover:bg-danger/10"
                  onClick={() => guess(true)}
                >
                  <ShieldAlert className="size-4" aria-hidden="true" />
                  Scam
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="border-safe/40 hover:border-safe hover:bg-safe/10"
                  onClick={() => guess(false)}
                >
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  Genuine
                </Button>
              </div>
            ) : (
              <Card
                className={cn(
                  "border-2",
                  answers[index] === current.isScam ? "border-safe" : "border-danger",
                )}
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {answers[index] === current.isScam ? (
                      <CheckCircle2 className="size-5 text-safe" aria-hidden="true" />
                    ) : (
                      <XCircle className="size-5 text-danger" aria-hidden="true" />
                    )}
                    <CardTitle className="text-base">
                      {answers[index] === current.isScam ? "Correct!" : "Not quite"}
                    </CardTitle>
                    <Badge variant={current.isScam ? "scam" : "safe"} className="ml-auto">
                      {current.isScam ? "Scam" : "Genuine"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{current.explanation}</p>
                  {current.redFlags.length > 0 ? (
                    <ul className="list-inside list-disc space-y-1 text-sm">
                      {current.redFlags.map((flag, i) => (
                        <li key={i}>{flag}</li>
                      ))}
                    </ul>
                  ) : null}
                </CardContent>
              </Card>
            )}

            {answered && !roundDone ? (
              <Button type="button" size="lg" className="w-full" onClick={next}>
                Next message
              </Button>
            ) : null}

            {roundDone ? (
              <div className="rounded-lg border border-border bg-card p-5 text-center">
                <p className="text-lg font-semibold">
                  Round finished — {score}/{items.length} correct
                </p>
                <Button type="button" className="mt-4" onClick={() => void loadRound()}>
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Play again
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </AppLayout>
  );
}
