import { createAnthropic } from "@ai-sdk/anthropic";

const LOVABLE_GATEWAY_BASE_URL = "https://ai.gateway.lovable.dev/v1";
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";
const LOVABLE_ANALYSIS_MODEL = "google/gemini-3.8-flash";
const LOVABLE_RECOVERY_MODEL = "openai/gpt-6-astra";

export type ScamShieldModelKind = "analysis" | "recovery";

/**
 * Prefer a direct Anthropic connection when ANTHROPIC_API_KEY is configured.
 * Keep Lovable's gateway as a deployment-compatible fallback.
 */
export async function getScamShieldModel(kind: ScamShieldModelKind) {
  const anthropicApiKey = process.env["ANTHROPIC_API_KEY"]?.trim();
  if (anthropicApiKey) {
    const anthropic = createAnthropic({ apiKey: anthropicApiKey });
    const model = process.env["ANTHROPIC_MODEL"]?.trim() || DEFAULT_ANTHROPIC_MODEL;
    return anthropic(model);
  }

  const lovableApiKey = process.env["LOVABLE_API_KEY"]?.trim();
  if (lovableApiKey) {
    const { createLovableAiGatewayProvider } = await import("./gateway.server");
    const lovable = createLovableAiGatewayProvider(lovableApiKey, undefined, {
      baseURL: LOVABLE_GATEWAY_BASE_URL,
      structuredOutputs: true,
    });
    return lovable(kind === "recovery" ? LOVABLE_RECOVERY_MODEL : LOVABLE_ANALYSIS_MODEL);
  }

  throw new Error("UNAVAILABLE: The AI service is not configured yet. Please try again later.");
}
