import type { Lang } from "@/lib/i18n";

export interface District {
  id: string;
  en: string;
  bn: string;
  division: string;
}

/** All 64 districts of Bangladesh, grouped by division. `id` is the stable,
 * canonical value stored on a report (never translated) so counts aggregate
 * correctly regardless of display language. */
export const DISTRICTS: District[] = [
  // Barishal
  { id: "barguna", en: "Barguna", bn: "বরগুনা", division: "Barishal" },
  { id: "barishal", en: "Barishal", bn: "বরিশাল", division: "Barishal" },
  { id: "bhola", en: "Bhola", bn: "ভোলা", division: "Barishal" },
  { id: "jhalokati", en: "Jhalokati", bn: "ঝালকাঠি", division: "Barishal" },
  { id: "patuakhali", en: "Patuakhali", bn: "পটুয়াখালী", division: "Barishal" },
  { id: "pirojpur", en: "Pirojpur", bn: "পিরোজপুর", division: "Barishal" },
  // Chattogram
  { id: "bandarban", en: "Bandarban", bn: "বান্দরবান", division: "Chattogram" },
  { id: "brahmanbaria", en: "Brahmanbaria", bn: "ব্রাহ্মণবাড়িয়া", division: "Chattogram" },
  { id: "chandpur", en: "Chandpur", bn: "চাঁদপুর", division: "Chattogram" },
  { id: "chattogram", en: "Chattogram", bn: "চট্টগ্রাম", division: "Chattogram" },
  { id: "cumilla", en: "Cumilla", bn: "কুমিল্লা", division: "Chattogram" },
  { id: "coxs_bazar", en: "Cox's Bazar", bn: "কক্সবাজার", division: "Chattogram" },
  { id: "feni", en: "Feni", bn: "ফেনী", division: "Chattogram" },
  { id: "khagrachhari", en: "Khagrachhari", bn: "খাগড়াছড়ি", division: "Chattogram" },
  { id: "lakshmipur", en: "Lakshmipur", bn: "লক্ষ্মীপুর", division: "Chattogram" },
  { id: "noakhali", en: "Noakhali", bn: "নোয়াখালী", division: "Chattogram" },
  { id: "rangamati", en: "Rangamati", bn: "রাঙ্গামাটি", division: "Chattogram" },
  // Dhaka
  { id: "dhaka", en: "Dhaka", bn: "ঢাকা", division: "Dhaka" },
  { id: "faridpur", en: "Faridpur", bn: "ফরিদপুর", division: "Dhaka" },
  { id: "gazipur", en: "Gazipur", bn: "গাজীপুর", division: "Dhaka" },
  { id: "gopalganj", en: "Gopalganj", bn: "গোপালগঞ্জ", division: "Dhaka" },
  { id: "kishoreganj", en: "Kishoreganj", bn: "কিশোরগঞ্জ", division: "Dhaka" },
  { id: "madaripur", en: "Madaripur", bn: "মাদারীপুর", division: "Dhaka" },
  { id: "manikganj", en: "Manikganj", bn: "মানিকগঞ্জ", division: "Dhaka" },
  { id: "munshiganj", en: "Munshiganj", bn: "মুন্সিগঞ্জ", division: "Dhaka" },
  { id: "narayanganj", en: "Narayanganj", bn: "নারায়ণগঞ্জ", division: "Dhaka" },
  { id: "narsingdi", en: "Narsingdi", bn: "নরসিংদী", division: "Dhaka" },
  { id: "rajbari", en: "Rajbari", bn: "রাজবাড়ী", division: "Dhaka" },
  { id: "shariatpur", en: "Shariatpur", bn: "শরীয়তপুর", division: "Dhaka" },
  { id: "tangail", en: "Tangail", bn: "টাঙ্গাইল", division: "Dhaka" },
  // Khulna
  { id: "bagerhat", en: "Bagerhat", bn: "বাগেরহাট", division: "Khulna" },
  { id: "chuadanga", en: "Chuadanga", bn: "চুয়াডাঙ্গা", division: "Khulna" },
  { id: "jashore", en: "Jashore", bn: "যশোর", division: "Khulna" },
  { id: "jhenaidah", en: "Jhenaidah", bn: "ঝিনাইদহ", division: "Khulna" },
  { id: "khulna", en: "Khulna", bn: "খুলনা", division: "Khulna" },
  { id: "kushtia", en: "Kushtia", bn: "কুষ্টিয়া", division: "Khulna" },
  { id: "magura", en: "Magura", bn: "মাগুরা", division: "Khulna" },
  { id: "meherpur", en: "Meherpur", bn: "মেহেরপুর", division: "Khulna" },
  { id: "narail", en: "Narail", bn: "নড়াইল", division: "Khulna" },
  { id: "satkhira", en: "Satkhira", bn: "সাতক্ষীরা", division: "Khulna" },
  // Mymensingh
  { id: "jamalpur", en: "Jamalpur", bn: "জামালপুর", division: "Mymensingh" },
  { id: "mymensingh", en: "Mymensingh", bn: "ময়মনসিংহ", division: "Mymensingh" },
  { id: "netrokona", en: "Netrokona", bn: "নেত্রকোণা", division: "Mymensingh" },
  { id: "sherpur", en: "Sherpur", bn: "শেরপুর", division: "Mymensingh" },
  // Rajshahi
  { id: "bogura", en: "Bogura", bn: "বগুড়া", division: "Rajshahi" },
  { id: "chapainawabganj", en: "Chapainawabganj", bn: "চাঁপাইনবাবগঞ্জ", division: "Rajshahi" },
  { id: "joypurhat", en: "Joypurhat", bn: "জয়পুরহাট", division: "Rajshahi" },
  { id: "naogaon", en: "Naogaon", bn: "নওগাঁ", division: "Rajshahi" },
  { id: "natore", en: "Natore", bn: "নাটোর", division: "Rajshahi" },
  { id: "pabna", en: "Pabna", bn: "পাবনা", division: "Rajshahi" },
  { id: "rajshahi", en: "Rajshahi", bn: "রাজশাহী", division: "Rajshahi" },
  { id: "sirajganj", en: "Sirajganj", bn: "সিরাজগঞ্জ", division: "Rajshahi" },
  // Rangpur
  { id: "dinajpur", en: "Dinajpur", bn: "দিনাজপুর", division: "Rangpur" },
  { id: "gaibandha", en: "Gaibandha", bn: "গাইবান্ধা", division: "Rangpur" },
  { id: "kurigram", en: "Kurigram", bn: "কুড়িগ্রাম", division: "Rangpur" },
  { id: "lalmonirhat", en: "Lalmonirhat", bn: "লালমনিরহাট", division: "Rangpur" },
  { id: "nilphamari", en: "Nilphamari", bn: "নীলফামারী", division: "Rangpur" },
  { id: "panchagarh", en: "Panchagarh", bn: "পঞ্চগড়", division: "Rangpur" },
  { id: "rangpur", en: "Rangpur", bn: "রংপুর", division: "Rangpur" },
  { id: "thakurgaon", en: "Thakurgaon", bn: "ঠাকুরগাঁও", division: "Rangpur" },
  // Sylhet
  { id: "habiganj", en: "Habiganj", bn: "হবিগঞ্জ", division: "Sylhet" },
  { id: "moulvibazar", en: "Moulvibazar", bn: "মৌলভীবাজার", division: "Sylhet" },
  { id: "sunamganj", en: "Sunamganj", bn: "সুনামগঞ্জ", division: "Sylhet" },
  { id: "sylhet", en: "Sylhet", bn: "সিলেট", division: "Sylhet" },
];

const BY_ID = new Map(DISTRICTS.map((d) => [d.id, d]));

export function districtLabel(id: string, lang: Lang): string {
  const district = BY_ID.get(id);
  if (!district) return id;
  return lang === "bn" ? district.bn : district.en;
}
