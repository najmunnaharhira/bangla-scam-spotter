import { createServerFn } from "@tanstack/react-start";
import { NoObjectGeneratedError, streamObject, streamText } from "ai";
import { z } from "zod";
import type { AnalysisResult, PracticeItem, RecoveryPlan, Verdict } from "@/lib/types";

const GATEWAY_BASE_URL = "https://ai.gateway.lovable.dev/v1";
const ANALYZE_MODEL = "google/gemini-3.8-flash";
const RECOVERY_MODEL = "openai/gpt-6-astra";

const SYSTEM_PROMPT = `You are a fraud-detection assistant for Bangladesh helping everyday people check whether a message is a scam. You know common local scams: fake mobile financial service (bKash, Nagad, Rocket) "wrong send" and cashback messages, OTP and PIN requests, fake job and visa offers with fees, lottery or prize wins, fake parcel/customs fees, romance and investment scams, fake government or bank notices, phishing links, and impersonation of relatives or officials.

Be careful and fair: genuine messages (real delivery updates, real notifications with no money or credential request) MUST be marked safe. Never invent red flags that are not in the message. Every red flag quote must be copied exactly from the message text or clearly describe what in the screenshot triggered it. Use plain, simple English a school student can understand. If an image is provided, first read the text in the screenshot and put it in extractedText.

Verdicts: "safe" (no scam signs), "suspicious" (some warning signs but not certain), "likely_scam" (clear scam signs). Never claim certainty beyond "likely"; this is a risk estimate, not legal or financial advice.`;

const BANGLA_SYSTEM_PROMPT = `You are a helpful assistant that explains scam-check results in simple, warm Bangla for family members such as parents and grandparents. Use short sentences, everyday words, and no technical jargon. Write 4-8 sentences: say how risky the message is, what the scammer tries to do, and one clear piece of advice. Do not use English words where a simple Bangla word exists, but keep brand names like bKash and Nagad in English.`;

const PRACTICE_SYSTEM_PROMPT = `You generate a short practice game ("Scam Spotter") that teaches people in Bangladesh to recognise scam messages. Return exactly 5 short fictional messages (1-3 sentences each), clearly fictional, in a Bangladesh context, mixing scam messages and genuine messages (at least 2 must be genuine). Use realistic wording like a bKash "wrong send" SMS, a fake job offer, a lottery win, but also genuine ones like a delivery update or a real bank notice with no money request. Do not use real brand phone numbers, real links, or real people's names. For each item give: the message, whether it is a scam (isScam), a one-sentence explanation of why it is or is not a scam, and redFlags: an array of the specific scam signs (empty array for genuine messages).`;

const RECOVERY_SYSTEM_PROMPT = `You are a scam-recovery advisor for Bangladesh. A person describes what happened after they suspected or fell for a scam (fake bKash/Nagad/Rocket "wrong send" transfers, OTP or PIN theft, fake job fees, lottery or prize wins, phishing links, impersonation of officials or relatives). You give calm, practical, tailored next steps.

Rules:
- Base every step on what the person actually described. Do not invent facts they did not give.
- If they sent money: the first steps are to call the mobile financial service helpline immediately (bKash 16247, Nagad 16167, Rocket 16207) or their bank, ask to freeze or reverse the transaction, then report to the police (999) or the cyber crime desk with screenshots.
- If they shared a PIN or OTP: change the PIN right away from a safe device, turn on transaction alerts, and check the transaction history.
- If nothing was sent or shared: reassure them, block the number, keep evidence, and warn them not to send anything later.
- If the description sounds like a genuine message (a real delivery update, a real bank notice with no money request), say so calmly and give only light advice.
- Always warn about follow-up scams: scammers often call back pretending to be police or "recovery agents" who ask for money again.
- Never promise that money can be recovered; say it may be possible if reported quickly.
- Give 4 to 6 steps, ordered most urgent first, with priority 1 = do immediately, 2 = same day, 3 = when convenient.
- Use simple English a school student can understand. Keep brand names like bKash and Nagad in English.
- This is general guidance, not legal or financial advice.`;

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

const recoverySchema = z.object({
  urgency: z.enum(["immediate", "today", "this_week"]),
  whatLikelyHappened: z.string(),
  scamType: z.string(),
  steps: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      priority: z.number(),
    }),
  ),
  watchOut: z.array(z.string()),
  reportTo: z.array(z.string()),
  familyAdvice: z.string(),
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

const recoveryInputSchema = z.object({
  whatHappened: z.string().min(10).max(2000),
  channel: z.string().max(40).optional(),
  moneySent: z.enum(["yes", "pin_otp", "no", "not_sure"]),
  whenHappened: z.enum(["last_24h", "within_week", "older", "ongoing"]),
  provider: z.string().max(60).optional(),
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

export const generateRecoverySteps = createServerFn({ method: "POST" })
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

    const moneySentLabels: Record<typeof data.moneySent, string> = {
      yes: "Yes, they sent money",
      pin_otp: "They shared a PIN or OTP",
      no: "No, they did not send money or share a PIN/OTP",
      not_sure: "They are not sure whether money was sent",
    };
    const whenLabels: Record<typeof data.whenHappened, string> = {
      last_24h: "Within the last 24 hours",
      within_week: "Within the last week",
      older: "More than a week ago",
      ongoing: "It is still happening",
    };

    const prompt = [
      `What the person described:\n"""${data.whatHappened}"""`,
      `How they were contacted: ${data.channel?.trim() || "Unknown"}.`,
      `Money sent or PIN/OTP shared: ${moneySentLabels[data.moneySent]}.`,
      `When it happened: ${whenLabels[data.whenHappened]}.`,
      data.provider?.trim() ? `Service or provider involved: ${data.provider.trim()}.` : "",
      "Give tailored next steps for this exact situation.",
    ]
      .filter(Boolean)
      .join("\n");

    let raw: unknown;
    try {
      const result = streamObject({
        model: provider(RECOVERY_MODEL),
        schema: recoverySchema,
        system: RECOVERY_SYSTEM_PROMPT,
        messages: [{ role: "user" as const, content: prompt }],
        providerOptions: { lovable: { reasoningEffort: "medium" } },
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

    const parsed = recoverySchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error("UNAVAILABLE: The steps could not be generated. Please try again.");
    }

    const value = parsed.data;
    const steps = (Array.isArray(value.steps) ? value.steps : [])
      .map((step) => ({
        title: step.title?.trim() || "Next step",
        detail: step.detail?.trim() || "",
        priority: Math.min(3, Math.max(1, Math.round(step.priority || 2))) as 1 | 2 | 3,
      }))
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 8);

    return {
      urgency: value.urgency,
      whatLikelyHappened: value.whatLikelyHappened?.trim() || "",
      scamType: value.scamType?.trim() || "General",
      steps:
        steps.length > 0
          ? steps
          : [
              {
                title: "Talk to a family member",
                detail: "Describe what happened and decide together.",
                priority: 1,
              },
            ],
      watchOut: Array.isArray(value.watchOut) ? value.watchOut.slice(0, 5) : [],
      reportTo: Array.isArray(value.reportTo) ? value.reportTo.slice(0, 5) : [],
      familyAdvice: value.familyAdvice?.trim() || "",
    };
  });

const FOLLOW_UP_SYSTEM_PROMPT = `You are the same scam-recovery advisor for Bangladesh. The person already received an action plan for their situation and now asks a follow-up question. Answer ONLY using what they reported and the plan below, plus well-known, correct Bangladesh facts (bKash 16247, Nagad 16167, Rocket 16207, police and cyber crime 999).

Rules:
- Stay grounded: if the answer depends on something they did not report, say what you would need to know instead of guessing.
- Never ask for or accept a PIN, OTP, password or full account number. If they offer one, tell them not to share it with anyone, including you.
- Never promise money will be recovered.
- If the question is unrelated to their scam or staying safe, politely steer back.
- Reply in the same language as the question (English or Bangla). Keep it short: 2 to 5 plain sentences or a short list.
- This is general guidance, not legal or financial advice.`;

const followUpInputSchema = z.object({
  incident: recoveryInputSchema,
  plan: z.custom<RecoveryPlan>((value) => value != null && typeof value === "object"),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .max(12)
    .default([]),
  question: z.string().trim().min(2).max(500),
});

export const askRecoveryFollowUp = createServerFn({ method: "POST" })
  .inputValidator(followUpInputSchema.parse)
  .handler(async ({ data }): Promise<string> => {
    const { createLovableAiGatewayProvider } = await import("./gateway.server");
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      throw new Error("UNAVAILABLE: The AI service is not configured yet. Please try again later.");
    }
    const provider = createLovableAiGatewayProvider(apiKey, undefined, {
      baseURL: GATEWAY_BASE_URL,
    });

    const context = [
      "What the person reported:",
      `"""${data.incident.whatHappened}"""`,
      `Channel: ${data.incident.channel?.trim() || "Unknown"}. Money sent or PIN/OTP shared: ${data.incident.moneySent}. When: ${data.incident.whenHappened}. Provider: ${data.incident.provider?.trim() || "Unknown"}.`,
      "",
      "Their action plan:",
      JSON.stringify(data.plan),
    ].join("\n");

    try {
      const result = streamText({
        model: provider(RECOVERY_MODEL),
        system: `${FOLLOW_UP_SYSTEM_PROMPT}\n\n${context}`,
        messages: [...data.history.slice(-10), { role: "user" as const, content: data.question }],
      });
      const text = (await result.text).trim();
      if (!text) throw new Error("UNAVAILABLE: No answer came back. Please try again.");
      return text;
    } catch (error) {
      if (error instanceof Error && /^[A-Z_]+:/.test(error.message)) throw error;
      throwFriendlyGatewayError(error);
    }
  });

const CHECK_FOLLOW_UP_SYSTEM_PROMPT = `You are the same fraud-detection assistant for Bangladesh. The person already got a scam-check result for a message and now asks a follow-up question about it. Answer ONLY using the original message and the result below, plus well-known, correct Bangladesh facts (bKash 16247, Nagad 16167, Rocket 16207, police and cyber crime 999).

Rules:
- Stay grounded: if the answer depends on something not in the message or result, say what you would need to know instead of guessing.
- Never ask for or accept a PIN, OTP, password or full account number. If they offer one, tell them not to share it with anyone, including you.
- Never promise money will be recovered.
- If the question is unrelated to this check or staying safe, politely steer back.
- Reply in the same language as the question (English or Bangla). Keep it short: 2 to 5 plain sentences or a short list.
- This is general guidance, not legal or financial advice.`;

const checkFollowUpInputSchema = z.object({
  messageText: z.string().max(2000).optional(),
  result: z.custom<AnalysisResult>((value) => value != null && typeof value === "object"),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .max(12)
    .default([]),
  question: z.string().trim().min(2).max(500),
});

export const askCheckFollowUp = createServerFn({ method: "POST" })
  .inputValidator(checkFollowUpInputSchema.parse)
  .handler(async ({ data }): Promise<string> => {
    const { createLovableAiGatewayProvider } = await import("./gateway.server");
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      throw new Error("UNAVAILABLE: The AI service is not configured yet. Please try again later.");
    }
    const provider = createLovableAiGatewayProvider(apiKey, undefined, {
      baseURL: GATEWAY_BASE_URL,
    });

    const context = [
      data.messageText?.trim() ? `The original message:\n"""${data.messageText.trim()}"""` : "",
      "The check result:",
      JSON.stringify(data.result),
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const result = streamText({
        model: provider(ANALYZE_MODEL),
        system: `${CHECK_FOLLOW_UP_SYSTEM_PROMPT}\n\n${context}`,
        messages: [...data.history.slice(-10), { role: "user" as const, content: data.question }],
      });
      const text = (await result.text).trim();
      if (!text) throw new Error("UNAVAILABLE: No answer came back. Please try again.");
      return text;
    } catch (error) {
      if (error instanceof Error && /^[A-Z_]+:/.test(error.message)) throw error;
      throwFriendlyGatewayError(error);
    }
  });

const AGENT_SYSTEM_PROMPT = `You are "ScamShield", a calm scam-safety assistant for Bangladesh, answering questions directly in the app (not about one specific check result).

Rules:
- Never ask for or accept a PIN, OTP, password or full account number. If someone offers one, tell them not to share it with anyone, including you.
- Use only correct, real Bangladesh helplines: bKash 16247, Nagad 16167, Rocket 16207, and police/cyber crime 999.
- Never promise that money can be recovered; say it may be possible if reported quickly.
- When it fits, point people to the right tool in this app: the Check page (/check) to check a specific message or screenshot, or the recovery assistant (/help#recover) if they already sent money, shared a code, or replied to a scam.
- Reply in the same language as the question (English or Bangla). Keep answers short and practical: 2-5 plain sentences, or a short list.
- This is general safety guidance, not legal or financial advice.`;

const agentChatInputSchema = z.object({
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .max(20)
    .default([]),
  question: z.string().trim().min(1).max(500),
});

export const askScamAgent = createServerFn({ method: "POST" })
  .inputValidator(agentChatInputSchema.parse)
  .handler(async ({ data }): Promise<string> => {
    const { createLovableAiGatewayProvider } = await import("./gateway.server");
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      throw new Error("UNAVAILABLE: The AI service is not configured yet. Please try again later.");
    }
    const provider = createLovableAiGatewayProvider(apiKey, undefined, {
      baseURL: GATEWAY_BASE_URL,
    });

    try {
      const result = streamText({
        model: provider(ANALYZE_MODEL),
        system: AGENT_SYSTEM_PROMPT,
        messages: [...data.history.slice(-16), { role: "user" as const, content: data.question }],
      });
      const text = (await result.text).trim();
      if (!text) throw new Error("UNAVAILABLE: No answer came back. Please try again.");
      return text;
    } catch (error) {
      if (error instanceof Error && /^[A-Z_]+:/.test(error.message)) throw error;
      throwFriendlyGatewayError(error);
    }
  });
