import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { analyzeMessage } from "@/lib/ai/scamshield.functions";
import { analyzeLocally, isAiUnavailable } from "@/lib/local-analyzer";

export default defineTool({
  name: "check_message",
  title: "Check a message for scams",
  description:
    "Analyzes a suspicious SMS, Messenger, email or phone-call description for Bangladeshi scam patterns (fake bKash/Nagad 'wrong send' transfers, OTP/PIN theft, fake job offers, lottery wins, phishing links, impersonation) and returns a risk verdict, a 0-100 risk score, the exact red flags, and next steps.",
  inputSchema: {
    text: z.string().min(1).max(2000).describe("The message text to check"),
    sender: z.string().max(120).optional().describe("Who sent it, e.g. a phone number or name"),
    channel: z
      .string()
      .max(40)
      .optional()
      .describe("How it was sent: SMS, WhatsApp, Messenger, Email, Phone call, Website, or Other"),
  },
  handler: async ({ text, sender, channel }) => {
    try {
      const result = await analyzeMessage({ data: { text, sender, channel } });
      const flags = result.redFlags.map((f) => `- "${f.quote}": ${f.reason}`).join("\n");
      const steps = result.nextSteps.map((s) => `- ${s}`).join("\n");
      return {
        content: [
          {
            type: "text" as const,
            text: `Verdict: ${result.verdict} (risk ${result.riskScore}/100)\n${result.summary}${flags ? `\n\nRed flags:\n${flags}` : ""}${steps ? `\n\nNext steps:\n${steps}` : ""}`,
          },
        ],
      };
    } catch (err) {
      if (isAiUnavailable(err)) {
        const result = analyzeLocally(text);
        const flags = result.redFlags.map((f) => `- "${f.quote}": ${f.reason}`).join("\n");
        return {
          content: [
            {
              type: "text" as const,
              text: `Verdict: ${result.verdict} (risk ${result.riskScore}/100) [offline quick check]\n${result.summary}${flags ? `\n\nRed flags:\n${flags}` : ""}`,
            },
          ],
        };
      }
      throw new ToolError(err instanceof Error ? err.message : "Could not check this message.");
    }
  },
});
