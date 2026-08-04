import { useCallback, useEffect, useState } from "react";

export type LogKind = "fed" | "slept" | "diaper" | "medicine" | "water";

export type CareLog = {
  id: string;
  kind: LogKind;
  at: number;
  note?: string;
};

export type MoodEntry = {
  id: string;
  at: number;
  score: 1 | 2 | 3 | 4 | 5;
  stressScore?: number; // 1-10
  energyScore?: number; // 1-10
  note?: string;
};

export type BabyProfile = {
  babyName: string;
  parentName: string;
  birthDate: string;
  ageMonths: number;
  weightKg: number;
  heightCm: number;
  allergies: string;
  bloodGroup: string;
  pediatrician: string;
  pediatricianPhone: string;
  partnerName: string;
  partnerPhone: string;
  emergencyNumber: string;
  shareWithPartner: boolean;
  hospitalName: string;
  insuranceName: string;
  insurancePolicy: string;
};

export type GrowthRecord = {
  id: string;
  at: number;
  ageMonths: number;
  weightKg: number;
  heightCm: number;
  headCircumferenceCm?: number;
};

export type Vaccine = {
  id: string;
  name: string;
  disease: string;
  dueAgeMonths: number;
  status: "completed" | "scheduled" | "overdue";
  completedAt?: number;
  notes: string;
};

export type MedicalDocument = {
  id: string;
  name: string;
  category: "prescription" | "vaccination_card" | "lab_report" | "pediatrician_note";
  uploadedAt: number;
  doctorName?: string;
  fileSize?: string;
};

export type SafeNestSettings = {
  theme: "light" | "dark";
  fontSize: "sm" | "base" | "lg" | "xl";
  voiceSpeed: number; // 0.8 to 1.5
  language: "en" | "ta" | "hi";
  emergencyAlerts: boolean;
};

export const DEFAULT_PROFILE: BabyProfile = {
  babyName: "Aria",
  parentName: "Sarah",
  birthDate: "2026-04-04",
  ageMonths: 4,
  weightKg: 6.2,
  heightCm: 62.5,
  allergies: "No known food or drug allergies",
  bloodGroup: "O Positive (O+)",
  pediatrician: "Dr. Meera Rao",
  pediatricianPhone: "+15550102",
  partnerName: "David",
  partnerPhone: "+15550103",
  emergencyNumber: "911",
  shareWithPartner: true,
  hospitalName: "Mayo Pediatric Care Clinic",
  insuranceName: "Aetna Health Premium",
  insurancePolicy: "POL-0987-A12",
};

export const DEFAULT_SETTINGS: SafeNestSettings = {
  theme: "dark",
  fontSize: "base",
  voiceSpeed: 1.0,
  language: "en",
  emergencyAlerts: true,
};

const KEYS = {
  logs: "safenest.logs",
  moods: "safenest.moods",
  profile: "safenest.profile",
  growth: "safenest.growth",
  vaccines: "safenest.vaccines",
  documents: "safenest.documents",
  settings: "safenest.settings",
} as const;

// PRE-POPULATED REALISTIC SAMPLES
const MOCK_GROWTH: GrowthRecord[] = [
  { id: "g1", at: new Date("2026-04-04").getTime(), ageMonths: 0, weightKg: 3.2, heightCm: 49.0, headCircumferenceCm: 34.5 },
  { id: "g2", at: new Date("2026-05-04").getTime(), ageMonths: 1, weightKg: 4.1, heightCm: 53.0, headCircumferenceCm: 36.8 },
  { id: "g3", at: new Date("2026-06-04").getTime(), ageMonths: 2, weightKg: 5.0, heightCm: 56.5, headCircumferenceCm: 38.5 },
  { id: "g4", at: new Date("2026-07-04").getTime(), ageMonths: 3, weightKg: 5.7, heightCm: 59.5, headCircumferenceCm: 40.2 },
  { id: "g5", at: new Date("2026-08-04").getTime(), ageMonths: 4, weightKg: 6.2, heightCm: 62.5, headCircumferenceCm: 41.5 },
];

const MOCK_VACCINES: Vaccine[] = [
  { id: "v1", name: "Hepatitis B (HepB) - Dose 1", disease: "Hepatitis B", dueAgeMonths: 0, status: "completed", completedAt: new Date("2026-04-04").getTime(), notes: "Given at birth. Mild redness at site." },
  { id: "v2", name: "Rotavirus (RV) - Dose 1", disease: "Rotavirus diarrhea", dueAgeMonths: 2, status: "completed", completedAt: new Date("2026-06-06").getTime(), notes: "Oral vaccine. Well tolerated." },
  { id: "v3", name: "DTaP - Dose 1", disease: "Diphtheria, Tetanus, Pertussis", dueAgeMonths: 2, status: "completed", completedAt: new Date("2026-06-06").getTime(), notes: "Given in left thigh. Slight fussiness for 24h." },
  { id: "v4", name: "Pneumococcal (PCV13) - Dose 1", disease: "Pneumonia, Meningitis", dueAgeMonths: 2, status: "completed", completedAt: new Date("2026-06-06").getTime(), notes: "Standard immunisation." },
  { id: "v5", name: "Rotavirus (RV) - Dose 2", disease: "Rotavirus diarrhea", dueAgeMonths: 4, status: "completed", completedAt: new Date("2026-08-01").getTime(), notes: "Oral drop. Second dose completed." },
  { id: "v6", name: "DTaP - Dose 2", disease: "Diphtheria, Tetanus, Pertussis", dueAgeMonths: 4, status: "completed", completedAt: new Date("2026-08-01").getTime(), notes: "Routine 4-month dose." },
  { id: "v7", name: "Haemophilus influenzae type b (Hib) - Dose 2", disease: "Meningitis, Epiglottitis", dueAgeMonths: 4, status: "completed", completedAt: new Date("2026-08-01").getTime(), notes: "Mild soreness reported." },
  { id: "v8", name: "DTaP - Dose 3", disease: "Diphtheria, Tetanus, Pertussis", dueAgeMonths: 6, status: "scheduled", notes: "Due at 6 months. Protects against whooping cough." },
  { id: "v9", name: "Influenza (Flu) - Dose 1", disease: "Seasonal Influenza", dueAgeMonths: 6, status: "scheduled", notes: "First flu shot, followed by a booster 4 weeks later." },
  { id: "v10", name: "MMR - Dose 1", disease: "Measles, Mumps, Rubella", dueAgeMonths: 12, status: "scheduled", notes: "Protects against childhood measles outbreaks." },
];

const MOCK_DOCUMENTS: MedicalDocument[] = [
  { id: "d1", name: "Birth Immunisation Record.pdf", category: "vaccination_card", uploadedAt: new Date("2026-04-05").getTime(), doctorName: "Dr. Laura Vance", fileSize: "1.2 MB" },
  { id: "d2", name: "Pediatric Visit Note - 2 Month Review.pdf", category: "pediatrician_note", uploadedAt: new Date("2026-06-07").getTime(), doctorName: "Dr. Meera Rao", fileSize: "840 KB" },
  { id: "d3", name: "Infant Paracetamol Prescription.pdf", category: "prescription", uploadedAt: new Date("2026-07-15").getTime(), doctorName: "Dr. Meera Rao", fileSize: "420 KB" },
];

const makePastTime = (hoursAgo: number) => Date.now() - hoursAgo * 3600000;

const MOCK_LOGS: CareLog[] = [
  { id: "l1", kind: "fed", at: makePastTime(1.5), note: "120 ml formula feed" },
  { id: "l2", kind: "diaper", at: makePastTime(2.2), note: "Wet diaper, normal yellow stool" },
  { id: "l3", kind: "slept", at: makePastTime(4.0), note: "Napped in crib for 45 mins" },
  { id: "l4", kind: "water", at: makePastTime(4.5), note: "Parent water check: 250ml logged" },
  { id: "l5", kind: "fed", at: makePastTime(5.0), note: "Direct breastfeeding, 15 mins left side" },
  { id: "l6", kind: "diaper", at: makePastTime(5.8), note: "Wet diaper" },
  { id: "l7", kind: "medicine", at: makePastTime(7.2), note: "Infant Paracetamol (2.0 ml) given for mild fever" },
  { id: "l8", kind: "slept", at: makePastTime(9.5), note: "Morning sleep stretch of 1.5 hours" },
  { id: "l9", kind: "fed", at: makePastTime(11.0), note: "100 ml formula feed" },
  { id: "l10", kind: "water", at: makePastTime(12.0), note: "Parent water check: 300ml" },
  { id: "l11", kind: "diaper", at: makePastTime(15.0), note: "Dry diaper changed" },
  { id: "l12", kind: "slept", at: makePastTime(20.0), note: "Overnight sleep stretch: woke once" },
  { id: "l13", kind: "fed", at: makePastTime(21.0), note: "Breastfeeding 20 mins total" },
];

const MOCK_MOODS: MoodEntry[] = [
  { id: "m1", at: makePastTime(6), score: 4, stressScore: 3, energyScore: 6, note: "Slept a bit better. Baby is calmer." },
  { id: "m2", at: makePastTime(28), score: 3, stressScore: 5, energyScore: 4, note: "Feeling slightly overwhelmed but okay." },
  { id: "m3", at: makePastTime(52), score: 2, stressScore: 8, energyScore: 2, note: "Very tired today. Aria was crying late at night." },
  { id: "m4", at: makePastTime(76), score: 4, stressScore: 4, energyScore: 5, note: "Had a nice walk outside. Helped a lot." },
  { id: "m5", at: makePastTime(100), score: 5, stressScore: 2, energyScore: 7, note: "Partner helped with feeds. Felt rested." },
];

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      if (key === KEYS.growth) return MOCK_GROWTH as unknown as T;
      if (key === KEYS.vaccines) return MOCK_VACCINES as unknown as T;
      if (key === KEYS.documents) return MOCK_DOCUMENTS as unknown as T;
      if (key === KEYS.logs) return MOCK_LOGS as unknown as T;
      if (key === KEYS.moods) return MOCK_MOODS as unknown as T;
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("safenest:store", { detail: key }));
  } catch {
    /* storage unavailable */
  }
}

function usePersisted<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(read<T>(key, fallback));
    setHydrated(true);
    const sync = () => setValue(read<T>(key, fallback));
    window.addEventListener("safenest:store", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("safenest:store", sync);
      window.removeEventListener("storage", sync);
    };
  }, [key, fallback]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      write(key, next);
    },
    [key],
  );

  return { value, update, hydrated };
}

const newId = () => Math.random().toString(36).slice(2, 10);

export function useCareLogs() {
  const { value, update, hydrated } = usePersisted<CareLog[]>(KEYS.logs, MOCK_LOGS);

  const addLog = useCallback(
    (kind: LogKind, note?: string) => {
      const entry: CareLog = { id: newId(), kind, at: Date.now(), ...(note ? { note } : {}) };
      const nextValue = [entry, ...value].slice(0, 400);
      update(nextValue);
      return entry;
    },
    [update, value],
  );

  const lastOf = useCallback((kind: LogKind) => value.find((l) => l.kind === kind), [value]);

  return { logs: value, addLog, lastOf, hydrated, replace: update };
}

export function useMoods() {
  const { value, update, hydrated } = usePersisted<MoodEntry[]>(KEYS.moods, MOCK_MOODS);

  const addMood = useCallback(
    (score: MoodEntry["score"], note?: string, stressScore?: number, energyScore?: number) => {
      const entry: MoodEntry = {
        id: newId(),
        at: Date.now(),
        score,
        stressScore: stressScore ?? (score <= 2 ? 8 : score === 3 ? 5 : 3),
        energyScore: energyScore ?? (score <= 2 ? 3 : score === 3 ? 5 : 7),
        ...(note ? { note } : {}),
      };
      update([entry, ...value].slice(0, 120));
      return entry;
    },
    [update, value],
  );

  let lowStreak = 0;
  for (const entry of value) {
    if (entry.score <= 2) lowStreak += 1;
    else break;
  }

  const average = value.length
    ? value.slice(0, 7).reduce((sum, m) => sum + m.score, 0) / Math.min(value.length, 7)
    : 0;

  const averageStress = value.length
    ? value.slice(0, 7).reduce((sum, m) => sum + (m.stressScore || 5), 0) / Math.min(value.length, 7)
    : 5;

  const averageEnergy = value.length
    ? value.slice(0, 7).reduce((sum, m) => sum + (m.energyScore || 5), 0) / Math.min(value.length, 7)
    : 5;

  return { moods: value, addMood, lowStreak, average, averageStress, averageEnergy, hydrated };
}

export function useProfile() {
  const { value, update, hydrated } = usePersisted<BabyProfile>(KEYS.profile, DEFAULT_PROFILE);
  const save = useCallback(
    (patch: Partial<BabyProfile>) => update({ ...value, ...patch }),
    [update, value],
  );
  return { profile: { ...DEFAULT_PROFILE, ...value }, save, hydrated };
}

export function useGrowthRecords() {
  const { value, update, hydrated } = usePersisted<GrowthRecord[]>(KEYS.growth, MOCK_GROWTH);

  const addGrowth = useCallback(
    (weightKg: number, heightCm: number, headCircumferenceCm?: number) => {
      const current = read<BabyProfile>(KEYS.profile, DEFAULT_PROFILE);
      const entry: GrowthRecord = {
        id: newId(),
        at: Date.now(),
        ageMonths: current.ageMonths,
        weightKg,
        heightCm,
        headCircumferenceCm,
      };
      update([...value, entry].sort((a, b) => a.at - b.at));
      return entry;
    },
    [update, value],
  );

  return { growth: value, addGrowth, hydrated };
}

export function useVaccinations() {
  const { value, update, hydrated } = usePersisted<Vaccine[]>(KEYS.vaccines, MOCK_VACCINES);

  const toggleVaccine = useCallback(
    (id: string) => {
      const next = value.map((v) => {
        if (v.id === id) {
          const isComp = v.status === "completed";
          return {
            ...v,
            status: isComp ? "scheduled" : ("completed" as const),
            completedAt: isComp ? undefined : Date.now(),
          };
        }
        return v;
      });
      update(next);
    },
    [value, update],
  );

  return { vaccines: value, toggleVaccine, hydrated };
}

export function useVaultDocuments() {
  const { value, update, hydrated } = usePersisted<MedicalDocument[]>(KEYS.documents, MOCK_DOCUMENTS);

  const addDocument = useCallback(
    (name: string, category: MedicalDocument["category"], doctorName?: string, fileSize = "1.5 MB") => {
      const doc: MedicalDocument = {
        id: newId(),
        name,
        category,
        uploadedAt: Date.now(),
        doctorName,
        fileSize,
      };
      update([doc, ...value]);
      return doc;
    },
    [update, value],
  );

  const deleteDocument = useCallback(
    (id: string) => {
      update(value.filter((d) => d.id !== id));
    },
    [update, value],
  );

  return { documents: value, addDocument, deleteDocument, hydrated };
}

export function useSafeNestSettings() {
  const { value, update, hydrated } = usePersisted<SafeNestSettings>(KEYS.settings, DEFAULT_SETTINGS);

  const saveSettings = useCallback(
    (patch: Partial<SafeNestSettings>) => {
      const updated = { ...value, ...patch };
      update(updated);

      if (typeof document !== "undefined") {
        const root = document.documentElement;
        if (updated.theme === "dark") {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    },
    [update, value],
  );

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (value.theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [value.theme]);

  return { settings: { ...DEFAULT_SETTINGS, ...value }, saveSettings, hydrated };
}

export function useRiskScores(logs: CareLog[], moods: MoodEntry[], profile: BabyProfile) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todaysLogs = logs.filter((l) => l.at >= startOfDay.getTime());
  const medsGiven = todaysLogs.filter((l) => l.kind === "medicine");
  const diaperChanges = todaysLogs.filter((l) => l.kind === "diaper");
  const lowMoodStreak = moods.length && moods[0]?.score <= 2;

  let babyScore: "Low" | "Medium" | "High" = "Low";
  let babyReason = "Baby is showing normal, active patterns.";

  const lastMed = logs.find((l) => l.kind === "medicine");
  const lastFed = logs.find((l) => l.kind === "fed");
  const hrsSinceFeed = lastFed ? (Date.now() - lastFed.at) / 3600000 : 24;

  if (medsGiven.length >= 3 && lastMed?.note?.toLowerCase().includes("fever")) {
    babyScore = "High";
    babyReason = "High fever warning: Baby has required 3+ doses of paracetamol today. Monitor breathing closely.";
  } else if (hrsSinceFeed > 6 && profile.ageMonths < 6) {
    babyScore = "High";
    babyReason = `Feeding gap exceeds 6 hours (${hrsSinceFeed.toFixed(1)} hrs). Offer feed now to prevent dehydration.`;
  } else if (diaperChanges.length === 0 && todaysLogs.length > 0 && Date.now() - startOfDay.getTime() > 12 * 3600000) {
    babyScore = "Medium";
    babyReason = "Dehydration warning: No wet diapers logged in the last 12 hours.";
  } else if (medsGiven.length > 0) {
    babyScore = "Medium";
    babyReason = "Active tracking: Baby was administered medicine today. Monitor temperature.";
  }

  let parentScore: "Low" | "Medium" | "High" = "Low";
  let parentReason = "Parent stress and energy levels are within positive balance.";

  let recentLowCount = 0;
  for (const m of moods.slice(0, 3)) {
    if (m.score <= 2) recentLowCount++;
  }

  const stressAvg = moods.slice(0, 3).reduce((sum, m) => sum + (m.stressScore || 5), 0) / Math.max(1, Math.min(moods.length, 3));

  if (recentLowCount >= 2 || stressAvg >= 7.5) {
    parentScore = "High";
    parentReason = "High postpartum stress: Consecutive low wellbeing scores. Please contact a professional.";
  } else if (recentLowCount === 1 || stressAvg >= 5.5) {
    parentScore = "Medium";
    parentReason = "Anxiety & Fatigue: Parent reports moderate stress. Highly recommend a guided breathing break.";
  }

  return {
    baby: { score: babyScore, reason: babyReason },
    parent: { score: parentScore, reason: parentReason },
  };
}

export function useDailySummary(logs: CareLog[], moods: MoodEntry[], profile: BabyProfile) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const today = logs.filter((log) => log.at >= startOfDay.getTime());

  const feeds = today.filter((l) => l.kind === "fed").length;
  const sleeps = today.filter((l) => l.kind === "slept").length;
  const diapers = today.filter((l) => l.kind === "diaper").length;
  const medicines = today.filter((l) => l.kind === "medicine").length;
  const parentMood = moods.find((m) => m.at >= startOfDay.getTime());

  let summary = "";
  if (!today.length && !parentMood) {
    summary = "No care logs recorded yet today. Logging baby feeds and sleep enables AI summaries.";
  } else {
    summary = `Today, ${profile.babyName} has had ${feeds} feedings, ${sleeps} sleep intervals, and ${diaperChangesStr(diapers)}. ${
      medicines ? `Administered medication ${medicines} times. ` : ""
    }${
      parentMood
        ? `You checked in feeling ${
            parentMood.score === 5
              ? "excellent (5/5)"
              : parentMood.score === 4
                ? "good (4/5)"
                : parentMood.score === 3
                  ? "okay (3/5)"
                  : "struggling (under 3/5)"
          }.`
        : "You haven't logged your wellness check-in yet — take 3 seconds to log it under the 'You' tab."
    }`;
  }

  return summary;
}

function diaperChangesStr(count: number) {
  if (count === 0) return "no diaper changes";
  if (count === 1) return "1 diaper change";
  return `${count} diaper changes`;
}

export function timeAgo(at?: number) {
  if (!at) return "No record yet";
  const mins = Math.floor((Date.now() - at) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  if (hours < 24) return rest ? `${hours} hr ${rest} min ago` : `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export function clockTime(at: number) {
  return new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function averageGapMinutes(logs: CareLog[], kind: LogKind, fallback: number) {
  const times = logs
    .filter((l) => l.kind === kind)
    .map((l) => l.at)
    .slice(0, 8);
  if (times.length < 3) return fallback;
  const gaps: number[] = [];
  for (let i = 0; i < times.length - 1; i++) {
    const gap = (times[i]! - times[i + 1]!) / 60000;
    if (gap > 5 && gap < 60 * 12) gaps.push(gap);
  }
  if (!gaps.length) return fallback;
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}