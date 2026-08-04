export type KnowledgeAnswer = {
  id: string;
  keywords: string[];
  question: string;
  answer: string;
  source: string;
};

/** Curated, source-attributed answers. Nothing here is model-generated. */
export const KNOWLEDGE: KnowledgeAnswer[] = [
  {
    id: "sleep",
    keywords: ["won't sleep", "not sleeping", "sleep", "nap", "bedtime"],
    question: "My baby won't sleep",
    answer:
      "Newborns sleep 14–17 hours across the day in short stretches, so broken nights are expected. Keep the room dark and cool, put your baby down drowsy but awake, and always place them on their back on a firm flat surface with no pillows or loose bedding.",
    source: "AAP Safe Sleep · NHS Baby sleep",
  },
  {
    id: "burp",
    keywords: ["burp", "wind", "gas"],
    question: "When should I burp my baby?",
    answer:
      "Burp midway through a feed and again at the end, or whenever your baby pulls off, squirms, or seems uncomfortable. Hold them upright against your shoulder and pat gently for a minute or two — not every feed produces a burp.",
    source: "AAP HealthyChildren",
  },
  {
    id: "breastfeeding-medicine",
    keywords: ["breastfeed after", "medicine", "medication", "safe to breastfeed"],
    question: "Can I breastfeed after taking medicine?",
    answer:
      "Many common medicines including paracetamol and ibuprofen are considered compatible with breastfeeding, but this depends on the exact drug and dose. Check the specific medicine with your pharmacist, doctor, or a lactation service before your next feed — do not stop feeding without advice.",
    source: "NHS Breastfeeding and medicines",
  },
  {
    id: "teething",
    keywords: ["teething", "teeth", "tooth"],
    question: "When do babies start teething?",
    answer:
      "First teeth usually appear between 6 and 10 months, though anywhere from 3 to 12 months is normal. Offer a clean chilled teething ring and gently rub the gums. Teething does not cause high fever — check with a doctor if your baby has one.",
    source: "NHS Teething · AAP",
  },
  {
    id: "fever",
    keywords: ["fever", "temperature", "hot"],
    question: "What counts as a fever?",
    answer:
      "A temperature of 38°C (100.4°F) or above is a fever. In a baby under 3 months this always needs same-day medical assessment. For older babies, watch feeding, alertness, and wet diapers, and seek care if the fever lasts more than 48 hours or your baby seems unwell.",
    source: "NHS Fever in children · WHO IMCI",
  },
  {
    id: "feeding-amount",
    keywords: ["how much milk", "feeding", "how often feed", "feed frequency"],
    question: "How often should my baby feed?",
    answer:
      "Newborns feed 8–12 times in 24 hours, roughly every 2–3 hours, on demand. Good signs are 6 or more wet diapers a day and steady weight gain. Exclusive breastfeeding is recommended for the first 6 months.",
    source: "WHO Infant feeding · AAP",
  },
  {
    id: "vaccines",
    keywords: ["vaccine", "vaccination", "immunisation", "immunization", "shots"],
    question: "Are vaccines on schedule important?",
    answer:
      "Follow your country's routine immunisation schedule; the first doses usually start at 6 weeks or 2 months. Mild fever or a sore leg for a day afterwards is common. If a dose is missed, catch-up schedules exist — call your clinic rather than skipping it.",
    source: "WHO / CDC immunisation schedules",
  },
  {
    id: "postpartum-mood",
    keywords: ["sad", "depressed", "hopeless", "postpartum", "anxious", "crying", "overwhelmed"],
    question: "I feel low all the time",
    answer:
      "Feeling low, anxious, or tearful after birth is common, and it is a health issue like any other — not a failure. If it lasts more than two weeks, affects daily life, or includes thoughts of harming yourself, contact your doctor, midwife, or a crisis line today. Support works, and asking for it is the strong move.",
    source: "NHS Postnatal depression · WHO Maternal mental health",
  },
  {
    id: "colic",
    keywords: ["colic", "won't stop crying", "inconsolable", "keeps crying"],
    question: "My baby keeps crying",
    answer:
      "Work through the simple list: hunger, diaper, temperature, wind, and contact. Long crying spells that peak around 6 weeks can be normal colic. Never shake a baby — if you feel at the end of your rope, put your baby down safely in the cot and take a few minutes.",
    source: "NHS Colic · AAP",
  },
];

export function findAnswers(input: string, limit = 1) {
  const text = input.toLowerCase();
  return KNOWLEDGE.map((entry) => ({
    entry,
    score: entry.keywords.reduce((s, k) => (text.includes(k) ? s + k.length : s), 0),
  }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.entry);
}

export const FALLBACK_ANSWER =
  "I don't have a trusted source for that one, so I won't guess. Please ask your pediatrician, midwife, or health visitor — and if it feels urgent, use Emergency Mode.";