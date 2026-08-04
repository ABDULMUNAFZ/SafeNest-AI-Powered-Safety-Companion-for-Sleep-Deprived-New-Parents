export type RiskLevel = "critical" | "high" | "medium" | "low";

export type TriageResult = {
  level: RiskLevel;
  matched: string[];
  headline: string;
  action: string;
  spoken: string;
};

const CRITICAL = [
  "not breathing", "isn't breathing", "is not breathing", "trouble breathing",
  "difficulty breathing", "struggling to breathe", "can't breathe", "blue lips",
  "blue face", "turning blue", "seizure", "fitting", "convulsion", "unconscious",
  "unresponsive", "won't wake up", "not waking", "limp", "vomiting blood",
  "blood in vomit", "choking", "stopped breathing",
];

const HIGH = [
  "keeps vomiting", "persistent vomiting", "projectile vomiting", "stiff neck",
  "rash that doesn't fade", "bulging soft spot", "very high fever", "no wet diaper",
  "hasn't eaten", "has not eaten", "refusing all feeds", "dehydrated", "hurt myself",
  "hurt my baby", "hopeless", "can't go on", "end it all",
];

const MEDIUM = [
  "fever", "diarrhea", "diarrhoea", "vomited", "not sleeping", "won't sleep",
  "forgot medicine", "missed a dose", "i'm scared", "im scared", "so tired",
  "crying all day", "constipated", "rash",
];

function match(text: string, list: string[]) {
  return list.filter((phrase) => text.includes(phrase));
}

/** Newborn fever (under 3 months) is always an emergency red flag. */
export function isNewbornFever(text: string, ageMonths?: number) {
  const hasFever = /fever|temperature|hot/.test(text);
  if (!hasFever) return false;
  if (ageMonths !== undefined && ageMonths < 3) return true;
  return /newborn|new born|\b([0-9]|1[0-1])\s*(week|weeks)\b|\b[1-2]\s*(month|months)\b/.test(text);
}

export function triage(input: string, ageMonths?: number): TriageResult {
  const text = input.toLowerCase();
  const critical = match(text, CRITICAL);
  if (critical.length || isNewbornFever(text, ageMonths)) {
    const matched = critical.length ? critical : ["fever in a baby under 3 months"];
    return {
      level: "critical",
      matched,
      headline: "Emergency detected",
      action: "Call emergency services now. Do not give any medicine.",
      spoken:
        "This may be a medical emergency. Please call emergency services immediately. I will not give medicine advice right now.",
    };
  }

  const high = match(text, HIGH);
  if (high.length) {
    return {
      level: "high",
      matched: high,
      headline: "Needs urgent medical advice",
      action: "Contact your pediatrician or an urgent care line today.",
      spoken:
        "What you described needs urgent medical advice. Please contact your pediatrician or urgent care today.",
    };
  }

  const medium = match(text, MEDIUM);
  if (medium.length) {
    return {
      level: "medium",
      matched: medium,
      headline: "Keep a close eye",
      action: "Monitor closely and call your doctor if things get worse.",
      spoken: "Keep a close eye on your baby, and call your doctor if anything gets worse.",
    };
  }

  return {
    level: "low",
    matched: [],
    headline: "No red flags detected",
    action: "Continue with routine care.",
    spoken: "",
  };
}

export const RISK_STYLES: Record<RiskLevel, string> = {
  critical: "text-destructive",
  high: "text-warning",
  medium: "text-secondary",
  low: "text-success",
};