import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Check,
  Copy,
  Flag,
  ImageUp,
  Info,
  Languages,
  Loader2,
  MessageCircleQuestion,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  X,
} from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useWebMCP } from "use-webmcp-tool";

import { useHistory } from "@/hooks/use-check-history";
import { reportScamSender, useScamReportCount } from "@/hooks/use-scam-reports";
import { analyzeMessage, askCheckFollowUp, explainBangla } from "@/lib/ai/scamshield.functions";
import {
  analyzeLocally,
  checkFollowUpLocally,
  explainBanglaLocally,
  isAiUnavailable,
} from "@/lib/local-analyzer";
import { CHANNELS, EXAMPLE_CHIPS, exampleChipLabel } from "@/lib/sample-data";
import { type AnalysisResult, type CheckRecord, type Verdict } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/check")({
  component: CheckPage,
});

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function friendlyErrorMessage(error: unknown, genericError: string): string {
  const message = error instanceof Error ? error.message : String(error);
  const withoutPrefix = message.replace(/^[A-Z_]+:\s*/, "");
  return withoutPrefix || genericError;
}

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

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function CheckPage() {
  const { t, lang } = useLanguage();
  const [text, setText] = React.useState("");
  const [sender, setSender] = React.useState("");
  const [channel, setChannel] = React.useState<string>("SMS");
  const [image, setImage] = React.useState<{ file: File; preview: string; base64: string } | null>(
    null,
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<AnalysisResult | null>(null);
  const [bangla, setBangla] = React.useState<string | null>(null);
  const [banglaLoading, setBanglaLoading] = React.useState(false);
  const [offline, setOffline] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const resultRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { add } = useHistory();

  const canSubmit = (text.trim().length > 0 || image != null) && !loading;

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError(t("check.chooseImageError"));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(t("check.imageTooLargeError"));
      return;
    }
    const base64 = await readFileAsBase64(file);
    setImage({ file, preview: URL.createObjectURL(file), base64 });
  };

  const removeImage = () => {
    if (image) URL.revokeObjectURL(image.preview);
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /** Core check flow, shared by the form submit handler and the WebMCP agent tool. */
  const runCheck = React.useCallback(
    async (input: {
      text: string;
      sender?: string | undefined;
      channel?: string | undefined;
      imageBase64?: string | undefined;
      imageMimeType?: string | undefined;
    }): Promise<AnalysisResult> => {
      setLoading(true);
      setError(null);
      setResult(null);
      setBangla(null);
      setOffline(false);
      setCopied(false);
      const trimmed = input.text.trim();
      const save = (analysis: AnalysisResult) => {
        setResult(analysis);
        add({
          id: `${Date.now()}`,
          createdAt: Date.now(),
          inputType: input.imageBase64 ? "image" : "text",
          preview: trimmed || analysis.extractedText || "Screenshot check",
          result: analysis,
        } satisfies CheckRecord);
        // Move focus to the result so screen readers and keyboard users land on it.
        requestAnimationFrame(() => resultRef.current?.focus());
      };
      try {
        const analysis = await analyzeMessage({
          data: {
            text: trimmed || undefined,
            imageBase64: input.imageBase64,
            imageMimeType: input.imageMimeType,
            sender: input.sender?.trim() || undefined,
            channel: input.channel,
          },
        });
        save(analysis);
        return analysis;
      } catch (err) {
        if (trimmed && isAiUnavailable(err)) {
          // AI is down or out of credits: fall back to the built-in pattern check.
          setOffline(true);
          const analysis = analyzeLocally(trimmed);
          save(analysis);
          return analysis;
        }
        const message = friendlyErrorMessage(err, t("common.genericError"));
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [add, t],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await runCheck({
      text,
      sender,
      channel,
      imageBase64: image?.base64,
      imageMimeType: image?.file.type,
    }).catch(() => {
      // Error state is already surfaced via setError inside runCheck.
    });
  };

  useWebMCP<{ text: string; sender?: string; channel?: string }>({
    name: "check_message",
    description:
      "Check a suspicious message (SMS, Messenger, email, or call description) for Bangladeshi scam patterns on ScamShield BD. Fills in and submits the Check form, then returns the risk verdict, score, red flags, and next steps.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "The message text to check" },
        sender: { type: "string", description: "Who sent it, e.g. a phone number or name (optional)" },
        channel: {
          type: "string",
          description: "How it was sent: SMS, WhatsApp, Messenger, Email, Phone call, Website, or Other (optional)",
        },
      },
      required: ["text"],
    },
    execute: async ({ text: inputText, sender: inputSender, channel: inputChannel }) => {
      setText(inputText);
      if (inputSender) setSender(inputSender);
      if (inputChannel) setChannel(inputChannel);
      const analysis = await runCheck({ text: inputText, sender: inputSender, channel: inputChannel });
      const flags = analysis.redFlags.map((f) => `- "${f.quote}": ${f.reason}`).join("\n");
      const steps = analysis.nextSteps.map((s) => `- ${s}`).join("\n");
      return `Verdict: ${analysis.verdict} (risk ${analysis.riskScore}/100)\n${analysis.summary}${flags ? `\n\nRed flags:\n${flags}` : ""}${steps ? `\n\nNext steps:\n${steps}` : ""}`;
    },
  });

  const handleExplainBangla = async () => {
    if (!result) return;
    if (offline) {
      setBangla(explainBanglaLocally(result));
      return;
    }
    setBanglaLoading(true);
    try {
      const explanation = await explainBangla({ data: { result } });
      setBangla(explanation);
    } catch {
      setBangla(explainBanglaLocally(result));
    } finally {
      setBanglaLoading(false);
    }
  };

  const copyWarning = async () => {
    if (!result?.familyWarning) return;
    try {
      await navigator.clipboard.writeText(result.familyWarning);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const applyExample = (exampleText: string) => {
    removeImage();
    setText(exampleText);
    setResult(null);
    setBangla(null);
    setError(null);
  };

  return (
    <>
      <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("check.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("check.subtitle")}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLE_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => applyExample(chip.text)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              {t("check.tryLabel")} {exampleChipLabel(lang, chip)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="message-text">{t("check.messageTextLabel")}</Label>
            <Textarea
              id="message-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("check.messagePlaceholder")}
              rows={6}
              maxLength={2000}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sender">{t("check.senderLabel")}</Label>
              <Input
                id="sender"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder={t("check.senderPlaceholder")}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel">{t("check.channelLabel")}</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger id="channel">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="screenshot">{t("check.uploadLabel")}</Label>
            {image ? (
              <div className="relative inline-block">
                <img
                  src={image.preview}
                  alt={t("check.screenshotPreviewAlt")}
                  className="max-h-64 rounded-lg border border-border object-contain"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  className="absolute -right-2 -top-2 rounded-full"
                  onClick={removeImage}
                  aria-label={t("check.removeScreenshot")}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="screenshot"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-input p-6 text-center text-sm text-muted-foreground transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring hover:border-primary hover:text-foreground"
              >
                <ImageUp className="size-6" aria-hidden="true" />
                {t("check.uploadInstructions")}
                <input
                  ref={fileInputRef}
                  id="screenshot"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFile(file);
                  }}
                />
              </label>
            )}
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
            {loading ? t("check.submitting") : t("check.submit")}
          </Button>
        </form>

        {result ? (
          <div
            ref={resultRef}
            tabIndex={-1}
            aria-label="Check result"
            className="mt-10 space-y-5 outline-none"
            aria-live="polite"
          >
            {offline ? (
              <div className="flex items-start gap-2 rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>{t("check.offlineNotice")}</p>
              </div>
            ) : null}
            <Card
              className={cn(
                "border-2",
                result.verdict === "safe" && "border-safe",
                result.verdict === "suspicious" && "border-suspicious",
                result.verdict === "likely_scam" && "border-danger",
              )}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <Badge variant={verdictBadgeVariant(result.verdict)} className="mb-2">
                    <VerdictIcon verdict={result.verdict} className="size-3.5" />
                    {t(`verdict.${result.verdict}`)}
                  </Badge>
                  <CardTitle>{result.scamType}</CardTitle>
                  <CardDescription className="mt-1">{result.summary}</CardDescription>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-3xl font-bold tabular-nums">{result.riskScore}</p>
                  <p className="text-xs text-muted-foreground">{t("check.riskScoreLabel")}</p>
                </div>
              </CardHeader>
              <CardContent>
                <Progress
                  value={result.riskScore}
                  aria-label={`Risk score ${result.riskScore} out of 100`}
                />
              </CardContent>
            </Card>

            {sender.trim() && result.verdict !== "safe" ? (
              <SenderReportWidget sender={sender.trim()} />
            ) : null}

            {result.extractedText ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("check.extractedTextTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {result.extractedText}
                </CardContent>
              </Card>
            ) : null}

            {result.redFlags.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("check.redFlagsTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.redFlags.map((flag, i) => (
                    <div key={i} className="rounded-lg bg-muted p-3">
                      <p className="text-sm font-medium">&ldquo;{flag.quote}&rdquo;</p>
                      <p className="mt-1 text-sm text-muted-foreground">{flag.reason}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            {result.nextSteps.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("check.nextStepsTitle")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-inside list-disc space-y-1.5 text-sm">
                    {result.nextSteps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {result.familyWarning ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("check.shareFamilyTitle")}</CardTitle>
                  <CardDescription>A simple warning you can forward as-is.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>{result.familyWarning}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={copyWarning}>
                      {copied ? (
                        <Check className="size-4" aria-hidden="true" />
                      ) : (
                        <Copy className="size-4" aria-hidden="true" />
                      )}
                      {copied ? t("check.copied") : t("check.copy")}
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(result.familyWarning)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Share2 className="size-4" aria-hidden="true" />
                        {t("check.shareWhatsapp")}
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <div>
              <Button
                type="button"
                variant="outline"
                onClick={handleExplainBangla}
                disabled={banglaLoading}
              >
                {banglaLoading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Languages className="size-4" aria-hidden="true" />
                )}
                {t("check.explainBangla")}
              </Button>
              {bangla ? (
                <Card className="mt-3">
                  <CardContent lang="bn" className="pt-5 text-base leading-relaxed">
                    {bangla}
                  </CardContent>
                </Card>
              ) : null}
            </div>

            <CheckFollowUpChat result={result} messageText={text} offline={offline} />
          </div>
        ) : null}
      </section>
    </>
  );
}

function SenderReportWidget({ sender }: { sender: string }) {
  const { t, tf } = useLanguage();
  const count = useScamReportCount(sender);
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent">("idle");

  const handleReport = async () => {
    setStatus("sending");
    const ok = await reportScamSender(sender);
    setStatus(ok ? "sent" : "idle");
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/50 p-3 text-sm">
      {count != null && count > 0 ? (
        <Badge variant="outline" className="gap-1.5">
          <Flag className="size-3.5" aria-hidden="true" />
          {tf("check.reportedByCount", { count })}
        </Badge>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="ml-auto"
        onClick={() => void handleReport()}
        disabled={status !== "idle"}
      >
        <Flag className="size-4" aria-hidden="true" />
        {status === "sending"
          ? t("check.reportSending")
          : status === "sent"
            ? t("check.reportSent")
            : t("check.reportSender")}
      </Button>
    </div>
  );
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function CheckFollowUpChat({
  result,
  messageText,
  offline,
}: {
  result: AnalysisResult;
  messageText: string;
  offline: boolean;
}) {
  const { t } = useLanguage();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [question, setQuestion] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setMessages([]);
  }, [result]);

  const ask = async (text: string) => {
    const q = text.trim();
    if (q.length < 2 || loading) return;
    const history = messages;
    setMessages([...history, { role: "user", content: q }]);
    setQuestion("");
    setLoading(true);
    let answer: string;
    if (offline) {
      answer = checkFollowUpLocally(result);
    } else {
      try {
        answer = await askCheckFollowUp({
          data: { result, messageText: messageText || undefined, history, question: q },
        });
      } catch (err) {
        answer = isAiUnavailable(err)
          ? checkFollowUpLocally(result)
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
          {t("check.askFollowUp")}
        </CardTitle>
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
          </div>
        ) : null}

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(question);
          }}
        >
          <Label htmlFor="check-follow-up" className="sr-only">
            {t("help.questionSrLabel")}
          </Label>
          <Input
            id="check-follow-up"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t("check.followUpPlaceholder")}
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
