import { defineTool, ToolError } from "@lovable.dev/mcp-js";

import { generatePractice } from "@/lib/ai/scamshield.functions";
import { FALLBACK_PRACTICE, isAiUnavailable } from "@/lib/local-analyzer";

export default defineTool({
  name: "get_practice_round",
  title: "Get a scam-spotting practice round",
  description:
    "Generates a round of 5 short practice messages (a mix of real Bangladeshi scam patterns and genuine messages) for a 'spot the scam' quiz, used to train scam awareness.",
  inputSchema: {},
  handler: async () => {
    try {
      const items = await generatePractice({ data: {} });
      const text = items
        .map(
          (item, i) =>
            `${i + 1}. ${item.message}\n   Answer: ${item.isScam ? "Scam" : "Genuine"} — ${item.explanation}`,
        )
        .join("\n\n");
      return { content: [{ type: "text" as const, text }] };
    } catch (err) {
      if (isAiUnavailable(err)) {
        const text = FALLBACK_PRACTICE.map(
          (item, i) =>
            `${i + 1}. ${item.message}\n   Answer: ${item.isScam ? "Scam" : "Genuine"} — ${item.explanation}`,
        ).join("\n\n");
        return { content: [{ type: "text" as const, text: `[offline round]\n\n${text}` }] };
      }
      throw new ToolError(err instanceof Error ? err.message : "Could not generate a practice round.");
    }
  },
});
