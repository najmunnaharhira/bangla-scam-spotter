import { describe, expect, it } from "vitest";

import { analyzeLocally, isAiUnavailable, recoveryPlanLocally } from "@/lib/local-analyzer";
import { EXAMPLE_CHIPS } from "@/lib/sample-data";

const example = (id: string) => EXAMPLE_CHIPS.find((chip) => chip.id === id)!.text;

describe("local scam analyzer fallback", () => {
  it("flags the fake bKash wrong-send as a likely scam", () => {
    const result = analyzeLocally(example("bkash"));
    expect(result.verdict).toBe("likely_scam");
    expect(result.redFlags.length).toBeGreaterThan(0);
  });

  it("flags the fake job offer as a likely scam", () => {
    expect(analyzeLocally(example("job")).verdict).toBe("likely_scam");
  });

  it("marks the genuine delivery update as safe", () => {
    expect(analyzeLocally(example("delivery")).verdict).toBe("safe");
  });

  it("puts changing the PIN first when an OTP was shared", () => {
    const plan = recoveryPlanLocally({
      whatHappened: "A caller got my bKash OTP and Tk 2000 was sent",
      moneySent: "pin_otp",
      whenHappened: "last_24h",
    });
    expect(plan.urgency).toBe("immediate");
    expect(plan.steps[0]?.priority).toBe(1);
    expect(plan.steps[0]?.detail).toContain("bKash (16247)");
  });

  it("keeps a stopped attempt low urgency", () => {
    const plan = recoveryPlanLocally({
      whatHappened: "Got a lottery SMS but did not reply",
      moneySent: "no",
      whenHappened: "within_week",
    });
    expect(plan.urgency).toBe("this_week");
  });

  it("treats input errors as real errors, not AI outages", () => {
    expect(isAiUnavailable(new Error("TOO_BIG: too large"))).toBe(false);
    expect(isAiUnavailable(new Error("NO_CREDITS: out of credits"))).toBe(true);
  });
});
