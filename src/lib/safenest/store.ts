import { useCallback, useEffect, useState } from "react";
import { auth as firebaseAuth } from "./firebase";
import { supabase, isSupabaseConfigured } from "./supabase";

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

// Helper to read local cache
function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

// Helper to write local cache
function writeLocal(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("safenest:store", { detail: key }));
  } catch {
    /* fallback cache failed */
  }
}

// HYBRID SYNC HOOK (Cache First, background sync with Supabase)
function useSyncState<T>(key: string, fallback: T, fetchRemote?: (uid: string) => Promise<T>, saveRemote?: (uid: string, data: T) => Promise<void>) {
  const [value, setValue] = useState<T>(() => readLocal<T>(key, fallback));
  const [hydrated, setHydrated] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  // Sync state between tabs and local storage
  useEffect(() => {
    setValue(readLocal<T>(key, fallback));
    setHydrated(true);
    const sync = () => setValue(readLocal<T>(key, fallback));
    window.addEventListener("safenest:store", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("safenest:store", sync);
      window.removeEventListener("storage", sync);
    };
  }, [key, fallback]);

  // Listen for user auth changes to trigger Remote Sync
  useEffect(() => {
    if (!firebaseAuth) return;
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      if (user) {
        setUid(user.uid);
      } else {
        setUid(null);
      }
    });
    return unsubscribe;
  }, []);

  // Trigger background remote fetch once user is authenticated and Supabase configured
  useEffect(() => {
    if (uid && isSupabaseConfigured && fetchRemote) {
      fetchRemote(uid)
        .then((remoteData) => {
          setValue(remoteData);
          writeLocal(key, remoteData);
        })
        .catch((err) => console.warn("Supabase fetch failed (running offline):", err));
    }
  }, [uid, key, fetchRemote]);

  const update = useCallback(
    async (next: T) => {
      // 1. Optimistic UI update locally
      setValue(next);
      writeLocal(key, next);

      // 2. Write to remote database asynchronously in the background
      if (uid && isSupabaseConfigured && saveRemote) {
        try {
          await saveRemote(uid, next);
        } catch (err) {
          console.error("Supabase sync background write failed:", err);
        }
      }
    },
    [uid, key, saveRemote]
  );

  return { value, update, hydrated };
}

const newId = () => Math.random().toString(36).slice(2, 10);

// 1. CARE LOGS HOOK
export function useCareLogs() {
  const fetchRemote = async (uid: string) => {
    if (!supabase) return [];
    const { data } = await supabase
      .from("care_logs")
      .select("id, kind, at, note")
      .eq("parent_id", uid)
      .order("at", { ascending: false });
    
    if (!data) return [];
    return data.map((l: any) => ({
      id: l.id,
      kind: l.kind as LogKind,
      at: new Date(l.at).getTime(),
      note: l.note || undefined
    }));
  };

  const saveRemote = async (uid: string, logs: CareLog[]) => {
    // Handled individually inside addLog / delete to prevent massive payloads
  };

  const { value, update, hydrated } = useSyncState<CareLog[]>(
    KEYS.logs,
    [],
    fetchRemote,
    saveRemote
  );

  const addLog = useCallback(
    (kind: LogKind, note?: string) => {
      const entry: CareLog = { id: newId(), kind, at: Date.now(), ...(note ? { note } : {}) };
      const nextValue = [entry, ...value].slice(0, 400);
      update(nextValue);

      // Write individual entry to Supabase
      const currentUser = firebaseAuth?.currentUser;
      if (currentUser && isSupabaseConfigured && supabase) {
        supabase.from("care_logs").insert({
          id: entry.id,
          parent_id: currentUser.uid,
          kind: entry.kind,
          at: new Date(entry.at).toISOString(),
          note: entry.note
        }).then(({ error }) => {
          if (error) console.error("Error logging care to remote DB:", error);
        });
      }

      return entry;
    },
    [update, value]
  );

  const lastOf = useCallback((kind: LogKind) => value.find((l) => l.kind === kind), [value]);

  const replace = useCallback((nextLogs: CareLog[]) => {
    update(nextLogs);
    // Handle individual delete on Supabase
    const currentUser = firebaseAuth?.currentUser;
    if (currentUser && isSupabaseConfigured && supabase) {
      const currentIds = new Set(nextLogs.map(l => l.id));
      const deletedLogs = value.filter(l => !currentIds.has(l.id));
      deletedLogs.forEach(dl => {
        supabase.from("care_logs").delete().eq("id", dl.id).then();
      });
    }
  }, [update, value]);

  return { logs: value, addLog, lastOf, hydrated, replace };
}

// 2. MOOD LOGS HOOK
export function useMoods() {
  const fetchRemote = async (uid: string) => {
    if (!supabase) return [];
    const { data } = await supabase
      .from("mood_logs")
      .select("id, score, stress_score, energy_score, note, at")
      .eq("parent_id", uid)
      .order("at", { ascending: false });

    if (!data) return [];
    return data.map((m: any) => ({
      id: m.id,
      score: m.score as MoodEntry["score"],
      stressScore: m.stress_score || 5,
      energyScore: m.energy_score || 5,
      note: m.note || undefined,
      at: new Date(m.at).getTime()
    }));
  };

  const { value, update, hydrated } = useSyncState<MoodEntry[]>(
    KEYS.moods,
    [],
    fetchRemote
  );

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

      // Async write to Supabase
      const currentUser = firebaseAuth?.currentUser;
      if (currentUser && isSupabaseConfigured && supabase) {
        supabase.from("mood_logs").insert({
          id: entry.id,
          parent_id: currentUser.uid,
          score: entry.score,
          stress_score: entry.stressScore,
          energy_score: entry.energyScore,
          note: entry.note,
          at: new Date(entry.at).toISOString()
        }).then();
      }

      return entry;
    },
    [update, value]
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

// 3. PROFILE HOOK
export function useProfile() {
  const fetchRemote = async (uid: string) => {
    if (!supabase) return DEFAULT_PROFILE;
    
    // Fetch profile and baby details
    const { data: profileData } = await supabase
      .from("profiles")
      .select("parent_name, partner_name, partner_phone, emergency_number, share_with_partner")
      .eq("id", uid)
      .single();

    const { data: babyData } = await supabase
      .from("babies")
      .select("*")
      .eq("parent_id", uid)
      .single();

    if (!profileData && !babyData) return DEFAULT_PROFILE;

    return {
      parentName: profileData?.parent_name || DEFAULT_PROFILE.parentName,
      partnerName: profileData?.partner_name || DEFAULT_PROFILE.partnerName,
      partnerPhone: profileData?.partner_phone || DEFAULT_PROFILE.partnerPhone,
      emergencyNumber: profileData?.emergency_number || DEFAULT_PROFILE.emergencyNumber,
      shareWithPartner: profileData?.share_with_partner ?? DEFAULT_PROFILE.shareWithPartner,
      
      babyName: babyData?.baby_name || DEFAULT_PROFILE.babyName,
      birthDate: babyData?.birth_date || DEFAULT_PROFILE.birthDate,
      ageMonths: babyData?.age_months || DEFAULT_PROFILE.ageMonths,
      weightKg: babyData?.weight_kg || DEFAULT_PROFILE.weightKg,
      heightCm: babyData?.height_cm || DEFAULT_PROFILE.heightCm,
      bloodGroup: babyData?.blood_group || DEFAULT_PROFILE.bloodGroup,
      allergies: babyData?.allergies || DEFAULT_PROFILE.allergies,
      pediatrician: babyData?.pediatrician || DEFAULT_PROFILE.pediatrician,
      pediatricianPhone: babyData?.pediatrician_phone || DEFAULT_PROFILE.pediatricianPhone,
      hospitalName: babyData?.hospital_name || DEFAULT_PROFILE.hospitalName,
      insuranceName: babyData?.insurance_name || DEFAULT_PROFILE.insuranceName,
      insurancePolicy: babyData?.insurance_policy || DEFAULT_PROFILE.insurancePolicy,
    };
  };

  const saveRemote = async (uid: string, next: BabyProfile) => {
    if (!supabase) return;
    await supabase.from("profiles").upsert({
      id: uid,
      parent_name: next.parentName,
      partner_name: next.partnerName,
      partner_phone: next.partnerPhone,
      emergency_number: next.emergencyNumber,
      share_with_partner: next.shareWithPartner
    });

    await supabase.from("babies").upsert({
      parent_id: uid,
      baby_name: next.babyName,
      birth_date: next.birthDate,
      age_months: next.ageMonths,
      weight_kg: next.weightKg,
      height_cm: next.heightCm,
      blood_group: next.bloodGroup,
      allergies: next.allergies,
      pediatrician: next.pediatrician,
      pediatrician_phone: next.pediatricianPhone,
      hospital_name: next.hospitalName,
      insurance_name: next.insuranceName,
      insurance_policy: next.insurancePolicy
    });
  };

  const { value, update, hydrated } = useSyncState<BabyProfile>(
    KEYS.profile,
    DEFAULT_PROFILE,
    fetchRemote,
    saveRemote
  );

  const save = useCallback(
    (patch: Partial<BabyProfile>) => update({ ...value, ...patch }),
    [update, value]
  );

  return { profile: value, save, hydrated };
}

// 4. GROWTH RECORDS HOOK
export function useGrowthRecords() {
  const fetchRemote = async (uid: string) => {
    if (!supabase) return [];
    
    // Get baby id first
    const { data: baby } = await supabase.from("babies").select("id").eq("parent_id", uid).single();
    if (!baby) return [];

    const { data } = await supabase
      .from("growth_records")
      .select("id, age_months, weight_kg, height_cm, head_circumference_cm, at")
      .eq("baby_id", baby.id)
      .order("at", { ascending: true });

    if (!data) return [];
    return data.map((g: any) => ({
      id: g.id,
      ageMonths: g.age_months,
      weightKg: g.weight_kg,
      heightCm: g.height_cm,
      headCircumferenceCm: g.head_circumference_cm || undefined,
      at: new Date(g.at).getTime()
    }));
  };

  const { value, update, hydrated } = useSyncState<GrowthRecord[]>(
    KEYS.growth,
    [],
    fetchRemote
  );

  const addGrowth = useCallback(
    async (weightKg: number, heightCm: number, headCircumferenceCm?: number) => {
      const current = readLocal<BabyProfile>(KEYS.profile, DEFAULT_PROFILE);
      const entry: GrowthRecord = {
        id: newId(),
        at: Date.now(),
        ageMonths: current.ageMonths,
        weightKg,
        heightCm,
        headCircumferenceCm,
      };

      update([...value, entry].sort((a, b) => a.at - b.at));

      // Async write to Supabase
      const currentUser = firebaseAuth?.currentUser;
      if (currentUser && isSupabaseConfigured && supabase) {
        const { data: baby } = await supabase.from("babies").select("id").eq("parent_id", currentUser.uid).single();
        if (baby) {
          await supabase.from("growth_records").insert({
            id: entry.id,
            baby_id: baby.id,
            age_months: entry.ageMonths,
            weight_kg: entry.weightKg,
            height_cm: entry.heightCm,
            head_circumference_cm: entry.headCircumferenceCm,
            at: new Date(entry.at).toISOString()
          });
        }
      }

      return entry;
    },
    [update, value]
  );

  return { growth: value, addGrowth, hydrated };
}

// 5. VACCINATIONS CHECKLIST HOOK
export function useVaccinations() {
  const fetchRemote = async (uid: string) => {
    if (!supabase) return [];
    
    const { data: baby } = await supabase.from("babies").select("id").eq("parent_id", uid).single();
    if (!baby) return [];

    const { data } = await supabase
      .from("vaccinations")
      .select("id, name, disease, due_age_months, status, completed_at, notes")
      .eq("baby_id", baby.id);

    if (!data || data.length === 0) return [];
    return data.map((v: any) => ({
      id: v.id,
      name: v.name,
      disease: v.disease,
      dueAgeMonths: v.due_age_months,
      status: v.status as Vaccine["status"],
      completedAt: v.completed_at ? new Date(v.completed_at).getTime() : undefined,
      notes: v.notes
    }));
  };

  const { value, update, hydrated } = useSyncState<Vaccine[]>(
    KEYS.vaccines,
    [],
    fetchRemote
  );

  const toggleVaccine = useCallback(
    async (id: string) => {
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

      // Async write to Supabase
      const currentUser = firebaseAuth?.currentUser;
      if (currentUser && isSupabaseConfigured && supabase) {
        const item = next.find(v => v.id === id)!;
        await supabase.from("vaccinations").update({
          status: item.status,
          completed_at: item.completedAt ? new Date(item.completedAt).toISOString() : null
        }).eq("id", id);
      }
    },
    [value, update]
  );

  return { vaccines: value, toggleVaccine, hydrated };
}

// 6. VAULT DOCUMENTS HOOK
export function useVaultDocuments() {
  const fetchRemote = async (uid: string) => {
    if (!supabase) return [];
    
    const { data: baby } = await supabase.from("babies").select("id").eq("parent_id", uid).single();
    if (!baby) return [];

    const { data } = await supabase
      .from("documents")
      .select("id, name, category, uploaded_at, doctor_name, file_size")
      .eq("baby_id", baby.id);

    if (!data) return [];
    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      category: d.category as MedicalDocument["category"],
      uploadedAt: new Date(d.uploaded_at).getTime(),
      doctorName: d.doctor_name || undefined,
      fileSize: d.file_size || undefined
    }));
  };

  const { value, update, hydrated } = useSyncState<MedicalDocument[]>(
    KEYS.documents,
    [],
    fetchRemote
  );

  const addDocument = useCallback(
    async (name: string, category: MedicalDocument["category"], doctorName?: string, fileSize = "1.5 MB") => {
      const doc: MedicalDocument = {
        id: newId(),
        name,
        category,
        uploadedAt: Date.now(),
        doctorName,
        fileSize,
      };

      update([doc, ...value]);

      // Async write to Supabase
      const currentUser = firebaseAuth?.currentUser;
      if (currentUser && isSupabaseConfigured && supabase) {
        const { data: baby } = await supabase.from("babies").select("id").eq("parent_id", currentUser.uid).single();
        if (baby) {
          await supabase.from("documents").insert({
            id: doc.id,
            baby_id: baby.id,
            name: doc.name,
            category: doc.category,
            uploaded_at: new Date(doc.uploadedAt).toISOString(),
            doctor_name: doc.doctorName,
            file_size: doc.fileSize
          });
        }
      }

      return doc;
    },
    [update, value]
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      update(value.filter((d) => d.id !== id));

      // Async delete on Supabase
      if (isSupabaseConfigured && supabase) {
        await supabase.from("documents").delete().eq("id", id);
      }
    },
    [update, value]
  );

  return { documents: value, addDocument, deleteDocument, hydrated };
}

// 7. SYSTEM SETTINGS HOOK
export function useSafeNestSettings() {
  const { value, update, hydrated } = useSyncState<SafeNestSettings>(KEYS.settings, DEFAULT_SETTINGS);

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
    [update, value]
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

// RISK SCORES HOOK
export function useRiskScores(logs: CareLog[], moods: MoodEntry[], profile: BabyProfile) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todaysLogs = logs.filter((l) => l.at >= startOfDay.getTime());
  const medsGiven = todaysLogs.filter((l) => l.kind === "medicine");
  const diaperChanges = todaysLogs.filter((l) => l.kind === "diaper");

  let babyScore: "Low" | "Medium" | "High" = "Low";
  let babyReason = "Baby is showing normal, active patterns.";

  const lastMed = logs.find((l) => l.kind === "medicine");
  const lastFed = logs.find((l) => l.kind === "fed");
  const hrsSinceFeed = lastFed ? (Date.now() - lastFed.at) / 3600000 : 24;

  if (medsGiven.length >= 3 && lastMed?.note?.toLowerCase().includes("fever")) {
    babyScore = "High";
    babyReason = "High fever warning: Baby has required 3+ doses of medicine today. Monitor breathing closely.";
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

// DAILY HEALTH SUMMARY HOOK
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