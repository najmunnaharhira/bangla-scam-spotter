import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, MessageCircle, Send, X } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { askScamAgent } from "@/lib/ai/scamshield.functions";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** True for the two gateway error codes the agent should answer with a soft
 * "I'm busy" message (plus links) instead of a bare error. */
function isBusyError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /^(NO_CREDITS|RATE_LIMITED):/.test(message);
}

function friendlyErrorMessage(error: unknown, genericError: string): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/^[A-Z_]+:\s*/, "") || genericError;
}

export function TalkToScamShield() {
  const { t } = useLanguage();
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [question, setQuestion] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages]);

  const ask = async (text: string) => {
    const q = text.trim();
    if (q.length < 1 || loading) return;
    const history = messages;
    setMessages([...history, { role: "user", content: q }]);
    setQuestion("");
    setBusy(false);
    setLoading(true);
    try {
      const answer = await askScamAgent({ data: { history, question: q } });
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (err) {
      if (isBusyError(err)) {
        setBusy(true);
        setMessages((prev) => [...prev, { role: "assistant", content: t("agent.busyMessage") }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: friendlyErrorMessage(err, t("common.genericError")) },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3">
      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={t("agent.title")}
          className="flex h-[28rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <MessageCircle className="size-4" aria-hidden="true" />
              {t("agent.title")}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              onClick={() => setOpen(false)}
              aria-label={t("agent.close")}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3" role="log" aria-live="polite">
            {messages.length === 0 ? (
              <p className="p-2 text-sm text-muted-foreground">{t("agent.greeting")}</p>
            ) : null}
            {messages.map((message, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] whitespace-pre-line rounded-lg px-3 py-2 text-sm",
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {message.content}
              </div>
            ))}
            {busy ? (
              <div className="flex flex-wrap gap-2 px-1">
                <Button asChild size="sm" variant="outline">
                  <Link to="/check" onClick={() => setOpen(false)}>
                    {t("nav.checkFull")}
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/help" hash="recover" onClick={() => setOpen(false)}>
                    {t("home.getNextSteps")}
                  </Link>
                </Button>
              </div>
            ) : null}
            {loading ? (
              <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t("help.thinking")}
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <form
            className="flex gap-2 border-t border-border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void ask(question);
            }}
          >
            <Label htmlFor="agent-question" className="sr-only">
              {t("agent.placeholder")}
            </Label>
            <Input
              id="agent-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t("agent.placeholder")}
              maxLength={500}
              disabled={loading}
              autoFocus
            />
            <Button type="submit" size="icon" disabled={loading || question.trim().length < 1}>
              <Send className="size-4" aria-hidden="true" />
              <span className="sr-only">{t("help.ask")}</span>
            </Button>
          </form>
        </div>
      ) : null}

      <Button
        type="button"
        size="lg"
        className="h-14 w-14 rounded-full p-0 shadow-lg"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? t("agent.close") : t("agent.openLabel")}
      >
        {open ? <X className="size-5" aria-hidden="true" /> : <MessageCircle className="size-5" aria-hidden="true" />}
      </Button>
    </div>
  );
}
