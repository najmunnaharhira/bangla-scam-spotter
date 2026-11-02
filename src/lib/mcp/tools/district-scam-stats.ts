import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { getDistrictReportCounts } from "@/hooks/use-scam-reports";
import { districtLabel } from "@/lib/districts";

export default defineTool({
  name: "get_district_scam_stats",
  title: "Get scam report counts by district",
  description:
    "Returns how many community scam reports exist per Bangladesh district, most-reported first, optionally filtered by channel (sender type: SMS, WhatsApp, Messenger, Email, Phone call, Website, or Other). Backs ScamShield BD's district reports view.",
  inputSchema: {
    channel: z
      .string()
      .max(40)
      .optional()
      .describe("Filter to only this channel, e.g. 'SMS' or 'Phone call'"),
  },
  outputSchema: {
    districts: z.array(z.object({ district: z.string(), label: z.string(), count: z.number() })),
  },
  handler: async ({ channel }) => {
    const counts = await getDistrictReportCounts(channel);
    const districts = counts.map((c) => ({ ...c, label: districtLabel(c.district, "en") }));
    const text =
      districts.length === 0
        ? "No district-tagged scam reports yet."
        : districts.slice(0, 15).map((d, i) => `${i + 1}. ${d.label}: ${d.count}`).join("\n");
    return {
      content: [{ type: "text" as const, text }],
      structuredContent: { districts },
    };
  },
});
