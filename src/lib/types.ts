export type Verdict = "safe" | "suspicious" | "likely_scam";

export interface RedFlag {
  quote: string;
  reason: string;
}

export interface AnalysisResult {
  riskScore: number;
  verdict: Verdict;
  scamType: string;
  summary: string;
  redFlags: RedFlag[];
  nextSteps: string[];
  familyWarning: string;
  extractedText: string;
}

export interface CheckRecord {
  id: string;
  createdAt: number;
  inputType: "text" | "image";
  preview: string;
  result: AnalysisResult;
}

export interface PracticeItem {
  message: string;
  isScam: boolean;
  explanation: string;
  redFlags: string[];
}

/* ---------- Scam recovery assistant ("tell us what happened") ---------- */

export type RecoveryUrgency = "immediate" | "today" | "this_week";

export type MoneySent = "yes" | "pin_otp" | "no" | "not_sure";

export type WhenHappened = "last_24h" | "within_week" | "older" | "ongoing";

export interface RecoveryStep {
  title: string;
  detail: string;
  /** 1 = do immediately, 2 = same day, 3 = when convenient. */
  priority: 1 | 2 | 3;
}

export interface RecoveryPlan {
  urgency: RecoveryUrgency;
  whatLikelyHappened: string;
  scamType: string;
  steps: RecoveryStep[];
  watchOut: string[];
  reportTo: string[];
  familyAdvice: string;
}

export const URGENCY_LABELS: Record<RecoveryUrgency, string> = {
  immediate: "Act right now",
  today: "Do this today",
  this_week: "Take care of this soon",
};

export const PRIORITY_LABELS: Record<1 | 2 | 3, string> = {
  1: "Do this now",
  2: "Today",
  3: "When you can",
};

export const MONEY_SENT_LABELS: Record<MoneySent, string> = {
  yes: "Yes, I sent money",
  pin_otp: "I shared my PIN or OTP",
  no: "No, I did not send anything",
  not_sure: "I am not sure",
};

export const WHEN_LABELS: Record<WhenHappened, string> = {
  last_24h: "Within the last 24 hours",
  within_week: "Within the last week",
  older: "More than a week ago",
  ongoing: "It is still happening",
};

export const VERDICT_LABELS: Record<Verdict, string> = {
  safe: "Safe",
  suspicious: "Suspicious",
  likely_scam: "Likely scam",
};
