import { useCallback, useEffect, useState } from "react";

export type LogKind = "fed" | "slept" | "diaper" | "medicine" | "water";

export type CareLog = {
  id: string;
  kind: LogKind;
  at: number;
  note?: string;
};

export type MoodEntry = { id: string; at: number; score: 1 | 2 | 3 | 4 | 5; note?: string };

export type BabyProfile = {
  babyName: string;
  parentName: string;
  ageMonths: number;
  weightKg: number;
  allergies: string;
  bloodGroup: string;
  pediatrician: string;
  pediatricianPhone: string;
  partnerName: string;
  partnerPhone: string;
  emergencyNumber: string;
  shareWithPartner: boolean;
};

export const DEFAULT_PROFILE: BabyProfile = {
  babyName: "Baby",
  parentName: "Parent",
  ageMonths: 4,
  weightKg: 6,
  allergies: "None known",
  bloodGroup: "Unknown",
  pediatrician: "Dr. Meera Rao",
  pediatricianPhone: "+15550102",
  partnerName: "Partner",
  partnerPhone: "+15550103",
  emergencyNumber: "911",
  shareWithPartner: true,
};

const KEYS = {
  logs: "nesta.logs",
  moods: "nesta.moods",
  profile: "nesta.profile",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("nesta:store", { detail: key }));
  } catch {
    /* storage unavailable — session still works in memory */
  }
}

function usePersisted<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(read<T>(key, fallback));
    setHydrated(true);
    const sync = () => setValue(read<T>(key, fallback));
    window.addEventListener("nesta:store", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("nesta:store", sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

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
  const { value, update, hydrated } = usePersisted<CareLog[]>(KEYS.logs, []);

  const addLog = useCallback(
    (kind: LogKind, note?: string) => {
      const entry: CareLog = { id: newId(), kind, at: Date.now(), ...(note ? { note } : {}) };
      update([entry, ...value].slice(0, 400));
      return entry;
    },
    [update, value],
  );

  const lastOf = useCallback((kind: LogKind) => value.find((l) => l.kind === kind), [value]);

  return { logs: value, addLog, lastOf, hydrated, replace: update };
}

export function useMoods() {
  const { value, update, hydrated } = usePersisted<MoodEntry[]>(KEYS.moods, []);

  const addMood = useCallback(
    (score: MoodEntry["score"], note?: string) => {
      const entry: MoodEntry = { id: newId(), at: Date.now(), score, ...(note ? { note } : {}) };
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

  return { moods: value, addMood, lowStreak, average, hydrated };
}

export function useProfile() {
  const { value, update, hydrated } = usePersisted<BabyProfile>(KEYS.profile, DEFAULT_PROFILE);
  const save = useCallback(
    (patch: Partial<BabyProfile>) => update({ ...value, ...patch }),
    [update, value],
  );
  return { profile: { ...DEFAULT_PROFILE, ...value }, save, hydrated };
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

/** Learns the parent's real rhythm from history instead of a fixed reminder. */
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