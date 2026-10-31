import {
  Banknote,
  Briefcase,
  Gift,
  Link2,
  MessageSquareWarning,
  PhoneCall,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

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
    text:
      "bKash: You have received Tk 5,000 from 01712345678 by mistake. Please return the amount immediately or your bKash account will be permanently closed within 24 hours. Send money to 01899999777. Ref: BK7734021.",
  },
  {
    id: "job",
    label: "Fake job offer with fee",
    expected: "Likely scam",
    text:
      "Congratulations! You have been selected for a work-from-home job at BD Online Tasks Ltd. Salary Tk 45,000/month. To activate your ID card and start working today, pay the registration fee Tk 850 via bKash/Nagad to 01611122233. Limited seats, reply fast!",
  },
  {
    id: "delivery",
    label: "Genuine delivery update",
    expected: "Safe",
    text:
      "Pathao Courier: Your parcel from Rajdhani Store is arriving today between 2-5 PM. Delivery man Rakib will call you. No payment needed, it is prepaid. Track at pathao.com/track with code PC88213.",
  },
];

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

export const WHAT_TO_DO_IF_SCAMMED = [
  "Call your mobile banking provider (bKash 16247, Nagad 16167, or your bank) immediately and ask them to stop or reverse the transaction.",
  "Change your PIN and password right away, from a safe device.",
  "Block the scammer's number and stop all contact.",
  "Keep screenshots of every message, number and transaction as evidence.",
  "Report to the police (999) or the nearest police station's cyber crime desk.",
];
