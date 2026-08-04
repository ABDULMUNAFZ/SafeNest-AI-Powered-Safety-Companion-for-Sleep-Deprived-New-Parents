import React, { createContext, useContext, useState, useEffect } from "react";

import { 
  auth, 
  googleProvider, 
  isFirebaseConfigured, 
  loginWithGoogle, 
  logoutUser,
  onAuthStateChanged,
  type User,
  db
} from "./firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  writeBatch,
  collection 
} from "firebase/firestore";

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  onboardingComplete: boolean;
  isDemoMode: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setOnboardingComplete: (complete: boolean) => void;
  submitOnboarding: (
    parentData: {
      parentName: string;
      partnerName: string;
      partnerPhone: string;
      emergencyNumber: string;
      shareWithPartner: boolean;
    },
    babyData: {
      babyName: string;
      birthDate: string;
      ageMonths: number;
      weightKg: number;
      heightCm: number;
      bloodGroup: string;
      allergies: string;
      pediatrician: string;
      pediatricianPhone: string;
      hospitalName: string;
      insuranceName: string;
      insurancePolicy: string;
    }
  ) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// LocalStorage keys for Demo Mode fallback
const DEMO_KEYS = {
  user: "safenest.demo.user",
  onboarded: "safenest.demo.onboarded"
};

export const SafeNestAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Check if Firebase is configured. If not, run in Demo Mode
  const isDemoMode = !isFirebaseConfigured;

  // Listen for Authentication state changes
  useEffect(() => {
    if (!isDemoMode && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const authUser: AuthUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          };
          setUser(authUser);
          
          // Query Supabase to check if this user has finished onboarding
          await checkOnboardingStatus(firebaseUser.uid);
        } else {
          setUser(null);
          setOnboardingComplete(false);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Demo Mode: read auth state from local storage
      const savedUser = localStorage.getItem(DEMO_KEYS.user);
      const savedOnboarded = localStorage.getItem(DEMO_KEYS.onboarded);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setOnboardingComplete(savedOnboarded === "true");
      }
      setLoading(false);
    }
  }, [isDemoMode]);

  // Check onboarding status in Firestore
  const checkOnboardingStatus = async (uid: string) => {
    if (!db) return;
    try {
      const docRef = doc(db, "profiles", uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setOnboardingComplete(true);
      } else {
        setOnboardingComplete(false);
      }
    } catch {
      setOnboardingComplete(false);
    }
  };

  // Sign In with Google
  const signInWithGoogle = async () => {
    setLoading(true);
    if (!isDemoMode) {
      try {
        await loginWithGoogle();
      } catch (err) {
        console.error("Firebase Google Auth Error:", err);
        setLoading(false);
      }
    } else {
      // Demo Mode login simulation
      const mockUser: AuthUser = {
        uid: "demo-user-123",
        email: "sarah.johnson@example.com",
        displayName: "Sarah Johnson",
        photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      };
      setUser(mockUser);
      localStorage.setItem(DEMO_KEYS.user, JSON.stringify(mockUser));
      
      // Check if demo user is onboarded
      const savedOnboarded = localStorage.getItem(DEMO_KEYS.onboarded) === "true";
      setOnboardingComplete(savedOnboarded);
      setLoading(false);
      
      toast.success("Signed in (Demo Mode)");
    }
  };

  // Sign Out
  const signOut = async () => {
    setLoading(true);
    if (!isDemoMode) {
      try {
        await logoutUser();
      } catch (err) {
        console.error("Sign Out Error:", err);
      }
    } else {
      // Demo Mode logout
      localStorage.removeItem(DEMO_KEYS.user);
      localStorage.removeItem(DEMO_KEYS.onboarded);
      setUser(null);
      setOnboardingComplete(false);
      setLoading(false);
      toast.success("Signed out successfully");
    }
  };

  // Helper to wrap a promise in a timeout
  const withTimeout = (promise: Promise<void>, timeoutMs: number, errorMessage: string): Promise<void> => {
    return Promise.race([
      promise,
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      )
    ]);
  };

  // Submit onboarding details and seed historical logs
  const submitOnboarding = async (
    parentData: {
      parentName: string;
      partnerName: string;
      partnerPhone: string;
      emergencyNumber: string;
      shareWithPartner: boolean;
    },
    babyData: {
      babyName: string;
      birthDate: string;
      ageMonths: number;
      weightKg: number;
      heightCm: number;
      bloodGroup: string;
      allergies: string;
      pediatrician: string;
      pediatricianPhone: string;
      hospitalName: string;
      insuranceName: string;
      insurancePolicy: string;
    }
  ) => {
    if (!user) return;

    if (!isDemoMode && db) {
      try {
        const executeOnboarding = async () => {
          // 1. Save Parent Profile in Firestore
          await setDoc(doc(db, "profiles", user.uid), {
            id: user.uid,
            parent_name: parentData.parentName,
            partner_name: parentData.partnerName,
            partner_phone: parentData.partnerPhone,
            emergency_number: parentData.emergencyNumber,
            share_with_partner: parentData.shareWithPartner,
            updated_at: new Date().toISOString(),
          });

          // 2. Save Baby Profile in Firestore
          await setDoc(doc(db, "babies", user.uid), {
            parent_id: user.uid,
            baby_name: babyData.babyName,
            birth_date: babyData.birthDate,
            age_months: babyData.ageMonths,
            weight_kg: babyData.weightKg,
            height_cm: babyData.heightCm,
            blood_group: babyData.bloodGroup,
            allergies: babyData.allergies,
            pediatrician: babyData.pediatrician,
            pediatrician_phone: babyData.pediatricianPhone,
            hospital_name: babyData.hospitalName,
            insurance_name: babyData.insuranceName,
            insurance_policy: babyData.insurancePolicy,
          });

          // 3. Seed historical logs (Last 3 days of records)
          await seedFirestoreLogs(user.uid, babyData.babyName);
        };

        // Wrap the entire onboarding transaction in a 10-second timeout to prevent infinite UI loading state
        await withTimeout(
          executeOnboarding(),
          10000,
          "Database connection timed out. Please check if you have enabled Firestore Database in your Firebase Console and set its rules to test mode."
        );

        setOnboardingComplete(true);
      } catch (err) {
        console.error("Onboarding Database Write Error:", err);
        throw err;
      }
    } else {
      // Demo Mode: save profile and baby details to local storage
      const profileSave = {
        ...parentData,
        ...babyData,
      };
      
      // Update the local storage profile keys directly so SafeNest's hooks see it
      localStorage.setItem("safenest.profile", JSON.stringify(profileSave));
      localStorage.setItem(DEMO_KEYS.onboarded, "true");
      
      // Seed local storage logs
      seedLocalStorageLogs(babyData.babyName);
      
      setOnboardingComplete(true);
    }
  };

  // Seeding engine for Firestore remote database with unique prefixed document IDs
  const seedFirestoreLogs = async (uid: string, babyName: string) => {
    if (!db) return;
    const makeTime = (hoursAgo: number) => Date.now() - hoursAgo * 3600000;
    const batch = writeBatch(db);

    // 1. Care Logs (Diapers, Feedings, Sleep)
    const careLogs = [
      { id: "c_l1", parent_id: uid, kind: "fed", at: makeTime(2), note: "120 ml formula feed" },
      { id: "c_l2", parent_id: uid, kind: "diaper", at: makeTime(3.5), note: "Wet diaper, changed" },
      { id: "c_l3", parent_id: uid, kind: "slept", at: makeTime(5), note: "Slept for 1 hour in cot" },
      { id: "c_l4", parent_id: uid, kind: "fed", at: makeTime(6.5), note: "Breastfeeding, 15 mins" },
      { id: "c_l5", parent_id: uid, kind: "diaper", at: makeTime(8.5), note: "Wet and dirty diaper" },
      { id: "c_l6", parent_id: uid, kind: "slept", at: makeTime(10), note: "Morning nap: 1.5 hours" },
      { id: "c_l7", parent_id: uid, kind: "fed", at: makeTime(12), note: "110 ml formula feed" },
      { id: "c_l8", parent_id: uid, kind: "water", at: makeTime(14), note: "Parent water check: 250ml" },
      { id: "c_l9", parent_id: uid, kind: "fed", at: makeTime(16), note: "Breastfeeding, 12 mins" },
      { id: "c_l10", parent_id: uid, kind: "slept", at: makeTime(22), note: "Overnight sleep stretch" },
      { id: "c_l11", parent_id: uid, kind: "fed", at: makeTime(28), note: "120 ml formula feed" },
      { id: "c_l12", parent_id: uid, kind: "diaper", at: makeTime(32), note: "Wet diaper" },
      { id: "c_l13", parent_id: uid, kind: "slept", at: makeTime(36), note: "Nap time: 45 mins" },
      { id: "c_l14", parent_id: uid, kind: "fed", at: makeTime(52), note: "100 ml formula feed" },
    ];
    careLogs.forEach((log) => {
      const logId = `${uid}_${log.id}`;
      batch.set(doc(db, "care_logs", logId), { ...log, id: logId });
    });

    // 2. Mood Logs
    const moodLogs = [
      { id: "m_l1", parent_id: uid, score: 4, stress_score: 3, energy_score: 6, note: "Feeling okay. Woke up rested.", at: makeTime(4) },
      { id: "m_l2", parent_id: uid, score: 3, stress_score: 5, energy_score: 4, note: "Slightly tired today, baby fussing.", at: makeTime(28) },
      { id: "m_l3", parent_id: uid, score: 4, stress_score: 4, energy_score: 5, note: "Partner took shifts, felt better.", at: makeTime(52) },
    ];
    moodLogs.forEach((log) => {
      const logId = `${uid}_${log.id}`;
      batch.set(doc(db, "mood_logs", logId), { ...log, id: logId });
    });

    // 3. Growth Records
    const growthRecords = [
      { id: "g_r1", baby_id: uid, age_months: 0, weight_kg: 3.2, height_cm: 49.0, at: makeTime(4 * 30 * 24) },
      { id: "g_r2", baby_id: uid, age_months: 2, weight_kg: 5.0, height_cm: 56.5, at: makeTime(2 * 30 * 24) },
      { id: "g_r3", baby_id: uid, age_months: 4, weight_kg: 6.2, height_cm: 62.5, at: makeTime(1) },
    ];
    growthRecords.forEach((log) => {
      const logId = `${uid}_${log.id}`;
      batch.set(doc(db, "growth_records", logId), { ...log, id: logId });
    });

    // 4. Vaccinations Checklist
    const vaccinations = [
      { baby_id: uid, id: "v1", name: "Hepatitis B (HepB) - Dose 1", disease: "Hepatitis B", due_age_months: 0, status: "completed", notes: "Given at birth." },
      { baby_id: uid, id: "v2", name: "Rotavirus (RV) - Dose 1", disease: "Rotavirus diarrhea", due_age_months: 2, status: "completed", notes: "Completed." },
      { baby_id: uid, id: "v3", name: "DTaP - Dose 1", disease: "Diphtheria, Tetanus, Pertussis", due_age_months: 2, status: "completed", notes: "Completed." },
      { baby_id: uid, id: "v4", name: "DTaP - Dose 2", disease: "Diphtheria, Tetanus, Pertussis", due_age_months: 4, status: "completed", notes: "Completed." },
      { baby_id: uid, id: "v5", name: "DTaP - Dose 3", disease: "Diphtheria, Tetanus, Pertussis", due_age_months: 6, status: "scheduled", notes: "Due at 6 months." },
    ];
    vaccinations.forEach((log) => {
      const logId = `${uid}_${log.id}`;
      batch.set(doc(db, "vaccinations", logId), { ...log, id: logId });
    });

    await batch.commit();
  };

  // Seeding engine for LocalStorage fallback
  const seedLocalStorageLogs = (babyName: string) => {
    const makeTimeNum = (hoursAgo: number) => Date.now() - hoursAgo * 3600000;

    const careLogs = [
      { id: "l1", kind: "fed", at: makeTimeNum(2), note: "120 ml formula feed" },
      { id: "l2", kind: "diaper", at: makeTimeNum(3.5), note: "Wet diaper, changed" },
      { id: "l3", kind: "slept", at: makeTimeNum(5), note: "Slept for 1 hour in cot" },
      { id: "l4", kind: "fed", at: makeTimeNum(6.5), note: "Breastfeeding, 15 mins" },
      { id: "l5", kind: "diaper", at: makeTimeNum(8.5), note: "Wet and dirty diaper" },
      { id: "l6", kind: "slept", at: makeTimeNum(10), note: "Morning nap: 1.5 hours" },
      { id: "l7", kind: "fed", at: makeTimeNum(12), note: "110 ml formula feed" },
      { id: "l8", kind: "water", at: makeTimeNum(14), note: "Parent water check: 250ml" },
      { id: "l9", kind: "fed", at: makeTimeNum(16), note: "Breastfeeding, 12 mins" },
      { id: "l10", kind: "slept", at: makeTimeNum(22), note: "Overnight sleep stretch" },
      { id: "l11", kind: "fed", at: makeTimeNum(28), note: "120 ml formula feed" },
      { id: "l12", kind: "diaper", at: makeTimeNum(32), note: "Wet diaper" },
      { id: "l13", kind: "slept", at: makeTimeNum(36), note: "Nap time: 45 mins" },
      { id: "l14", kind: "fed", at: makeTimeNum(52), note: "100 ml formula feed" },
    ];
    localStorage.setItem("safenest.logs", JSON.stringify(careLogs));

    const moodLogs = [
      { id: "m1", score: 4, stressScore: 3, energyScore: 6, note: "Feeling okay. Woke up rested.", at: makeTimeNum(4) },
      { id: "m2", score: 3, stressScore: 5, energyScore: 4, note: "Slightly tired today, baby fussing.", at: makeTimeNum(28) },
      { id: "m3", score: 4, stressScore: 4, energyScore: 5, note: "Partner took shifts, felt better.", at: makeTimeNum(52) },
    ];
    localStorage.setItem("safenest.moods", JSON.stringify(moodLogs));

    const growthRecords = [
      { id: "g1", ageMonths: 0, weightKg: 3.2, heightCm: 49.0, headCircumferenceCm: 34.5, at: makeTimeNum(4 * 30 * 24) },
      { id: "g2", ageMonths: 2, weightKg: 5.0, heightCm: 56.5, headCircumferenceCm: 38.5, at: makeTimeNum(2 * 30 * 24) },
      { id: "g3", ageMonths: 4, weightKg: 6.2, heightCm: 62.5, headCircumferenceCm: 41.5, at: makeTimeNum(1) },
    ];
    localStorage.setItem("safenest.growth", JSON.stringify(growthRecords));

    const vaccinations = [
      { id: "v1", name: "Hepatitis B (HepB) - Dose 1", disease: "Hepatitis B", dueAgeMonths: 0, status: "completed", completedAt: makeTimeNum(4 * 30 * 24), notes: "Given at birth." },
      { id: "v2", name: "Rotavirus (RV) - Dose 1", disease: "Rotavirus diarrhea", dueAgeMonths: 2, status: "completed", completedAt: makeTimeNum(2 * 30 * 24), notes: "Completed." },
      { id: "v3", name: "DTaP - Dose 1", disease: "Diphtheria, Tetanus, Pertussis", dueAgeMonths: 2, status: "completed", completedAt: makeTimeNum(2 * 30 * 24), notes: "Completed." },
      { id: "v4", name: "DTaP - Dose 2", disease: "Diphtheria, Tetanus, Pertussis", dueAgeMonths: 4, status: "completed", completedAt: makeTimeNum(1), notes: "Completed." },
      { id: "v5", name: "DTaP - Dose 3", disease: "Diphtheria, Tetanus, Pertussis", dueAgeMonths: 6, status: "scheduled", notes: "Due at 6 months." },
    ];
    localStorage.setItem("safenest.vaccines", JSON.stringify(vaccinations));
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        onboardingComplete, 
        isDemoMode, 
        signInWithGoogle, 
        signOut, 
        setOnboardingComplete,
        submitOnboarding 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useSafeNestAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useSafeNestAuth must be used within a SafeNestAuthProvider");
  }
  return context;
};
