import type {
  AnalysisResult,
  MoneySent,
  PracticeItem,
  RecoveryPlan,
  Verdict,
  WhenHappened,
} from "@/lib/types";

/**
 * Rule-based fallback used when the AI service is unreachable, out of credits
 * or rate limited. It only looks for well-known Bangladeshi scam patterns, so
 * results are labelled as a "quick check" in the UI.
 */

interface Rule {
  type: string;
  weight: number;
  pattern: RegExp;
  reason: string;
}

const RULES: Rule[] = [
  {
    type: "OTP & PIN theft",
    weight: 45,
    pattern: /\b(otp|pin|password|verification code)\b|গোপন\s?নম্বর|পিন|ওটিপি/i,
    reason:
      "Asks about your PIN, OTP or password. No real bank or bKash/Nagad ever asks for these.",
  },
  {
    type: "Fake MFS “wrong send”",
    weight: 40,
    pattern:
      /(by mistake|wrong(ly)? (send|sent|number)|return the (amount|money)|ভুল(ে)? (করে )?(টাকা|পাঠ))/i,
    reason:
      "Claims money was sent “by mistake” and asks you to return it. This is the classic bKash/Nagad wrong-send trick.",
  },
  {
    type: "Fake job offer",
    weight: 35,
    pattern:
      /(registration|activation|processing|id card|joining)\s*(fee|charge)|work from home|part[- ]time job|daily income/i,
    reason: "A job that asks for a fee first. Real employers never charge you to start working.",
  },
  {
    type: "Lottery & prize win",
    weight: 35,
    pattern:
      /(congratulations|you (have )?won|lottery|prize|lucky (draw|winner)|jackpot|অভিনন্দন|লটারি|পুরস্কার)/i,
    reason: "Says you won a prize or lottery you never entered.",
  },
  {
    type: "Pressure tactic",
    weight: 20,
    pattern:
      /(within \d+ ?(hours?|minutes?|hrs?)|immediately|urgent|right now|account (will be )?(blocked|closed|suspended)|limited (seats|time)|reply fast|জরুরি|বন্ধ (হয়ে )?যাবে)/i,
    reason:
      "Rushes you or threatens that your account will be closed. Scammers create panic so you don't stop to think.",
  },
  {
    type: "Payment request",
    weight: 20,
    pattern:
      /(send|pay|transfer|cash ?out|recharge)\b.*(tk|taka|৳|bdt|money|bkash|nagad|rocket)|(tk|৳)\s?\d[\d,]*.*\b(send|pay)\b|টাকা পাঠান/i,
    reason: "Asks you to send or pay money.",
  },
  {
    type: "Phishing link",
    weight: 25,
    pattern:
      /(bit\.ly|tinyurl|t\.me\/|wa\.me\/|https?:\/\/\S*(login|verify|secure|update|claim|bonus)\S*|\.(xyz|top|click|buzz|icu)\b)/i,
    reason: "Contains a short or suspicious-looking link that could lead to a fake login page.",
  },
  {
    type: "Impersonation",
    weight: 20,
    pattern: /\b(police|rab|army|customs|court|arrest|warrant)\b|থানা|পুলিশ|গ্রেফতার/i,
    reason:
      "Mentions police, customs or arrest to scare you. Officials do not demand money by SMS.",
  },
  {
    type: "Fake parcel fee",
    weight: 20,
    pattern: /(parcel|package|courier).*(customs|clearance|release) (fee|charge)/i,
    reason: "Asks for a fee to release a parcel. This is a common courier scam.",
  },
];

const SAFE_HINTS = /(no payment needed|prepaid|never share your (otp|pin)|do not share)/i;

function quoteFor(text: string, pattern: RegExp): string {
  const match = text.match(pattern);
  if (!match || match.index === undefined) return "";
  // Keep quotes short: long greedy matches are cut to the start of the match.
  const start = Math.max(0, match.index - 20);
  const end = Math.min(text.length, match.index + Math.min(match[0].length, 50) + 20);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

export function analyzeLocally(text: string): AnalysisResult {
  const hits = RULES.filter((rule) => rule.pattern.test(text));
  let riskScore = Math.min(
    100,
    hits.reduce((sum, rule) => sum + rule.weight, 0),
  );
  if (SAFE_HINTS.test(text)) riskScore = Math.max(0, riskScore - 25);

  const verdict: Verdict =
    riskScore >= 60 ? "likely_scam" : riskScore >= 30 ? "suspicious" : "safe";
  const main = [...hits].sort((a, b) => b.weight - a.weight)[0];

  const summary =
    verdict === "safe"
      ? "We did not find common scam signs in this message. Still, never share your PIN or OTP and verify any money request by calling the official helpline."
      : verdict === "suspicious"
        ? "This message has some warning signs. Do not send money or share codes until you verify it through an official number."
        : "This message matches well-known scam patterns in Bangladesh. Do not reply, send money or share any code.";

  return {
    riskScore,
    verdict,
    scamType: verdict === "safe" ? "No scam pattern found" : (main?.type ?? "Suspicious message"),
    summary,
    redFlags: hits.map((rule) => ({ quote: quoteFor(text, rule.pattern), reason: rule.reason })),
    nextSteps:
      verdict === "safe"
        ? ["If anything feels off, call the sender using a number you already trust."]
        : [
            "Do not reply, click links or send any money.",
            "Never share your PIN or OTP with anyone.",
            "If it mentions bKash or Nagad, call 16247 (bKash) or 16167 (Nagad) to check.",
            "Block the number and warn your family.",
          ],
    familyWarning:
      verdict === "safe"
        ? ""
        : "সাবধান! এই ধরনের মেসেজ প্রতারণা হতে পারে। কাউকে PIN বা OTP দেবেন না, টাকা পাঠাবেন না। সন্দেহ হলে bKash 16247 বা Nagad 16167 নম্বরে কল করুন।",
    extractedText: "",
  };
}

export function explainBanglaLocally(result: AnalysisResult): string {
  if (result.verdict === "safe") {
    return "এই মেসেজে আমরা প্রতারণার সাধারণ কোনো লক্ষণ পাইনি। তবুও কখনো কাউকে আপনার PIN বা OTP বলবেন না। কেউ টাকা চাইলে আগে পরিচিত নম্বরে ফোন করে যাচাই করে নিন।";
  }
  const level = result.verdict === "likely_scam" ? "খুবই ঝুঁকিপূর্ণ" : "সন্দেহজনক";
  return `এই মেসেজটি ${level} (ঝুঁকি ${result.riskScore}/100)। প্রতারকরা ভয় দেখিয়ে বা লোভ দেখিয়ে আপনার টাকা বা গোপন নম্বর নিতে চায়। এই মেসেজের উত্তর দেবেন না, কোনো লিংকে চাপ দেবেন না এবং কাউকে টাকা পাঠাবেন না। PIN বা OTP কাউকে বলবেন না। সন্দেহ হলে bKash 16247 বা Nagad 16167 নম্বরে কল করুন এবং পরিবারের কারো সাথে কথা বলুন।`;
}

export const FALLBACK_PRACTICE: PracticeItem[] = [
  {
    message:
      "bKash: You received Tk 3,500 by mistake from 01XXXXXXXXX. Please send it back to 01YYYYYYYYY within 1 hour or your account will be blocked.",
    isScam: true,
    explanation:
      "A fake “wrong send”. bKash never asks you to return money yourself and never threatens to block you by SMS.",
    redFlags: [
      "Money sent “by mistake”",
      "Asks you to send money back",
      "Threat to block account",
      "1-hour deadline",
    ],
  },
  {
    message:
      "Your Daraz order #48210 has been shipped and will arrive in 2-3 days. Track it in the Daraz app under My Orders.",
    isScam: false,
    explanation:
      "A normal shipping update. It asks for no money, no code and points you to the official app.",
    redFlags: [],
  },
  {
    message:
      "Congratulations! Your number won Tk 5,00,000 in the Grameenphone anniversary lucky draw. Pay Tk 1,500 processing fee via Nagad to claim your prize.",
    isScam: true,
    explanation:
      "You cannot win a draw you never entered, and real prizes never need an upfront fee.",
    redFlags: [
      "Surprise prize win",
      "Processing fee to claim",
      "Payment via Nagad to a personal number",
    ],
  },
  {
    message:
      "Your OTP for Nagad login is 482913. Do not share this code with anyone. Nagad will never ask for your OTP.",
    isScam: false,
    explanation:
      "A genuine OTP SMS that you requested. It warns you not to share the code, which is what real services do.",
    redFlags: [],
  },
  {
    message:
      "Online part-time job! Earn Tk 2,000 daily by liking YouTube videos. Pay Tk 500 registration fee to get your ID. Message us on WhatsApp now.",
    isScam: true,
    explanation: "Easy money jobs that ask for a registration fee are always scams.",
    redFlags: ["Unrealistic daily income", "Registration fee", "Moves you to WhatsApp"],
  },
];

export interface IncidentReport {
  whatHappened: string;
  channel?: string | undefined;
  moneySent: MoneySent;
  whenHappened: WhenHappened;
  provider?: string | undefined;
}

function helplineFor(incident: IncidentReport): string {
  const text = `${incident.provider ?? ""} ${incident.whatHappened}`.toLowerCase();
  if (text.includes("nagad")) return "Nagad (16167)";
  if (text.includes("rocket")) return "Rocket (16207)";
  if (text.includes("bkash")) return "bKash (16247)";
  return "bKash (16247), Nagad (16167), Rocket (16207) or your bank";
}

export function recoveryPlanLocally(incident: IncidentReport): RecoveryPlan {
  const helpline = helplineFor(incident);
  const steps: RecoveryPlan["steps"] = [];

  if (incident.moneySent === "pin_otp") {
    steps.push({
      title: "Change your PIN now",
      detail: `Change your PIN from a safe phone, then call ${helpline} and ask them to lock the account.`,
      priority: 1,
    });
  }
  if (incident.moneySent === "yes" || incident.moneySent === "not_sure") {
    steps.push({
      title: "Call the helpline right away",
      detail: `Call ${helpline} with the transaction ID and ask them to freeze or reverse the transfer. The sooner, the better.`,
      priority: 1,
    });
  }
  steps.push(
    {
      title: "Stop all contact",
      detail: "Do not reply or send anything more, whatever they threaten. Block the number.",
      priority: 1,
    },
    {
      title: "Save the evidence",
      detail:
        "Take screenshots of the messages, numbers and transaction IDs before deleting anything.",
      priority: 2,
    },
  );
  if (incident.moneySent !== "no") {
    steps.push({
      title: "Report to the police",
      detail:
        "Call 999 or visit your nearest police station's cyber crime desk with your screenshots.",
      priority: 2,
    });
  }
  steps.push({
    title: "Turn on transaction alerts",
    detail: "Check your recent transactions and turn on SMS alerts so you notice anything new.",
    priority: 3,
  });

  const sent = incident.moneySent === "yes" || incident.moneySent === "pin_otp";
  return {
    urgency: sent && incident.whenHappened !== "older" ? "immediate" : sent ? "today" : "this_week",
    whatLikelyHappened:
      incident.moneySent === "no"
        ? "It sounds like a scam attempt that you stopped in time. You did the right thing by checking."
        : "It sounds like a scam that tried to take money or account access. Acting quickly gives the best chance to limit the damage.",
    scamType: incident.moneySent === "pin_otp" ? "OTP/PIN theft" : "Possible scam",
    steps: steps.slice(0, 6),
    watchOut: [
      "Scammers often call back pretending to be police or a “recovery agent” who asks for a fee. That is a second scam.",
      "No real bank or bKash/Nagad agent will ever ask for your PIN or OTP.",
    ],
    reportTo: ["bKash 16247", "Nagad 16167", "Rocket 16207", "Police and cyber crime 999"],
    familyAdvice:
      "Tell your family what happened so they can spot the same trick. Being scammed is not your fault.",
  };
}

export function followUpLocally(plan: RecoveryPlan): string {
  const first = plan.steps[0];
  return `The AI assistant is busy right now, so I can't answer this question in detail. The most important thing is still your first step: ${first ? `${first.title}. ${first.detail}` : "call your provider's helpline."} You can reach ${plan.reportTo.join(", ")}. Please try your question again in a minute.`;
}

export function checkFollowUpLocally(result: AnalysisResult): string {
  const first = result.nextSteps[0];
  return `The AI assistant is busy right now, so I can't answer this question in detail. Based on the check: ${result.summary} ${first ? `The most important step is: ${first}` : ""} Please try your question again in a minute.`;
}

/** Always-available safety guidance for the floating chat when no AI provider
 * is configured. It intentionally answers only the app's narrow safety scope. */
export function scamAgentLocally(question: string): string {
  const q = question.trim().toLowerCase();
  const bangla = /[\u0980-\u09ff]/.test(question);
  const emergency = /(sent|send|lost|paid|transfer|otp|pin|password|click|হয়েছে|পাঠিয়েছি|টাকা|ওটিপি|পিন)/i.test(q);
  const spotting = /(spot|identify|recogn|sign|tell|detect|avoid|চিনব|বুঝব|লক্ষণ|এড়াব)/i.test(q);

  if (bangla) {
    if (emergency) {
      return "এখনই আর কোনো টাকা, PIN বা OTP দেবেন না। bKash হলে 16247, Nagad হলে 16167, Rocket হলে 16207 নম্বরে ফোন করে লেনদেন বন্ধ বা ফেরত দেওয়ার অনুরোধ করুন। PIN বদলান, প্রমাণের ছবি রাখুন এবং জরুরি হলে 999 নম্বরে জানান। পরে কেউ ‘টাকা উদ্ধার’ করার নামে ফি চাইলে দেবেন না।";
    }
    if (spotting) {
      return "স্ক্যামের সাধারণ লক্ষণ হলো হঠাৎ পুরস্কার বা চাকরির প্রস্তাব, খুব দ্রুত কাজ করার চাপ, আগে টাকা চাওয়া, সন্দেহজনক লিংক, এবং PIN বা OTP চাওয়া। পরিচিত প্রতিষ্ঠানও কখনো PIN বা OTP চায় না। মেসেজের নম্বরে উত্তর না দিয়ে প্রতিষ্ঠানের অফিসিয়াল নম্বরে নিজে ফোন করে যাচাই করুন। সন্দেহজনক মেসেজ Check পাতায় পরীক্ষা করতে পারেন।";
    }
    return "সন্দেহজনক মেসেজে উত্তর দেবেন না, লিংকে চাপ দেবেন না এবং PIN, OTP বা টাকা পাঠাবেন না। প্রেরকের দেওয়া নম্বর ব্যবহার না করে প্রতিষ্ঠানের অফিসিয়াল নম্বরে নিজে যোগাযোগ করুন। নির্দিষ্ট মেসেজ হলে Check পাতায় পেস্ট করুন; টাকা পাঠিয়ে থাকলে Get Help পাতার ধাপগুলো অনুসরণ করুন।";
  }

  if (emergency) {
    return "Stop sending money or sharing codes now. Call bKash at 16247, Nagad at 16167, Rocket at 16207, or your bank and ask them to freeze or reverse the transaction; change your PIN, save screenshots, and report urgent cases to 999. Ignore anyone who later asks for a fee to ‘recover’ your money.";
  }
  if (spotting) {
    return "Common scam signs are unexpected prizes or jobs, pressure to act immediately, upfront fees, suspicious links, and requests for a PIN or OTP. Real banks and mobile-wallet providers never ask for those secret codes. Contact the organization using its official number—not the number in the message—and paste suspicious text into the Check page.";
  }
  return "Do not reply, click links, send money, or share a PIN or OTP until you verify the sender through an official number. Paste a specific message into the Check page for a quick risk check. If you already paid or shared a code, open Get Help for immediate recovery steps.";
}

/** True when an error from a server function means the AI is not available. */
export function isAiUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return !/^(EMPTY_INPUT|TOO_BIG|BAD_INPUT):/.test(message);
}
