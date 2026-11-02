import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { getScamReportCount } from "@/hooks/use-scam-reports";

export default defineTool({
  name: "lookup_scam_reports",
  title: "Look up scam reports for a sender",
  description:
    "Checks how many times a phone number, account number, or sender name has already been reported as a scam by the ScamShield BD community.",
  inputSchema: {
    identifier: z
      .string()
      .min(3)
      .max(120)
      .describe("The phone number, account number, or sender name to look up"),
  },
  handler: async ({ identifier }) => {
    const count = await getScamReportCount(identifier);
    const text =
      count > 0
        ? `"${identifier}" has been reported ${count} time${count === 1 ? "" : "s"} as a scam sender.`
        : `No reports found for "${identifier}" yet. That doesn't guarantee it's safe — always check the message itself.`;
    return { content: [{ type: "text" as const, text }] };
  },
});
