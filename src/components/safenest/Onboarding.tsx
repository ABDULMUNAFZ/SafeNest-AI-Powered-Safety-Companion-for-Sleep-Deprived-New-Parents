import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Baby, 
  Heart, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Loader2, 
  ShieldCheck, 
  Clock, 
  HeartHandshake,
  ShieldAlert
} from "lucide-react";
import { toast } from "sonner";

import { useSafeNestAuth } from "@/lib/safenest/auth-context";

export const Onboarding: React.FC = () => {
  const { user, signInWithGoogle, submitOnboarding, isDemoMode } = useSafeNestAuth();
  
  const [step, setStep] = useState<"login" | "parent" | "baby">("login");
  const [submitting, setSubmitting] = useState(false);

  // Parent form state
  const [parentName, setParentName] = useState(user?.displayName || "");
  const [partnerName, setPartnerName] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");
  const [emergencyNumber, setEmergencyNumber] = useState("911");
  const [shareWithPartner, setShareWithPartner] = useState(true);

  // Baby form state
  const [babyName, setBabyName] = useState("");
  const [birthDate, setBirthDate] = useState("2026-04-04");
  const [weightKg, setWeightKg] = useState("6.2");
  const [heightCm, setHeightCm] = useState("62.5");
  const [bloodGroup, setBloodGroup] = useState("O Positive (O+)");
  const [allergies, setAllergies] = useState("No known allergies");
  const [pediatrician, setPediatrician] = useState("Dr. Meera Rao");
  const [pediatricianPhone, setPediatricianPhone] = useState("+15550102");
  const [hospitalName, setHospitalName] = useState("Mayo Pediatric Care Clinic");
  const [insuranceName, setInsuranceName] = useState("Aetna Health Premium");
  const [insurancePolicy, setInsurancePolicy] = useState("POL-0987-A12");

  // Sync parent name when user logs in
  React.useEffect(() => {
    if (user) {
      setParentName(user.displayName || "");
      setStep("parent");
    } else {
      setStep("login");
    }
  }, [user]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "parent") {
      if (!parentName.trim()) {
        toast.error("Please enter your name.");
        return;
      }
      setStep("baby");
    }
  };

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!babyName.trim()) {
      toast.error("Please enter your baby's name.");
      return;
    }

    setSubmitting(true);
    toast.info("Initializing SafeNest space...", { description: "Seeding 3–5 days of logs and metrics..." });

    try {
      // Calculate age in months based on Date of birth
      const dob = new Date(birthDate);
      const diffMs = Date.now() - dob.getTime();
      const diffMonths = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.4)));

      await submitOnboarding(
        {
          parentName: parentName.trim(),
          partnerName: partnerName.trim() || "Partner",
          partnerPhone: partnerPhone.trim() || "+15550103",
          emergencyNumber,
          shareWithPartner,
        },
        {
          babyName: babyName.trim(),
          birthDate,
          ageMonths: diffMonths || 4,
          weightKg: parseFloat(weightKg) || 6.2,
          heightCm: parseFloat(heightCm) || 62.5,
          bloodGroup,
          allergies: allergies.trim() || "No known allergies",
          pediatrician: pediatrician.trim() || "Dr. Meera Rao",
          pediatricianPhone: pediatricianPhone.trim() || "+15550102",
          hospitalName: hospitalName.trim() || "Mayo Pediatric Care Clinic",
          insuranceName: insuranceName.trim() || "Aetna Health Premium",
          insurancePolicy: insurancePolicy.trim() || "POL-0987-A12",
        }
      );

      toast.success("SafeNest configured successfully", {
        description: "Welcome to your postpartum safety companion!"
      });
    } catch (err) {
      console.error("Onboarding failed:", err);
      toast.error("Setup failed. Please check database permissions or try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden transition-all duration-300">
      
      {/* Background Calm Aura Halo */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[480px] opacity-45"
        style={{ background: "var(--gradient-halo)" }}
      />

      <AnimatePresence mode="wait">
        
        {/* LOGIN VIEW */}
        {step === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md glass-card rounded-[2.5rem] p-8 text-center space-y-6 relative z-10"
          >
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Baby className="size-9 animate-pulse" />
            </div>

            <div>
              <h1 className="font-display text-4xl font-black tracking-tight">SafeNest</h1>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary mt-1">Postpartum Safety Companion</p>
              <p className="text-xs text-muted-foreground mt-3 max-w-xs mx-auto leading-relaxed">
                Specifically engineered for sleep-deprived parents. Reduce cognitive load, manage medicine safely, and connect with pediatrician channels.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid gap-3 text-left pt-2">
              <FeatureItem 
                icon={ShieldCheck} 
                title="Validated Dosage Guidelines" 
                desc="Calculated strictly on age/weight. AI is never used to compute doses." 
              />
              <FeatureItem 
                icon={Clock} 
                title="Rhythm Learning Alerts" 
                desc="Nudges you based on baby's historical feed gaps, preventing sleep exhaustion." 
              />
              <FeatureItem 
                icon={HeartHandshake} 
                title="EPDS Wellbeing Journal" 
                desc="Spot stress triggers early with guided breathing modules and partner shifts." 
              />
            </div>

            {isDemoMode && (
              <div className="rounded-xl border border-warning/20 bg-warning/5 p-3 text-xs text-warning flex items-start gap-2">
                <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                <p className="text-[10px] text-left">
                  Demo Mode: Remote keys not configured. Clicking Login will instantly log you in locally.
                </p>
              </div>
            )}

            <button
              onClick={signInWithGoogle}
              className="w-full flex h-12 items-center justify-center gap-3 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition-all shadow-md cursor-pointer text-sm"
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Sign in with Google Account
            </button>
          </motion.div>
        )}

        {/* STEP 1: PARENT DETAILS FORM */}
        {step === "parent" && (
          <motion.div
            key="parent"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-lg glass-card rounded-[2.5rem] p-8 space-y-6 relative z-10"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Onboarding: Step 1 of 2</p>
                <h2 className="font-display text-2xl font-extrabold tracking-tight mt-0.5">Parent Details</h2>
              </div>
              <span className="text-xs text-muted-foreground font-semibold">Setup profile</span>
            </div>

            <form onSubmit={handleNextStep} className="space-y-4">
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Your Full Name</span>
                <input
                  type="text"
                  required
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="e.g. Sarah Johnson"
                  className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none font-semibold text-foreground"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Partner Name</span>
                  <input
                    type="text"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="e.g. David"
                    className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Partner Phone</span>
                  <input
                    type="tel"
                    value={partnerPhone}
                    onChange={(e) => setPartnerPhone(e.target.value)}
                    placeholder="e.g. +15550103"
                    className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Local Emergency Contact (e.g. 911 / 108)</span>
                <input
                  type="text"
                  required
                  value={emergencyNumber}
                  onChange={(e) => setEmergencyNumber(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none font-semibold text-foreground"
                />
              </label>

              <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/30 p-4 border border-border/40">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs">Share Wellbeing Nudges</p>
                  <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">
                    Allow SafeNest to send a gentle notification to your partner if your energy score stays low for 3 days.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={shareWithPartner}
                  onChange={(e) => setShareWithPartner(e.target.checked)}
                  className="size-4.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full flex h-12 items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition-all cursor-pointer text-sm shadow-md"
              >
                Continue to Baby Setup <ArrowRight className="size-4" />
              </button>
            </form>
          </motion.div>
        )}

        {/* STEP 2: BABY DETAILS FORM */}
        {step === "baby" && (
          <motion.div
            key="baby"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-lg glass-card rounded-[2.5rem] p-8 space-y-6 relative z-10 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Onboarding: Step 2 of 2</p>
                <h2 className="font-display text-2xl font-extrabold tracking-tight mt-0.5">Baby Demographics</h2>
              </div>
              <button 
                onClick={() => setStep("parent")}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-bold border border-border/60 bg-muted/20 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
              >
                <ArrowLeft className="size-3.5" /> Back
              </button>
            </div>

            <form onSubmit={handleCompleteSetup} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Baby Name</span>
                  <input
                    type="text"
                    required
                    value={babyName}
                    onChange={(e) => setBabyName(e.target.value)}
                    placeholder="e.g. Aria"
                    className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none font-semibold text-foreground"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Birth Date</span>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Weight (kg)</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Height (cm)</span>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Blood Group</span>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
                  >
                    <option value="O Positive (O+)">O+</option>
                    <option value="O Negative (O-)">O-</option>
                    <option value="A Positive (A+)">A+</option>
                    <option value="A Negative (A-)">A-</option>
                    <option value="B Positive (B+)">B+</option>
                    <option value="B Negative (B-)">B-</option>
                    <option value="AB Positive (AB+)">AB+</option>
                    <option value="AB Negative (AB-)">AB-</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Allergies</span>
                <input
                  type="text"
                  required
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
                />
              </label>

              <div className="pt-2 border-t border-border/40">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-3">Healthcare &amp; Insurance Provider</p>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Pediatrician Name</span>
                    <input
                      type="text"
                      value={pediatrician}
                      onChange={(e) => setPediatrician(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Pediatrician Phone</span>
                    <input
                      type="tel"
                      value={pediatricianPhone}
                      onChange={(e) => setPediatricianPhone(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
                    />
                  </label>
                </div>

                <label className="block mt-3.5">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Preferred Hospital</span>
                  <input
                    type="text"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2 mt-3.5">
                  <label className="block">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Insurance Provider</span>
                    <input
                      type="text"
                      value={insuranceName}
                      onChange={(e) => setInsuranceName(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Policy / ID Number</span>
                    <input
                      type="text"
                      value={insurancePolicy}
                      onChange={(e) => setInsurancePolicy(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex h-12 items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition-all disabled:opacity-70 cursor-pointer text-sm shadow-md"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Seeding clinical workspace...
                  </>
                ) : (
                  <>
                    <Check className="size-4" /> Complete SafeNest Setup
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

const FeatureItem: React.FC<{ icon: React.FC<any>; title: string; desc: string }> = ({ icon: Icon, title, desc }) => (
  <div className="flex gap-3 bg-muted/20 border border-border/40 p-3 rounded-2xl">
    <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
      <Icon className="size-4.5" />
    </div>
    <div>
      <h3 className="text-xs font-bold text-foreground leading-normal">{title}</h3>
      <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
    </div>
  </div>
);
