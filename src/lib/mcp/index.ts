import { defineMcp } from "@lovable.dev/mcp-js";

import checkMessage from "./tools/check-message";
import getDistrictScamStats from "./tools/district-scam-stats";
import getPracticeRound from "./tools/practice-round";
import getTrendingScamTypes from "./tools/trending-scam-types";
import lookupScamReports from "./tools/lookup-scam-reports";

export default defineMcp({
  name: "scamshield-bd-mcp",
  title: "ScamShield BD",
  version: "1.0.0",
  instructions:
    "Tools for ScamShield BD, an AI scam checker for Bangladesh. Use check_message to analyze a suspicious SMS, Messenger, email, or call description for scam patterns. Use get_practice_round for a scam-spotting training round. Use lookup_scam_reports to query the community scam-sender database. Reports can only be created by signed-in users through the Check page. Use get_district_scam_stats and get_trending_scam_types to see which Bangladesh districts and scam categories report the most.",
  tools: [
    checkMessage,
    getPracticeRound,
    lookupScamReports,
    getDistrictScamStats,
    getTrendingScamTypes,
  ],
});
