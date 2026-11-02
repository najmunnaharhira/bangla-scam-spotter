import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { getTrendingScamTypes } from "@/hooks/use-scam-reports";

export default defineTool({
  name: "get_trending_scam_types",
  title: "Get trending scam types",
  description:
    "Returns the most-reported scam categories across ScamShield BD's community reports, most common first (e.g. fake MFS wrong-send, OTP theft, fake job offers). Backs the Scam Map's trending section.",
  inputSchema: {},
  outputSchema: {
    types: z.array(z.object({ scamType: z.string(), count: z.number() })),
  },
  handler: async () => {
    const types = await getTrendingScamTypes();
    const text =
      types.length === 0
        ? "No scam-type-tagged reports yet."
        : types.map((t, i) => `${i + 1}. ${t.scamType}: ${t.count}`).join("\n");
    return {
      content: [{ type: "text" as const, text }],
      structuredContent: { types: types.map((t) => ({ scamType: t.scamType, count: t.count })) },
    };
  },
});
