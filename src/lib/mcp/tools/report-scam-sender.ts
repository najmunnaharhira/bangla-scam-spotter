import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { reportScamSender } from "@/hooks/use-scam-reports";

export default defineTool({
  name: "report_scam_sender",
  title: "Report a scam sender",
  description:
    "Flags a phone number, bKash/Nagad account number, or sender name as a scam source in ScamShield BD's public community database, so future checks warn other users. No login required.",
  inputSchema: {
    identifier: z
      .string()
      .min(3)
      .max(120)
      .describe("The phone number, account number, or sender name to report"),
    note: z.string().max(500).optional().describe("Optional short note about what happened"),
  },
  handler: async ({ identifier, note }) => {
    const ok = await reportScamSender(identifier, note);
    if (!ok) throw new ToolError("Could not save the report. Try again shortly.");
    return {
      content: [
        {
          type: "text" as const,
          text: `Reported "${identifier}" as a scam sender. Thank you for helping protect others.`,
        },
      ],
    };
  },
});
