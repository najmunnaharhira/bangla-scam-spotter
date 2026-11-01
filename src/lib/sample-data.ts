import { Banknote, Briefcase, Gift, Link2, PhoneCall, Smartphone, type LucideIcon } from "lucide-react";

import type { Lang } from "@/lib/i18n";

export interface ExampleChip {
  id: string;
  label: string;
  expected: string;
  text: string;
}

export const EXAMPLE_CHIPS: ExampleChip[] = [
  {
    id: "bkash",
    label: "Fake bKash “wrong send”",
    expected: "Likely scam",
    text: "bKash: You have received Tk 5,000 from 01712345678 by mistake. Please return the amount immediately or your bKash account will be permanently closed within 24 hours. Send money to 01899999777. Ref: BK7734021.",
  },
  {
    id: "job",
    label: "Fake job offer with fee",
    expected: "Likely scam",
    text: "Congratulations! You have been selected for a work-from-home job at BD Online Tasks Ltd. Salary Tk 45,000/month. To activate your ID card and start working today, pay the registration fee Tk 850 via bKash/Nagad to 01611122233. Limited seats, reply fast!",
  },
  {
    id: "delivery",
    label: "Genuine delivery update",
    expected: "Safe",
    text: "Pathao Courier: Your parcel from Rajdhani Store is arriving today between 2-5 PM. Delivery man Rakib will call you. No payment needed, it is prepaid. Track at pathao.com/track with code PC88213.",
  },
];

const EXAMPLE_CHIP_LABELS_BN: Record<string, string> = {
  bkash: "ভুয়া bKash “ভুল করে পাঠানো”",
  job: "ফি দাবি করা ভুয়া চাকরির অফার",
  delivery: "আসল ডেলিভারি আপডেট",
};

export function exampleChipLabel(lang: Lang, chip: ExampleChip): string {
  return lang === "bn" ? (EXAMPLE_CHIP_LABELS_BN[chip.id] ?? chip.label) : chip.label;
}

export interface ScamTypeInfo {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const SCAM_TYPES: ScamTypeInfo[] = [
  {
    title: "Fake MFS “wrong send”",
    description:
      "Someone “sends money by mistake” to your bKash/Nagad/Rocket and pressures you to return it — the original transfer was fake.",
    icon: Banknote,
  },
  {
    title: "OTP & PIN theft",
    description:
      "Callers or SMS claiming to be from your bank ask for the OTP or PIN code. No real bank ever asks for it.",
    icon: Smartphone,
  },
  {
    title: "Fake job offers",
    description:
      "Easy high-salary jobs that ask for a registration or ID-card fee before you can start working.",
    icon: Briefcase,
  },
  {
    title: "Lottery & prize wins",
    description:
      "“You won a mobile or prize money!” — but you must first pay a courier or tax charge to receive it.",
    icon: Gift,
  },
  {
    title: "Phishing links",
    description:
      "Fake websites that look like bKash, banks or courier services and steal your login details.",
    icon: Link2,
  },
  {
    title: "Impersonation & threats",
    description:
      "Fake police, army or RAB officers threatening you, or callers pretending to be a relative in trouble.",
    icon: PhoneCall,
  },
];

const SCAM_TYPES_BN: { title: string; description: string }[] = [
  {
    title: "ভুয়া এমএফএস “ভুল করে পাঠানো”",
    description:
      "কেউ আপনার bKash/Nagad/Rocket-এ “ভুল করে টাকা পাঠিয়ে” তা ফেরত দিতে চাপ দেয় — আসল লেনদেনটিই ভুয়া ছিল।",
  },
  {
    title: "OTP ও PIN চুরি",
    description:
      "ব্যাংক থেকে বলে দাবি করা কলার বা এসএমএস OTP বা PIN কোড চায়। আসল কোনো ব্যাংক কখনো এটি চায় না।",
  },
  {
    title: "ভুয়া চাকরির অফার",
    description:
      "কাজ শুরুর আগে রেজিস্ট্রেশন বা আইডি-কার্ড ফি দাবি করা সহজ উচ্চ-বেতনের চাকরি।",
  },
  {
    title: "লটারি ও পুরস্কার জয়",
    description:
      "“আপনি মোবাইল বা পুরস্কারের টাকা জিতেছেন!” — কিন্তু আগে কুরিয়ার বা ট্যাক্স ফি দিতে হবে।",
  },
  {
    title: "ফিশিং লিংক",
    description:
      "bKash, ব্যাংক বা কুরিয়ার সার্ভিসের মতো দেখতে ভুয়া ওয়েবসাইট যা আপনার লগইন তথ্য চুরি করে।",
  },
  {
    title: "ছদ্মবেশ ও হুমকি",
    description:
      "ভুয়া পুলিশ, সেনাবাহিনী বা র‍্যাব কর্মকর্তার হুমকি, অথবা বিপদে পড়া আত্মীয় সেজে কল করা প্রতারক।",
  },
];

export function localizedScamTypes(lang: Lang): ScamTypeInfo[] {
  if (lang !== "bn") return SCAM_TYPES;
  return SCAM_TYPES.map((scam, i) => ({
    ...scam,
    title: SCAM_TYPES_BN[i]?.title ?? scam.title,
    description: SCAM_TYPES_BN[i]?.description ?? scam.description,
  }));
}

export const CHANNELS = [
  "SMS",
  "WhatsApp",
  "Messenger",
  "Email",
  "Phone call",
  "Website",
  "Other",
] as const;

export interface Helpline {
  name: string;
  number: string;
  note: string;
}

export const HELPLINES: Helpline[] = [
  { name: "National Emergency", number: "999", note: "Police, fire and ambulance" },
  { name: "bKash", number: "16247", note: "Official bKash helpline" },
  { name: "Nagad", number: "16167", note: "Official Nagad helpline" },
  { name: "Cyber Crime Helpline", number: "999", note: "Report online fraud to police" },
];

const HELPLINES_BN: { name: string; note: string }[] = [
  { name: "জাতীয় জরুরি সেবা", note: "পুলিশ, ফায়ার সার্ভিস ও অ্যাম্বুলেন্স" },
  { name: "bKash", note: "অফিসিয়াল bKash হেল্পলাইন" },
  { name: "Nagad", note: "অফিসিয়াল Nagad হেল্পলাইন" },
  { name: "সাইবার ক্রাইম হেল্পলাইন", note: "পুলিশের কাছে অনলাইন প্রতারণা রিপোর্ট করুন" },
];

export function localizedHelplines(lang: Lang): Helpline[] {
  if (lang !== "bn") return HELPLINES;
  return HELPLINES.map((line, i) => ({
    ...line,
    name: HELPLINES_BN[i]?.name ?? line.name,
    note: HELPLINES_BN[i]?.note ?? line.note,
  }));
}

export const GOLDEN_RULES = [
  "Never share your PIN, OTP or password with anyone — not even “bank officials”.",
  "No genuine bKash/Nagad agent will ever ask you to send money back from a “wrong transfer”. Call 16247/16167 instead.",
  "Real jobs never ask you to pay a fee first. Any “registration fee” is a scam.",
  "You cannot win a lottery you never entered. Prize claims that need an advance payment are fake.",
  "Do not click links in unexpected SMS or Messenger messages — type the website address yourself.",
  "Verify every helpline number on the provider's official website before you call or trust it.",
  "Keep your mobile banking app updated and turn on transaction alerts.",
  "If you feel rushed or threatened (“within 24 hours!”), stop and talk to a family member first.",
];

const GOLDEN_RULES_BN: string[] = [
  "কখনো আপনার PIN, OTP বা পাসওয়ার্ড কারো সাথে শেয়ার করবেন না — এমনকি “ব্যাংক কর্মকর্তা” দাবি করলেও না।",
  "কোনো আসল bKash/Nagad এজেন্ট কখনো “ভুল করে পাঠানো” টাকা ফেরত চাইবে না। এর বদলে 16247/16167 নম্বরে কল করুন।",
  "আসল চাকরি কখনো আগে ফি দিতে বলে না। যেকোনো “রেজিস্ট্রেশন ফি” প্রতারণা।",
  "আপনি অংশ নেননি এমন লটারি জিততে পারবেন না। অগ্রিম টাকা চাওয়া পুরস্কারের দাবি ভুয়া।",
  "অপ্রত্যাশিত এসএমএস বা মেসেঞ্জার মেসেজের লিংকে ক্লিক করবেন না — নিজে ওয়েবসাইটের ঠিকানা টাইপ করুন।",
  "কল করা বা বিশ্বাস করার আগে প্রতিটি হেল্পলাইন নম্বর প্রোভাইডারের অফিসিয়াল ওয়েবসাইটে যাচাই করুন।",
  "আপনার মোবাইল ব্যাংকিং অ্যাপ আপডেট রাখুন এবং লেনদেন সতর্কতা চালু করুন।",
  "যদি আপনাকে তাড়াহুড়া বা হুমকি দেওয়া হয় (“২৪ ঘণ্টার মধ্যে!”), থেমে প্রথমে পরিবারের কারো সাথে কথা বলুন।",
];

export function localizedGoldenRules(lang: Lang): string[] {
  return lang === "bn" ? GOLDEN_RULES_BN : GOLDEN_RULES;
}

export const WHAT_TO_DO_IF_SCAMMED = [
  "Call your mobile banking provider (bKash 16247, Nagad 16167, or your bank) immediately and ask them to stop or reverse the transaction.",
  "Change your PIN and password right away, from a safe device.",
  "Block the scammer's number and stop all contact.",
  "Keep screenshots of every message, number and transaction as evidence.",
  "Report to the police (999) or the nearest police station's cyber crime desk.",
];

const WHAT_TO_DO_IF_SCAMMED_BN: string[] = [
  "আপনার মোবাইল ব্যাংকিং প্রোভাইডারকে (bKash 16247, Nagad 16167, অথবা আপনার ব্যাংক) সাথে সাথে কল করে লেনদেন বন্ধ বা ফেরত দিতে বলুন।",
  "একটি নিরাপদ ডিভাইস থেকে সাথে সাথে আপনার PIN ও পাসওয়ার্ড পরিবর্তন করুন।",
  "প্রতারকের নম্বর ব্লক করুন এবং সব যোগাযোগ বন্ধ করুন।",
  "প্রমাণ হিসেবে প্রতিটি মেসেজ, নম্বর ও লেনদেনের স্ক্রিনশট রাখুন।",
  "পুলিশকে (999) অথবা নিকটস্থ থানার সাইবার ক্রাইম ডেস্কে রিপোর্ট করুন।",
];

export function localizedWhatToDoIfScammed(lang: Lang): string[] {
  return lang === "bn" ? WHAT_TO_DO_IF_SCAMMED_BN : WHAT_TO_DO_IF_SCAMMED;
}
