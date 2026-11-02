import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { generatePractice } from "@/lib/ai/scamshield.functions";
import { FALLBACK_PRACTICE, isAiUnavailable } from "@/lib/local-analyzer";

const practiceItemSchema = z.object({
  message: z.string(),
  isScam: z.boolean(),
  explanation: z.string(),
  redFlags: z.array(z.string()),
});

export default defineTool({
  name: "get_practice_round",
  title: "Get a scam-spotting practice round",
  description:
    "Generates a round of 5 short practice messages (a mix of real Bangladeshi scam patterns and genuine messages) for ScamShield BD's 'Scam Spotter' quiz, used to train scam awareness. Returns structured items the Practice page renders directly.",
  inputSchema: {},
  outputSchema: {
    items: z.array(practiceItemSchema),
    offline: z.boolean(),
  },
  handler: async () => {
    const describe = (items: typeof FALLBACK_PRACTICE) =>
      items
        .map(
          (item, i) =>
            `${i + 1}. ${item.message}\n   Answer: ${item.isScam ? "Scam" : "Genuine"} — ${item.explanation}`,
        )
        .join("\n\n");
    const toPlain = (items: typeof FALLBACK_PRACTICE) =>
      items.map((item) => ({
        message: item.message,
        isScam: item.isScam,
        explanation: item.explanation,
        redFlags: [...item.redFlags],
      }));
    try {
      const items = await generatePractice({ data: {} });
      return {
        content: [{ type: "text" as const, text: describe(items) }],
        structuredContent: { items: toPlain(items), offline: false },
      };
    } catch (err) {
      if (isAiUnavailable(err)) {
        return {
          content: [{ type: "text" as const, text: `[offline round]\n\n${describe(FALLBACK_PRACTICE)}` }],
          structuredContent: { items: toPlain(FALLBACK_PRACTICE), offline: true },
        };
      }
      throw new ToolError(err instanceof Error ? err.message : "Could not generate a practice round.");
    }
  },
});
