import * as React from "react";

/** Minimal surface of the Web Speech API this hook needs — not in lib.dom yet. */
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** Speak-to-text for a single field, backed by the browser's built-in Web
 * Speech API. Degrades to `supported: false` wherever it isn't available
 * (e.g. Firefox) — callers should hide the mic button in that case. */
export function useSpeechRecognition(lang: "en" | "bn") {
  const [listening, setListening] = React.useState(false);
  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);
  const supported = React.useMemo(() => !!getSpeechRecognitionCtor(), []);

  const start = React.useCallback(
    (onResult: (text: string, isFinal: boolean) => void) => {
      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor) return;
      const recognition = new Ctor();
      recognition.lang = lang === "bn" ? "bn-BD" : "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        let finalText = "";
        let interimText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result) continue;
          const transcript = result[0]?.transcript ?? "";
          if (result.isFinal) finalText += transcript;
          else interimText += transcript;
        }
        if (finalText) onResult(finalText, true);
        else if (interimText) onResult(interimText, false);
      };
      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
    },
    [lang],
  );

  const stop = React.useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  React.useEffect(() => () => recognitionRef.current?.stop(), []);

  return { supported, listening, start, stop };
}
