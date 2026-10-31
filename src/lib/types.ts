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

export const VERDICT_LABELS: Record<Verdict, string> = {
  safe: "Safe",
  suspicious: "Suspicious",
  likely_scam: "Likely scam",
};

export interface RecoveryStep {
  title: string;
  detail: string;
  urgent: boolean;
}

export interface RecoveryPlan {
  scamType: string;
  summary: string;
  steps: RecoveryStep[];
  helplines: string[];
  reassurance: string;
}
