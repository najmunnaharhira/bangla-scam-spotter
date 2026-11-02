import { defineMcp } from "@lovable.dev/mcp-js";

import checkMessage from "./tools/check-message";
import getDistrictScamStats from "./tools/district-scam-stats";
import getPracticeRound from "./tools/practice-round";
import lookupScamReports from "./tools/lookup-scam-reports";
import reportScamSender from "./tools/report-scam-sender";

export default defineMcp({
  name: "scamshield-bd-mcp",
  title: "ScamShield BD",
  version: "1.0.0",
  instructions:
    "Tools for ScamShield BD, an AI scam checker for Bangladesh. Use check_message to analyze a suspicious SMS, Messenger, email, or call description for scam patterns. Use get_practice_round for a scam-spotting training round. Use report_scam_sender and lookup_scam_reports to contribute to and query the public community scam-sender database. Use get_district_scam_stats to see which Bangladesh districts report the most scams. No authentication is required.",
  tools: [checkMessage, getPracticeRound, reportScamSender, lookupScamReports, getDistrictScamStats],
});
