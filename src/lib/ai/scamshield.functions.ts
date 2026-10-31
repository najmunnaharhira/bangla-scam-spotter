import { createServerFn } from "@tanstack/react-start";
import { NoObjectGeneratedError, streamObject, streamText } from "ai";
import { z } from "zod";
import type { AnalysisResult, PracticeItem, RecoveryPlan, Verdict } from "@/lib/types";

const GATEWAY_BASE_URL = "https://ai.gateway.lovable.dev/v1";
const ANALYZE_MODEL = "google/gemini-3.8-flash";

const SYSTEM_PROMPT = `You are a fraud-detection assistant for Bangladesh helping everyday people check whether a message is a scam. You know common local scams: fake mobile financial service (bKash, Nagad, Rocket) "wrong send" and cashback messages, OTP and PIN requests, fake job and visa offers with fees, lottery or prize wins, fake parcel/customs fees, romance and investment scams, fake government or bank notices, phishing links, and impersonation of relatives or officials.

Be careful and fair: genuine messages (real delivery updates, real notifications with no money or credential request) MUST be marked safe. Never invent red flags that are not in the message. Every red flag quote must be copied exactly from the message text or clearly describe what in the screenshot triggered it. Use plain, simple English a school student can understand. If an image is provided, first read the text in the screenshot and put it in extractedText.

Verdicts: "safe" (no scam signs), "suspicious" (some warning signs but not certain), "likely_scam" (clear scam signs). Never claim certainty beyond "likely"; this is a risk estimate, not legal or financial advice.`;

const BANGLA_SYSTEM_PROMPT = `You are a helpful assistant that explains scam-check results in simple, warm Bangla for family members such as parents and grandparents. Use short sentences, everyday words, and no technical jargon. Write 4-8 sentences: say how risky the message is, what the scammer tries to do, and one clear piece of advice. Do not use English words where a simple Bangla word exists, but keep brand names like bKash and Nagad in English.`;

const PRACTICE_SYSTEM_PROMPT = `You generate a short practice game ("Scam Spotter") that teaches people in Bangladesh to recognise scam messages. Return exactly 5 short fictional messages (1-3 sentences each), clearly fictional, in a Bangladesh context, mixing scam messages and genuine messages (at least 2 must be genuine). Use realistic wording like a bKash "wrong send" SMS, a fake job offer, a lottery win, but also genuine ones like a delivery update or a real bank notice with no money request. Do not use real brand phone numbers, real links, or real people's names. For each item give: the message, whether it is a scam (isScam), a one-sentence explanation of why it is or is not a scam, and redFlags: an array of the specific scam signs (empty array for genuine messages).`;

const RECOVERY_SYSTEM_PROMPT = `You are a calm, practical assistant helping someone in Bangladesh who believes they have just been the victim of a scam. They will describe what happened in their own words (in English or Bangla). Do not judge them or make them feel foolish — be warm and reassuring first.

Based on what they describe, identify the likely scam type (e.g. "Fake bKash/Nagad wrong-send", "OTP/PIN theft", "Fake job offer", "Investment/romance scam", "Phishing link", "Impersonation of police/official", "Other") and produce an ordered, concrete recovery plan specific to what they described — not a generic checklist. Real, correct Bangladesh facts only: bKash helpline is 16247, Nagad helpline is 16167, Rocket/DBBL helpline is 16216, national emergency and cyber crime reporting is 999, and the Bangladesh Police Cyber Support for Women/CID Cyber Police can be reached via the national helpline 999 or the nearest police station. If money was sent via bank transfer, tell them to call their bank's hotline immediately. If credentials/OTP were shared, prioritise securing the account (change PIN/password, call the provider to freeze/lock the account) above all else. If they are still being contacted/threatened by the scammer, tell them to stop responding, block the number, and not send any further payment no matter what is threatened. Mark the most time-critical actions (anything that stops ongoing financial loss or secures an account right now) as urgent: true; everything else (reporting, evidence-keeping, prevention) as urgent: false. Give 4-7 steps. Keep each step title short (under 8 words) and the detail 1-2 plain sentences. End with a short, warm one-sentence reassurance that this is not their fault and help is available.`;

const analysisSchema = z.object({
  riskScore: z.number(),
  verdict: z.string(),
  scamType: z.string(),
  summary: z.string(),
  redFlags: z.array(z.object({ quote: z.string(), reason: z.string() })),
  nextSteps: z.array(z.string()),
  familyWarning: z.string(),
  extractedText: z.string(),
});

const practiceSchema = z.object({
  items: z.array(
    z.object({
      message: z.string(),
      isScam: z.boolean(),
      explanation: z.string(),
      redFlags: z.array(z.string()),
    }),
  ),
});

const analyzeInputSchema = z.object({
  text: z.string().max(2000).optional(),
  imageBase64: z.string().optional(),
  imageMimeType: z.string().optional(),
  sender: z.string().max(120).optional(),
  channel: z.string().max(40).optional(),
});

const banglaInputSchema = z.object({
  result: z.custom<AnalysisResult>((value) => value != null && typeof value === "object"),
});

const practiceInputSchema = z.object({});

const recoveryPlanSchema = z.object({
  scamType: z.string(),
  summary: z.string(),
  steps: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      urgent: z.boolean(),
    }),
  ),
  helplines: z.array(z.string()),
  reassurance: z.string(),
});

const recoveryInputSchema = z.object({
  description: z.string().trim().min(1).max(2000),
});

function throwFriendlyGatewayError(error: unknown): never {
  const status =
    typeof error === "object" && error != null && "statusCode" in error
      ? (error as { statusCode?: number }).statusCode
      : undefined;
  if (status === 429) {
    throw new Error("RATE_LIMITED: Too many checks right now — please try again in a minute.");
  }
  if (status === 402) {
    throw new Error(
      "NO_CREDITS: The AI service has run out of credits right now. Please try again later.",
    );
  }
  if (status === 400) {
    throw new Error(
      "BAD_INPUT: The message could not be analysed. Try a shorter text or a smaller, clearer screenshot.",
    );
  }
  if (status === 401 || status === 403) {
    throw new Error(
      "UNAVAILABLE: The AI service is not available right now. Please try again later.",
    );
  }
  throw new Error(
    "UNAVAILABLE: The AI service is not responding right now. Please try again in a moment.",
  );
}

function normalizeVerdict(value: string, riskScore: number): Verdict {
  if (value === "safe" || value === "suspicious" || value === "likely_scam") return value;
  if (riskScore >= 70) return "likely_scam";
  if (riskScore >= 35) return "suspicious";
  return "safe";
}

export const analyzeMessage = createServerFn({ method: "POST" })
  .inputValidator(analyzeInputSchema.parse)
  .handler(async ({ data }): Promise<AnalysisResult> => {
    const hasText = typeof data.text === "string" && data.text.trim().length > 0;
    if (!hasText && !data.imageBase64) {
      throw new Error("EMPTY_INPUT: Paste a message or upload a screenshot first.");
    }
    if (data.imageBase64 && (data.imageBase64.length * 3) / 4 > 5 * 1024 * 1024) {
      throw new Error("TOO_BIG: The screenshot is too large. Please upload an image under 5 MB.");
    }

    const { createLovableAiGatewayProvider } = await import("./gateway.server");
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      throw new Error("UNAVAILABLE: The AI service is not configured yet. Please try again later.");
    }
    const provider = createLovableAiGatewayProvider(apiKey, undefined, {
      baseURL: GATEWAY_BASE_URL,
      structuredOutputs: true,
    });

    const contextLines = [
      `Channel: ${data.channel || "Unknown"}.`,
      `Sender: ${data.sender?.trim() ? data.sender.trim() : "Unknown sender"}.`,
      hasText ? `Message to analyse:\n"""${data.text}"""` : "",
      data.imageBase64
        ? "Also analyse the attached screenshot of the message; read the text in it first."
        : "",
    ].filter(Boolean);

    const messages = [
      {
        role: "user" as const,
        content: [
          ...(data.imageBase64
            ? [
                {
                  type: "image" as const,
                  image: `data:${data.imageMimeType || "image/png"};base64,${data.imageBase64}`,
                },
              ]
            : []),
          { type: "text" as const, text: contextLines.join("\n") },
        ],
      },
    ];

    let raw: unknown;
    try {
      const result = streamObject({
        model: provider(ANALYZE_MODEL),
        schema: analysisSchema,
        system: SYSTEM_PROMPT,
        messages,
      });
      raw = await result.object;
    } catch (error) {
      if (
        NoObjectGeneratedError.isInstance(error) &&
        typeof error.text === "string" &&
        error.text.trim()
      ) {
        try {
          raw = JSON.parse(error.text);
        } catch {
          throwFriendlyGatewayError(error);
        }
      } else {
        throwFriendlyGatewayError(error);
      }
    }

    const parsed = analysisSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error("UNAVAILABLE: The analysis came back incomplete. Please try again.");
    }

    const value = parsed.data;
    const riskScore = Math.max(0, Math.min(100, Math.round(value.riskScore)));
    return {
      riskScore,
      verdict: normalizeVerdict(value.verdict, riskScore),
      scamType: value.scamType?.trim() || "General",
      summary: value.summary?.trim() || "No summary was generated.",
      redFlags: Array.isArray(value.redFlags) ? value.redFlags.slice(0, 10) : [],
      nextSteps: Array.isArray(value.nextSteps) ? value.nextSteps.slice(0, 6) : [],
      familyWarning: value.familyWarning?.trim() || "",
      extractedText: value.extractedText?.trim() || "",
    };
  });

export const explainBangla = createServerFn({ method: "POST" })
  .inputValidator(banglaInputSchema.parse)
  .handler(async ({ data }): Promise<string> => {
    const { createLovableAiGatewayProvider } = await import("./gateway.server");
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      throw new Error("UNAVAILABLE: The AI service is not configured yet. Please try again later.");
    }
    const provider = createLovableAiGatewayProvider(apiKey, undefined, {
      baseURL: GATEWAY_BASE_URL,
    });

    const prompt = `Explain this scam-check result in simple Bangla:\n${JSON.stringify(data.result)}`;

    try {
      const result = streamText({
        model: provider(ANALYZE_MODEL),
        system: BANGLA_SYSTEM_PROMPT,
        messages: [{ role: "user" as const, content: prompt }],
      });
      return await result.text;
    } catch (error) {
      throwFriendlyGatewayError(error);
    }
  });

export const generatePractice = createServerFn({ method: "POST" })
  .inputValidator(practiceInputSchema.parse)
  .handler(async (): Promise<PracticeItem[]> => {
    const { createLovableAiGatewayProvider } = await import("./gateway.server");
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      throw new Error("UNAVAILABLE: The AI service is not configured yet. Please try again later.");
    }
    const provider = createLovableAiGatewayProvider(apiKey, undefined, {
      baseURL: GATEWAY_BASE_URL,
      structuredOutputs: true,
    });

    let raw: unknown;
    try {
      const result = streamObject({
        model: provider(ANALYZE_MODEL),
        schema: practiceSchema,
        system: PRACTICE_SYSTEM_PROMPT,
        messages: [
          { role: "user" as const, content: "Generate a new round of 5 practice messages." },
        ],
      });
      raw = await result.object;
    } catch (error) {
      if (
        NoObjectGeneratedError.isInstance(error) &&
        typeof error.text === "string" &&
        error.text.trim()
      ) {
        try {
          raw = JSON.parse(error.text);
        } catch {
          throwFriendlyGatewayError(error);
        }
      } else {
        throwFriendlyGatewayError(error);
      }
    }

    const parsed = practiceSchema.safeParse(raw);
    if (!parsed.success || parsed.data.items.length < 3) {
      throw new Error("UNAVAILABLE: The practice round could not be generated. Please try again.");
    }
    return parsed.data.items.slice(0, 5);
  });

export const generateRecoveryPlan = createServerFn({ method: "POST" })
  .inputValidator(recoveryInputSchema.parse)
  .handler(async ({ data }): Promise<RecoveryPlan> => {
    const { createLovableAiGatewayProvider } = await import("./gateway.server");
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      throw new Error("UNAVAILABLE: The AI service is not configured yet. Please try again later.");
    }
    const provider = createLovableAiGatewayProvider(apiKey, undefined, {
      baseURL: GATEWAY_BASE_URL,
      structuredOutputs: true,
    });

    let raw: unknown;
    try {
      const result = streamObject({
        model: provider(ANALYZE_MODEL),
        schema: recoveryPlanSchema,
        system: RECOVERY_SYSTEM_PROMPT,
        messages: [
          {
            role: "user" as const,
            content: `Here is what happened, in the person's own words:\n"""${data.description}"""`,
          },
        ],
      });
      raw = await result.object;
    } catch (error) {
      if (
        NoObjectGeneratedError.isInstance(error) &&
        typeof error.text === "string" &&
        error.text.trim()
      ) {
        try {
          raw = JSON.parse(error.text);
        } catch {
          throwFriendlyGatewayError(error);
        }
      } else {
        throwFriendlyGatewayError(error);
      }
    }

    const parsed = recoveryPlanSchema.safeParse(raw);
    if (!parsed.success || parsed.data.steps.length === 0) {
      throw new Error("UNAVAILABLE: The recovery plan could not be generated. Please try again.");
    }

    const value = parsed.data;
    return {
      scamType: value.scamType?.trim() || "General scam",
      summary: value.summary?.trim() || "",
      steps: value.steps.slice(0, 7).map((step) => ({
        title: step.title?.trim() || "Next step",
        detail: step.detail?.trim() || "",
        urgent: Boolean(step.urgent),
      })),
      helplines: Array.isArray(value.helplines) ? value.helplines.slice(0, 6) : [],
      reassurance:
        value.reassurance?.trim() ||
        "This is not your fault — help is available and you can act on this now.",
    };
  });
