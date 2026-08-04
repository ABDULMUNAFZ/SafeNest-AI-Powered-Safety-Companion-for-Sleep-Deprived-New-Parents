import { useCallback, useEffect, useState } from "react";
import { auth as firebaseAuth, db } from "./firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from "firebase/firestore";

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

const isDbConfigured = Boolean(db);

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

// HYBRID SYNC HOOK (Cache First, background sync with Firestore)
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

  // Trigger background remote fetch once user is authenticated
  useEffect(() => {
    if (uid && isDbConfigured && fetchRemote) {
      fetchRemote(uid)
        .then((remoteData) => {
          setValue(remoteData);
          writeLocal(key, remoteData);
        })
        .catch((err) => console.warn("Firestore fetch failed (running offline):", err));
    }
  }, [uid, key, fetchRemote]);

  const update = useCallback(
    async (next: T) => {
      // 1. Optimistic UI update locally
      setValue(next);
      writeLocal(key, next);

      // 2. Write to remote database asynchronously in the background
      if (uid && isDbConfigured && saveRemote) {
        try {
          await saveRemote(uid, next);
        } catch (err) {
          console.error("Firestore sync background write failed:", err);
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
    if (!db) return [];
    try {
      const q = query(
        collection(db, "care_logs"), 
        where("parent_id", "==", uid), 
        orderBy("at", "desc")
      );
      const querySnapshot = await getDocs(q);
      const logs: CareLog[] = [];
      querySnapshot.forEach((doc) => {
        const d = doc.data();
        logs.push({
          id: doc.id,
          kind: d.kind as LogKind,
          at: typeof d.at === "string" ? new Date(d.at).getTime() : d.at,
          note: d.note || undefined
        });
      });
      return logs;
    } catch (e) {
      console.warn("Firestore care_logs query failed, using empty:", e);
      return [];
    }
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

      // Write individual entry to Firestore
      const currentUser = firebaseAuth?.currentUser;
      if (currentUser && db) {
        setDoc(doc(db, "care_logs", entry.id), {
          id: entry.id,
          parent_id: currentUser.uid,
          kind: entry.kind,
          at: entry.at,
          note: entry.note || null
        }).catch((err) => console.error("Firestore care_logs add failed:", err));
      }
    },
    [update, value]
  );

  const deleteLog = useCallback(
    (dl: CareLog) => {
      update(value.filter((l) => l.id !== dl.id));

      const currentUser = firebaseAuth?.currentUser;
      if (currentUser && db) {
        deleteDoc(doc(db, "care_logs", dl.id)).catch((err) => console.error("Firestore care_logs delete failed:", err));
      }
    },
    [update, value]
  );

  const lastOf = useCallback(
    (kind: LogKind) => value.find((l) => l.kind === kind),
    [value]
  );

  return { logs: value, addLog, deleteLog, lastOf, hydrated };
}

// 2. MOOD LOGS HOOK
export function useMoodLogs() {
  const fetchRemote = async (uid: string) => {
    if (!db) return [];
    try {
      const q = query(
        collection(db, "mood_logs"), 
        where("parent_id", "==", uid), 
        orderBy("at", "desc")
      );
      const querySnapshot = await getDocs(q);
      const moods: MoodEntry[] = [];
      querySnapshot.forEach((doc) => {
        const d = doc.data();
        moods.push({
          id: doc.id,
          at: typeof d.at === "string" ? new Date(d.at).getTime() : d.at,
          score: d.score as 1 | 2 | 3 | 4 | 5,
          stressScore: d.stress_score || undefined,
          energyScore: d.energy_score || undefined,
          note: d.note || undefined
        });
      });
      return moods;
    } catch (e) {
      console.warn("Firestore mood_logs query failed, using empty:", e);
      return [];
    }
  };

  const saveRemote = async (uid: string, moods: MoodEntry[]) => {
    // Handled individually inside addMood to prevent massive payloads
  };

  const { value, update, hydrated } = useSyncState<MoodEntry[]>(
    KEYS.moods,
    [],
    fetchRemote,
    saveRemote
  );

  const addMood = useCallback(
    (score: 1 | 2 | 3 | 4 | 5, stressScore?: number, energyScore?: number, note?: string) => {
      const entry: MoodEntry = {
        id: newId(),
        at: Date.now(),
        score,
        ...(stressScore !== undefined ? { stressScore } : {}),
        ...(energyScore !== undefined ? { energyScore } : {}),
        ...(note ? { note } : {}),
      };
      const nextValue = [entry, ...value].slice(0, 100);
      update(nextValue);

      // Write individual entry to Firestore
      const currentUser = firebaseAuth?.currentUser;
      if (currentUser && db) {
        setDoc(doc(db, "mood_logs", entry.id), {
          id: entry.id,
          parent_id: currentUser.uid,
          score: entry.score,
          stress_score: entry.stressScore || null,
          energy_score: entry.energyScore || null,
          note: entry.note || null,
          at: entry.at
        }).catch((err) => console.error("Firestore mood_logs add failed:", err));
      }
    },
    [update, value]
  );

  const lowStreak = value.slice(0, 3).every((m) => m.score <= 2) && value.length >= 3;

  const average = value.length
    ? value.reduce((sum, m) => sum + m.score, 0) / value.length
    : 5;

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
    if (!db) return DEFAULT_PROFILE;
    try {
      const profileDoc = await getDoc(doc(db, "profiles", uid));
      const babyDoc = await getDoc(doc(db, "babies", uid));

      if (!profileDoc.exists() && !babyDoc.exists()) return DEFAULT_PROFILE;

      const profileData = profileDoc.exists() ? profileDoc.data() : null;
      const babyData = babyDoc.exists() ? babyDoc.data() : null;

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
    } catch (e) {
      console.warn("Firestore profile fetch failed, using default:", e);
      return DEFAULT_PROFILE;
    }
  };

  const saveRemote = async (uid: string, next: BabyProfile) => {
    if (!db) return;
    await setDoc(doc(db, "profiles", uid), {
      id: uid,
      parent_name: next.parentName,
      partner_name: next.partnerName,
      partner_phone: next.partnerPhone,
      emergency_number: next.emergencyNumber,
      share_with_partner: next.shareWithPartner,
      updated_at: new Date().toISOString()
    });

    await setDoc(doc(db, "babies", uid), {
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

  return { profile: value, save: update, updateProfile: update, hydrated };
}

// 4. GROWTH RECORDS HOOK
export function useGrowth() {
  const fetchRemote = async (uid: string) => {
    if (!db) return [];
    try {
      const q = query(
        collection(db, "growth_records"), 
        where("baby_id", "==", uid), 
        orderBy("at", "desc")
      );
      const querySnapshot = await getDocs(q);
      const records: GrowthRecord[] = [];
      querySnapshot.forEach((doc) => {
        const d = doc.data();
        records.push({
          id: doc.id,
          at: typeof d.at === "string" ? new Date(d.at).getTime() : d.at,
          ageMonths: d.age_months,
          weightKg: d.weight_kg,
          heightCm: d.height_cm,
          headCircumferenceCm: d.head_circumference_cm || undefined
        });
      });
      return records;
    } catch (e) {
      console.warn("Firestore growth_records query failed:", e);
      return [];
    }
  };

  const saveRemote = async (uid: string, records: GrowthRecord[]) => {
    // Handled individually inside addRecord to prevent massive payloads
  };

  const { value, update, hydrated } = useSyncState<GrowthRecord[]>(
    KEYS.growth,
    [],
    fetchRemote,
    saveRemote
  );

  const addRecord = useCallback(
    async (ageMonths: number, weightKg: number, heightCm: number, headCircumferenceCm?: number) => {
      const entry: GrowthRecord = {
        id: newId(),
        at: Date.now(),
        ageMonths,
        weightKg,
        heightCm,
        ...(headCircumferenceCm !== undefined ? { headCircumferenceCm } : {}),
      };
      const nextValue = [entry, ...value].slice(0, 100);
      update(nextValue);

      // Write individual entry to Firestore
      const currentUser = firebaseAuth?.currentUser;
      if (currentUser && db) {
        await setDoc(doc(db, "growth_records", entry.id), {
          id: entry.id,
          baby_id: currentUser.uid,
          age_months: entry.ageMonths,
          weight_kg: entry.weightKg,
          height_cm: entry.heightCm,
          head_circumference_cm: entry.headCircumferenceCm || null,
          at: entry.at
        }).catch((err) => console.error("Firestore growth_record add failed:", err));
      }
    },
    [update, value]
  );

  const addGrowth = useCallback(
    async (weightKg: number, heightCm: number) => {
      let ageMonths = value.length ? value[0].ageMonths + 1 : 0;
      try {
        const storedProfileStr = localStorage.getItem("safenest.profile");
        if (storedProfileStr) {
          const storedProfile = JSON.parse(storedProfileStr);
          ageMonths = Number(storedProfile.ageMonths) || ageMonths;
        }
      } catch (e) {}

      const entry: GrowthRecord = {
        id: newId(),
        at: Date.now(),
        ageMonths,
        weightKg,
        heightCm,
      };
      const nextValue = [entry, ...value].slice(0, 100);
      update(nextValue);

      // Write individual entry to Firestore
      const currentUser = firebaseAuth?.currentUser;
      if (currentUser && db) {
        await setDoc(doc(db, "growth_records", entry.id), {
          id: entry.id,
          baby_id: currentUser.uid,
          age_months: entry.ageMonths,
          weight_kg: entry.weightKg,
          height_cm: entry.heightCm,
          at: entry.at
        }).catch((err) => console.error("Firestore growth_record add failed:", err));
      }
    },
    [update, value]
  );

  return { growth: value, records: value, addGrowth, addRecord, hydrated };
}

// 5. VACCINATIONS HOOK
export function useVaccines() {
  const fetchRemote = async (uid: string) => {
    if (!db) return [];
    try {
      const q = query(
        collection(db, "vaccinations"), 
        where("baby_id", "==", uid)
      );
      const querySnapshot = await getDocs(q);
      const vaccines: Vaccine[] = [];
      querySnapshot.forEach((doc) => {
        const d = doc.data();
        vaccines.push({
          id: doc.id,
          name: d.name,
          disease: d.disease,
          dueAgeMonths: d.due_age_months,
          status: d.status as "completed" | "scheduled" | "overdue",
          completedAt: d.completed_at ? (typeof d.completed_at === "string" ? new Date(d.completed_at).getTime() : d.completed_at) : undefined,
          notes: d.notes || ""
        });
      });
      return vaccines;
    } catch (e) {
      console.warn("Firestore vaccinations query failed:", e);
      return [];
    }
  };

  const saveRemote = async (uid: string, vaccines: Vaccine[]) => {
    // Handled individually inside toggleVaccine
  };

  const { value, update, hydrated } = useSyncState<Vaccine[]>(
    KEYS.vaccines,
    [],
    fetchRemote,
    saveRemote
  );

  const toggleVaccine = useCallback(
    async (vaccineId: string) => {
      let nextStatus: "completed" | "scheduled" = "scheduled";
      const nextValue = value.map((v) => {
        if (v.id === vaccineId) {
          const isCompleted = v.status === "completed";
          nextStatus = isCompleted ? "scheduled" : "completed";
          return {
            ...v,
            status: nextStatus,
            completedAt: isCompleted ? undefined : Date.now(),
          };
        }
        return v;
      });
      update(nextValue);

      // Update individual vaccine in Firestore
      const currentUser = firebaseAuth?.currentUser;
      if (currentUser && db) {
        await setDoc(doc(db, "vaccinations", vaccineId), {
          status: nextStatus,
          completed_at: nextStatus === "completed" ? Date.now() : null
        }, { merge: true }).catch((err) => console.error("Firestore vaccination update failed:", err));
      }
    },
    [update, value]
  );

  return { vaccines: value, toggleVaccine, hydrated };
}

// 6. DOCUMENTS HOOK
export function useDocuments() {
  const fetchRemote = async (uid: string) => {
    if (!db) return [];
    try {
      const q = query(
        collection(db, "documents"), 
        where("baby_id", "==", uid)
      );
      const querySnapshot = await getDocs(q);
      const docsList: MedicalDocument[] = [];
      querySnapshot.forEach((doc) => {
        const d = doc.data();
        docsList.push({
          id: doc.id,
          name: d.name,
          category: d.category as any,
          uploadedAt: typeof d.uploaded_at === "string" ? new Date(d.uploaded_at).getTime() : d.uploaded_at,
          doctorName: d.doctor_name || undefined,
          fileSize: d.file_size || undefined
        });
      });
      return docsList;
    } catch (e) {
      console.warn("Firestore documents query failed:", e);
      return [];
    }
  };

  const saveRemote = async (uid: string, documents: MedicalDocument[]) => {
    // Handled individually inside add/delete
  };

  const { value, update, hydrated } = useSyncState<MedicalDocument[]>(
    KEYS.documents,
    [],
    fetchRemote,
    saveRemote
  );

  const addDocument = useCallback(
    async (name: string, category: MedicalDocument["category"], doctorName?: string, fileSize?: string) => {
      const docEntry: MedicalDocument = {
        id: newId(),
        name,
        category,
        uploadedAt: Date.now(),
        ...(doctorName ? { doctorName } : {}),
        ...(fileSize ? { fileSize } : {}),
      };
      update([docEntry, ...value]);

      // Write to Firestore
      const currentUser = firebaseAuth?.currentUser;
      if (currentUser && db) {
        await setDoc(doc(db, "documents", docEntry.id), {
          id: docEntry.id,
          baby_id: currentUser.uid,
          name: docEntry.name,
          category: docEntry.category,
          uploaded_at: docEntry.uploadedAt,
          doctor_name: docEntry.doctorName || null,
          file_size: docEntry.fileSize || null
        }).catch((err) => console.error("Firestore document add failed:", err));
      }

      return docEntry;
    },
    [update, value]
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      update(value.filter((d) => d.id !== id));

      if (db) {
        await deleteDoc(doc(db, "documents", id)).catch((err) => console.error("Firestore document delete failed:", err));
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

// Hook aliases for backward compatibility with route components
export { useMoodLogs as useMoods };
export { useVaccines as useVaccinations };
export { useGrowth as useGrowthRecords };
export { useDocuments as useVaultDocuments };