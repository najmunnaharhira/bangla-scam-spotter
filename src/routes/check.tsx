import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Check,
  Copy,
  ImageUp,
  Info,
  Languages,
  Loader2,
  Share2,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { useHistory } from "@/hooks/use-check-history";
import { analyzeMessage, explainBangla } from "@/lib/ai/scamshield.functions";
import { analyzeLocally, explainBanglaLocally, isAiUnavailable } from "@/lib/local-analyzer";
import { CHANNELS, EXAMPLE_CHIPS } from "@/lib/sample-data";
import { VERDICT_LABELS, type AnalysisResult, type CheckRecord, type Verdict } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/check")({
  component: CheckPage,
});

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function friendlyErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const withoutPrefix = message.replace(/^[A-Z_]+:\s*/, "");
  return withoutPrefix || "Something went wrong. Please try again.";
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
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("The screenshot is too large. Please upload an image under 5 MB.");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setBangla(null);
    setOffline(false);
    setCopied(false);
    const trimmed = text.trim();
    const save = (analysis: AnalysisResult) => {
      setResult(analysis);
      add({
        id: `${Date.now()}`,
        createdAt: Date.now(),
        inputType: image ? "image" : "text",
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
          imageBase64: image?.base64,
          imageMimeType: image?.file.type,
          sender: sender.trim() || undefined,
          channel,
        },
      });
      save(analysis);
    } catch (err) {
      if (trimmed && isAiUnavailable(err)) {
        // AI is down or out of credits: fall back to the built-in pattern check.
        setOffline(true);
        save(analyzeLocally(trimmed));
      } else {
        setError(friendlyErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Check a message</h1>
        <p className="mt-2 text-muted-foreground">
          Paste the text of a message or upload a screenshot. We'll tell you how risky it is and
          why.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLE_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => applyExample(chip.text)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              Try: {chip.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="message-text">Message text</Label>
            <Textarea
              id="message-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the message here..."
              rows={6}
              maxLength={2000}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sender">Sender (optional)</Label>
              <Input
                id="sender"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="e.g. bKash, 017XXXXXXXX"
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel">Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger id="channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="screenshot">Or upload a screenshot</Label>
            {image ? (
              <div className="relative inline-block">
                <img
                  src={image.preview}
                  alt="Uploaded screenshot preview"
                  className="max-h-64 rounded-lg border border-border object-contain"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  className="absolute -right-2 -top-2 rounded-full"
                  onClick={removeImage}
                  aria-label="Remove screenshot"
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
                Click to upload a screenshot (max 5 MB)
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
            {loading ? "Checking..." : "Check this message"}
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
                <p>
                  The AI service is busy right now, so this is a quick check using known scam
                  patterns. Try again in a minute for a full AI analysis.
                </p>
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
                    {VERDICT_LABELS[result.verdict]}
                  </Badge>
                  <CardTitle>{result.scamType}</CardTitle>
                  <CardDescription className="mt-1">{result.summary}</CardDescription>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-3xl font-bold tabular-nums">{result.riskScore}</p>
                  <p className="text-xs text-muted-foreground">risk score / 100</p>
                </div>
              </CardHeader>
              <CardContent>
                <Progress
                  value={result.riskScore}
                  aria-label={`Risk score ${result.riskScore} out of 100`}
                />
              </CardContent>
            </Card>

            {result.extractedText ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Text found in screenshot</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {result.extractedText}
                </CardContent>
              </Card>
            ) : null}

            {result.redFlags.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Red flags</CardTitle>
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
                  <CardTitle className="text-base">What to do next</CardTitle>
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
                  <CardTitle className="text-base">Share with family</CardTitle>
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
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(result.familyWarning)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Share2 className="size-4" aria-hidden="true" />
                        Share on WhatsApp
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
                Explain in Bangla
              </Button>
              {bangla ? (
                <Card className="mt-3">
                  <CardContent lang="bn" className="pt-5 text-base leading-relaxed">
                    {bangla}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
