/**
 * VALIDATED PEDIATRIC DOSAGE LOOKUP TABLES.
 * Values are weight-banded and derived from standard pediatric references
 * (NHS / AAP style weight-based dosing). AI is NEVER used to compute a dose:
 * speech is only parsed into structured fields, then this table is consulted.
 */

export type DosageBand = {
  minKg: number;
  maxKg: number;
  dose: string;
  concentration: string;
  frequency: string;
  maxPerDay: string;
};

export type Medicine = {
  id: string;
  name: string;
  aliases: string[];
  minAgeMonths: number;
  minAgeNote: string;
  bands: DosageBand[];
  notes: string[];
};

export const MEDICINES: Medicine[] = [
  {
    id: "paracetamol",
    name: "Infant Paracetamol",
    aliases: ["paracetamol", "acetaminophen", "calpol", "tylenol", "crocin", "dolo"],
    minAgeMonths: 2,
    minAgeNote:
      "Paracetamol is not given at home to babies under 2 months (or under 4 kg) without a doctor's instruction.",
    bands: [
      { minKg: 4, maxKg: 5.9, dose: "2.0 ml", concentration: "120 mg / 5 ml", frequency: "Every 6 hours", maxPerDay: "4 doses in 24 hours" },
      { minKg: 6, maxKg: 7.9, dose: "2.5 ml", concentration: "120 mg / 5 ml", frequency: "Every 4–6 hours", maxPerDay: "4 doses in 24 hours" },
      { minKg: 8, maxKg: 9.9, dose: "3.5 ml", concentration: "120 mg / 5 ml", frequency: "Every 4–6 hours", maxPerDay: "4 doses in 24 hours" },
      { minKg: 10, maxKg: 12.9, dose: "5.0 ml", concentration: "120 mg / 5 ml", frequency: "Every 4–6 hours", maxPerDay: "4 doses in 24 hours" },
      { minKg: 13, maxKg: 15.9, dose: "6.0 ml", concentration: "120 mg / 5 ml", frequency: "Every 4–6 hours", maxPerDay: "4 doses in 24 hours" },
      { minKg: 16, maxKg: 20, dose: "7.5 ml", concentration: "120 mg / 5 ml", frequency: "Every 4–6 hours", maxPerDay: "4 doses in 24 hours" },
    ],
    notes: [
      "Use the syringe supplied with the bottle — never a kitchen spoon.",
      "Do not combine with any other paracetamol-containing product.",
    ],
  },
  {
    id: "ibuprofen",
    name: "Infant Ibuprofen",
    aliases: ["ibuprofen", "nurofen", "brufen", "advil", "motrin"],
    minAgeMonths: 3,
    minAgeNote:
      "Ibuprofen is only for babies 3 months and older who weigh at least 5 kg. Ask your pediatrician for younger babies.",
    bands: [
      { minKg: 5, maxKg: 7.9, dose: "2.5 ml", concentration: "100 mg / 5 ml", frequency: "Every 8 hours", maxPerDay: "3 doses in 24 hours" },
      { minKg: 8, maxKg: 9.9, dose: "2.5 ml", concentration: "100 mg / 5 ml", frequency: "Every 6–8 hours", maxPerDay: "3 doses in 24 hours" },
      { minKg: 10, maxKg: 12.9, dose: "5.0 ml", concentration: "100 mg / 5 ml", frequency: "Every 6–8 hours", maxPerDay: "3 doses in 24 hours" },
      { minKg: 13, maxKg: 16, dose: "7.5 ml", concentration: "100 mg / 5 ml", frequency: "Every 6–8 hours", maxPerDay: "3 doses in 24 hours" },
    ],
    notes: [
      "Give with or just after a feed to protect the stomach.",
      "Avoid if your baby is dehydrated, vomiting a lot, or has chickenpox — call your doctor.",
    ],
  },
  {
    id: "ors",
    name: "Oral Rehydration Solution (ORS)",
    aliases: ["ors", "rehydration", "electrolyte", "pedialyte"],
    minAgeMonths: 0,
    minAgeNote: "",
    bands: [
      { minKg: 3, maxKg: 5.9, dose: "10 ml", concentration: "Standard low-osmolarity ORS", frequency: "After each loose stool, in small sips", maxPerDay: "As guided by your doctor" },
      { minKg: 6, maxKg: 9.9, dose: "20 ml", concentration: "Standard low-osmolarity ORS", frequency: "After each loose stool, in small sips", maxPerDay: "As guided by your doctor" },
      { minKg: 10, maxKg: 20, dose: "50 ml", concentration: "Standard low-osmolarity ORS", frequency: "After each loose stool, in small sips", maxPerDay: "As guided by your doctor" },
    ],
    notes: ["Keep breastfeeding or formula feeding as usual alongside ORS."],
  },
  {
    id: "vitamin-d",
    name: "Vitamin D Drops",
    aliases: ["vitamin d", "vit d", "cholecalciferol", "d3"],
    minAgeMonths: 0,
    minAgeNote: "",
    bands: [
      { minKg: 2, maxKg: 20, dose: "400 IU", concentration: "Per manufacturer's drop count", frequency: "Once daily", maxPerDay: "1 dose in 24 hours" },
    ],
    notes: ["Recommended daily for breastfed babies (WHO / AAP guidance)."],
  },
];

export type ParsedRequest = {
  ageMonths?: number | undefined;
  weightKg?: number | undefined;
  medicineId?: string | undefined;
  symptoms: string[];
};

const SYMPTOM_WORDS = [
  "fever", "temperature", "cough", "cold", "pain", "teething", "diarrhea",
  "diarrhoea", "vomiting", "rash", "colic", "gas", "congestion", "earache",
];

/** Deterministic parser: turns free speech into structured fields. */
export function parseRequest(input: string): ParsedRequest {
  const text = input.toLowerCase().replace(/,/g, " ");
  const words = text.replace(/\b(one)\b/g, "1").replace(/\btwo\b/g, "2")
    .replace(/\bthree\b/g, "3").replace(/\bfour\b/g, "4").replace(/\bfive\b/g, "5")
    .replace(/\bsix\b/g, "6").replace(/\bseven\b/g, "7").replace(/\beight\b/g, "8")
    .replace(/\bnine\b/g, "9").replace(/\bten\b/g, "10").replace(/\btwelve\b/g, "12")
    .replace(/\bpoint\b/g, ".");

  const monthMatch = words.match(/(\d+(?:\.\d+)?)\s*(?:month|months|mo)\b/);
  const yearMatch = words.match(/(\d+(?:\.\d+)?)\s*(?:year|years|yr)\b/);
  const weekMatch = words.match(/(\d+(?:\.\d+)?)\s*(?:week|weeks)\b/);
  const weightMatch = words.match(/(\d+(?:\s*\.\s*\d+)?)\s*(?:kilogram|kilograms|kilo|kilos|kgs|kg)\b/);

  let ageMonths: number | undefined;
  if (monthMatch?.[1]) ageMonths = parseFloat(monthMatch[1]);
  else if (yearMatch?.[1]) ageMonths = parseFloat(yearMatch[1]) * 12;
  else if (weekMatch?.[1]) ageMonths = parseFloat(weekMatch[1]) / 4.345;

  const weightKg = weightMatch?.[1]
    ? parseFloat(weightMatch[1].replace(/\s/g, ""))
    : undefined;

  const medicine = MEDICINES.find((m) => m.aliases.some((a) => text.includes(a)));
  const symptoms = SYMPTOM_WORDS.filter((s) => text.includes(s));

  return { ageMonths, weightKg, medicineId: medicine?.id, symptoms };
}

export type DosageResult =
  | { status: "ok"; medicine: Medicine; band: DosageBand; spoken: string }
  | { status: "need-info"; missing: Array<"medicine" | "weight" | "age">; spoken: string }
  | { status: "blocked"; reason: string; spoken: string };

export function lookupDosage(parsed: ParsedRequest): DosageResult {
  const missing: Array<"medicine" | "weight" | "age"> = [];
  if (!parsed.medicineId) missing.push("medicine");
  if (parsed.weightKg === undefined) missing.push("weight");
  if (missing.length) {
    const spoken =
      missing.includes("medicine") && missing.includes("weight")
        ? "I need the medicine name and your baby's weight to look up a safe dose."
        : missing.includes("medicine")
          ? "Which medicine are you asking about?"
          : "How much does your baby weigh in kilograms?";
    return { status: "need-info", missing, spoken };
  }

  const medicine = MEDICINES.find((m) => m.id === parsed.medicineId)!;
  if (parsed.ageMonths !== undefined && parsed.ageMonths < medicine.minAgeMonths) {
    return { status: "blocked", reason: medicine.minAgeNote, spoken: medicine.minAgeNote };
  }

  const band = medicine.bands.find(
    (b) => parsed.weightKg! >= b.minKg && parsed.weightKg! <= b.maxKg,
  );
  if (!band) {
    const reason = `I don't have a validated ${medicine.name} dose for ${parsed.weightKg} kilograms. Please ask your pediatrician for this weight.`;
    return { status: "blocked", reason, spoken: reason };
  }

  return {
    status: "ok",
    medicine,
    band,
    spoken: `For a ${parsed.weightKg} kilogram baby, the recommended ${medicine.name} dose is ${band.dose}, ${band.frequency.toLowerCase()}. Maximum ${band.maxPerDay}. Please confirm with your pediatrician.`,
  };
}