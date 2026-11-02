import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Heart,
  Info,
  Loader2,
  MessageCircleQuestion,
  Phone,
  Send,
  ShieldAlert,
} from "lucide-react";

import { useWebMCP } from "use-webmcp-tool";

import { useLanguage } from "@/components/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { askRecoveryFollowUp, generateRecoverySteps } from "@/lib/ai/scamshield.functions";
import {
  followUpLocally,
  isAiUnavailable,
  recoveryPlanLocally,
  type IncidentReport,
} from "@/lib/local-analyzer";
import { CHANNELS, localizedHelplines, localizedWhatToDoIfScammed } from "@/lib/sample-data";
import type { MoneySent, RecoveryPlan, WhenHappened } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Get help after a scam — ScamShield BD" },
      {
        name: "description",
        content:
          "Describe what happened and get a personal action plan, then ask follow-up questions.",
      },
    ],
  }),
  component: HelpPage,
});

const MIN_DESCRIPTION = 10;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function friendlyErrorMessage(error: unknown, genericError: string): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/^[A-Z_]+:\s*/, "") || genericError;
}

function HelpPage() {
  const { t, tf, lang } = useLanguage();
  const helplines = localizedHelplines(lang);
  const whatToDoIfScammed = localizedWhatToDoIfScammed(lang);
  const [whatHappened, setWhatHappened] = React.useState("");
  const [channel, setChannel] = React.useState<string>("SMS");
  const [moneySent, setMoneySent] = React.useState<MoneySent>("not_sure");
  const [whenHappened, setWhenHappened] = React.useState<WhenHappened>("last_24h");
  const [provider, setProvider] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [plan, setPlan] = React.useState<RecoveryPlan | null>(null);
  const [incident, setIncident] = React.useState<IncidentReport | null>(null);
  const [offline, setOffline] = React.useState(false);
  const planRef = React.useRef<HTMLDivElement>(null);

  const canSubmit = whatHappened.trim().length >= MIN_DESCRIPTION && !loading;

  // Fills the form only; the person still presses the button (handy for demos).
  const fillExample = () => {
    setWhatHappened(
      "Someone called saying they were from bKash and asked for the OTP to fix my account. I told them and Tk 3,000 was taken.",
    );
    setMoneySent("pin_otp");
    setWhenHappened("last_24h");
    setChannel("Phone call");
    setProvider("bKash");
    setError(null);
  };

  /** Core recovery-plan flow, shared by the form submit handler and the WebMCP agent tool. */
  const runPlan = React.useCallback(
    async (report: IncidentReport): Promise<RecoveryPlan> => {
      setLoading(true);
      setError(null);
      setPlan(null);
      setOffline(false);
      try {
        const generated = await generateRecoverySteps({ data: report });
        setPlan(generated);
        setIncident(report);
        return generated;
      } catch (err) {
        if (isAiUnavailable(err)) {
          // AI is unavailable: give the built-in plan so the person is never left without steps.
          const local = recoveryPlanLocally(report);
          setPlan(local);
          setIncident(report);
          setOffline(true);
          return local;
        }
        const message = friendlyErrorMessage(err, t("common.genericError"));
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
        requestAnimationFrame(() => planRef.current?.focus());
      }
    },
    [t],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await runPlan({
      whatHappened: whatHappened.trim(),
      channel,
      moneySent,
      whenHappened,
      provider: provider.trim() || undefined,
    }).catch(() => {
      // Error state is already surfaced via setError inside runPlan.
    });
  };

  useWebMCP<{
    what_happened: string;
    money_sent: MoneySent;
    when_happened: WhenHappened;
    channel?: string;
    provider?: string;
  }>({
    name: "get_recovery_plan",
    description:
      "Builds a personalised scam-recovery action plan on ScamShield BD's Get Help page for someone who already replied to or was affected by a scam. Fills in and submits the form, then returns urgency, the likely scam type, prioritised steps, who to report to, and follow-up scams to watch for.",
    inputSchema: {
      type: "object",
      properties: {
        what_happened: { type: "string", description: "What happened, in the person's own words (at least 10 characters)" },
        money_sent: {
          type: "string",
          enum: ["yes", "pin_otp", "no", "not_sure"],
          description: "Whether money was sent or a PIN/OTP was shared",
        },
        when_happened: {
          type: "string",
          enum: ["last_24h", "within_week", "older", "ongoing"],
          description: "When it happened",
        },
        channel: { type: "string", description: "How they were contacted, e.g. Phone call, SMS (optional)" },
        provider: { type: "string", description: "Service involved, e.g. bKash, Nagad (optional)" },
      },
      required: ["what_happened", "money_sent", "when_happened"],
    },
    execute: async ({ what_happened, money_sent, when_happened, channel: inputChannel, provider: inputProvider }) => {
      setWhatHappened(what_happened);
      setMoneySent(money_sent);
      setWhenHappened(when_happened);
      if (inputChannel) setChannel(inputChannel);
      if (inputProvider) setProvider(inputProvider);
      const generated = await runPlan({
        whatHappened: what_happened.trim(),
        channel: inputChannel ?? channel,
        moneySent: money_sent,
        whenHappened: when_happened,
        provider: inputProvider?.trim() || undefined,
      });
      const steps = generated.steps.map((s, i) => `${i + 1}. [${s.priority === 1 ? "now" : s.priority === 2 ? "today" : "when you can"}] ${s.title}: ${s.detail}`).join("\n");
      return `Urgency: ${generated.urgency}\nLikely scam type: ${generated.scamType}\n${generated.whatLikelyHappened}\n\nSteps:\n${steps}\n\nReport to: ${generated.reportTo.join(", ")}`;
    },
  });

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
          <ShieldAlert className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("help.title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("help.intro")}</p>
        </div>
      </div>

      <form
        id="recover"
        onSubmit={handleSubmit}
        className="mt-6 scroll-mt-24 space-y-5"
        aria-label="Recovery assistant"
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="what-happened">{t("help.whatHappenedLabel")}</Label>
            <button
              type="button"
              onClick={fillExample}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              {t("help.tryExample")}
            </button>
          </div>
          <Textarea
            id="what-happened"
            value={whatHappened}
            onChange={(e) => setWhatHappened(e.target.value)}
            placeholder={t("help.descriptionPlaceholder")}
            rows={5}
            maxLength={2000}
            aria-describedby="what-happened-hint"
          />
          <p id="what-happened-hint" className="text-xs text-muted-foreground">
            {tf("help.descriptionHint", { min: MIN_DESCRIPTION })}
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t("help.moneySentLegend")}</legend>
          <RadioGroup
            value={moneySent}
            onValueChange={(value) => setMoneySent(value as MoneySent)}
            className="grid gap-2 sm:grid-cols-2"
          >
            {(["yes", "pin_otp", "no", "not_sure"] as MoneySent[]).map((key) => (
              <Label
                key={key}
                htmlFor={`money-${key}`}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 font-normal has-[[data-state=checked]]:border-primary"
              >
                <RadioGroupItem id={`money-${key}`} value={key} />
                {t(`moneySent.${key}`)}
              </Label>
            ))}
          </RadioGroup>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="when">{t("help.whenLabel")}</Label>
            <Select
              value={whenHappened}
              onValueChange={(value) => setWhenHappened(value as WhenHappened)}
            >
              <SelectTrigger id="when">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["last_24h", "within_week", "older", "ongoing"] as WhenHappened[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`when.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="help-channel">{t("help.channelLabel")}</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger id="help-channel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`channel.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider">{t("help.providerLabel")}</Label>
            <Input
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder={t("help.providerPlaceholder")}
              maxLength={60}
            />
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {loading ? t("help.submitting") : t("help.submit")}
        </Button>
      </form>

      {plan && incident ? (
        <div
          ref={planRef}
          tabIndex={-1}
          aria-label="Your action plan"
          aria-live="polite"
          className="mt-8 space-y-5 outline-none"
        >
          {offline ? (
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p>{t("help.offlineNotice")}</p>
            </div>
          ) : null}

          <Card
            className={cn(
              "border-2",
              plan.urgency === "immediate" ? "border-danger" : "border-primary",
            )}
          >
            <CardHeader>
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge variant={plan.urgency === "immediate" ? "scam" : "suspicious"}>
                  {t(`urgency.${plan.urgency}`)}
                </Badge>
                <Badge variant="outline">{plan.scamType}</Badge>
              </div>
              <CardTitle>{t("help.actionPlanTitle")}</CardTitle>
              {plan.whatLikelyHappened ? (
                <CardDescription className="mt-1">{plan.whatLikelyHappened}</CardDescription>
              ) : null}
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {plan.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 rounded-lg border border-border bg-card p-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {i + 1}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{step.title}</p>
                        <Badge variant={step.priority === 1 ? "scam" : "outline"}>
                          {t(`priority.${step.priority}`)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {plan.watchOut.length > 0 ? (
            <Card className="border-suspicious/60">
              <CardHeader>
                <CardTitle className="text-base">{t("help.watchOutTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-1.5 text-sm">
                  {plan.watchOut.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {plan.reportTo.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("help.reportToTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {plan.reportTo.map((line, i) => (
                  <Badge key={i} variant="outline" className="text-sm">
                    <Phone className="size-3" aria-hidden="true" />
                    {line}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {plan.familyAdvice ? (
            <Card className="border-safe/40 bg-safe/5">
              <CardContent className="flex items-start gap-3 pt-5">
                <Heart className="mt-0.5 size-5 shrink-0 text-safe" aria-hidden="true" />
                <p className="text-sm">{plan.familyAdvice}</p>
              </CardContent>
            </Card>
          ) : null}

          <FollowUpChat incident={incident} plan={plan} offline={offline} />
        </div>
      ) : null}

      <div className="mt-12 space-y-5">
        <h2 className="text-xl font-bold tracking-tight">{t("help.generalStepsTitle")}</h2>
        <Card>
          <CardContent className="pt-5">
            <ul className="list-inside list-disc space-y-2 text-sm">
              {whatToDoIfScammed.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <h2 className="text-xl font-bold tracking-tight">{t("help.helplinesTitle")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {helplines.map((line) => (
            <Card key={line.name}>
              <CardContent className="flex items-center justify-between gap-3 pt-5">
                <div>
                  <p className="font-semibold">{line.name}</p>
                  <p className="text-sm text-muted-foreground">{line.note}</p>
                </div>
                <a
                  href={`tel:${line.number}`}
                  aria-label={tf("help.callAriaLabel", { name: line.name, number: line.number })}
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
  );
}

/** Follow-up questions about the plan, answered from the reported incident and plan only. */
function FollowUpChat({
  incident,
  plan,
  offline,
}: {
  incident: IncidentReport;
  plan: RecoveryPlan;
  offline: boolean;
}) {
  const { t } = useLanguage();
  const SUGGESTED_QUESTIONS = [t("help.suggested1"), t("help.suggested2"), t("help.suggested3")];
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [question, setQuestion] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);

  // A new plan starts a new conversation.
  React.useEffect(() => {
    setMessages([]);
  }, [plan]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages]);

  const ask = async (text: string) => {
    const q = text.trim();
    if (q.length < 2 || loading) return;
    const history = messages;
    setMessages([...history, { role: "user", content: q }]);
    setQuestion("");
    setLoading(true);
    let answer: string;
    if (offline) {
      answer = followUpLocally(plan);
    } else {
      try {
        answer = await askRecoveryFollowUp({ data: { incident, plan, history, question: q } });
      } catch (err) {
        answer = isAiUnavailable(err)
          ? followUpLocally(plan)
          : friendlyErrorMessage(err, t("common.genericError"));
      }
    }
    setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircleQuestion className="size-5 text-primary" aria-hidden="true" />
          {t("help.followUpTitle")}
        </CardTitle>
        <CardDescription>{t("help.followUpDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {messages.length > 0 ? (
          <div className="space-y-3" role="log" aria-live="polite" aria-label="Follow-up answers">
            {messages.map((message, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[90%] whitespace-pre-line rounded-lg px-3 py-2 text-sm",
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                <span className="sr-only">
                  {message.role === "user" ? t("help.youLabel") : t("help.assistantLabel")}{" "}
                </span>
                {message.content}
              </div>
            ))}
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t("help.thinking")}
              </div>
            ) : null}
            <div ref={endRef} />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void ask(suggestion)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(question);
          }}
        >
          <Label htmlFor="follow-up" className="sr-only">
            {t("help.questionSrLabel")}
          </Label>
          <Input
            id="follow-up"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t("help.followUpPlaceholder")}
            maxLength={500}
            disabled={loading}
          />
          <Button type="submit" disabled={loading || question.trim().length < 2}>
            <Send className="size-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{t("help.ask")}</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
