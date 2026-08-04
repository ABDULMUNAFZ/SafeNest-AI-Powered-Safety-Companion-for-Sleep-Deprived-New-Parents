import { createFileRoute } from "@tanstack/react-router";
import { 
  AlertTriangle, 
  Calendar, 
  Check, 
  Clock, 
  Heart, 
  Info, 
  Pill, 
  ShieldAlert, 
  ShieldCheck, 
  Volume2 
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/safenest/AppShell";
import { useCareLogs, useProfile } from "@/lib/safenest/store";
import { MEDICINES, lookupDosage, type Medicine } from "@/lib/safenest/dosage";
import { speak } from "@/lib/safenest/speech";

export const Route = createFileRoute("/medicine")({
  head: () => ({
    meta: [
      { title: "Medication & Dosage Safety Center — SafeNest AI" },
      {
        name: "description",
        content: "Calculate safe pediatric dosages based on weight bands and prevent double-dosing with automated scheduling safety checks.",
      },
    ],
  }),
  component: MedicinePage,
});

function MedicinePage() {
  const { profile } = useProfile();
  const { logs, addLog } = useCareLogs();

  const [selectedMedId, setSelectedMedId] = useState(MEDICINES[0]!.id);
  const [weight, setWeight] = useState(profile.weightKg.toString());
  const [age, setAge] = useState(profile.ageMonths.toString());

  const selectedMed = MEDICINES.find((m) => m.id === selectedMedId)!;

  // Run Safety/Dosage Lookup
  const parsedWeight = parseFloat(weight) || 0;
  const parsedAge = parseFloat(age) || 0;

  const result = lookupDosage({
    medicineId: selectedMedId,
    weightKg: parsedWeight,
    ageMonths: parsedAge,
    symptoms: [],
  });

  // Schedule / Double dosing verification
  // Find last dose of this specific medication in logs
  const medicineLogs = logs.filter(
    (l) => l.kind === "medicine" && l.note?.toLowerCase().includes(selectedMed.name.toLowerCase())
  );
  const lastDoseLog = medicineLogs[0];
  const timeSinceLastDoseMs = lastDoseLog ? Date.now() - lastDoseLog.at : null;
  const hoursSinceLastDose = timeSinceLastDoseMs ? timeSinceLastDoseMs / 3600000 : null;

  // Let's set safety checks
  let isDoubleDoseRisk = false;
  let safetyMessage = "";

  if (hoursSinceLastDose !== null) {
    if (selectedMed.id === "paracetamol" && hoursSinceLastDose < 4) {
      isDoubleDoseRisk = true;
      safetyMessage = `Warning: Paracetamol was logged just ${hoursSinceLastDose.toFixed(1)} hours ago. Safe interval is at least 4 hours.`;
    } else if (selectedMed.id === "ibuprofen" && hoursSinceLastDose < 6) {
      isDoubleDoseRisk = true;
      safetyMessage = `Warning: Ibuprofen was logged just ${hoursSinceLastDose.toFixed(1)} hours ago. Safe interval is at least 6 hours.`;
    }
  }

  const handleLogDose = () => {
    if (result.status !== "ok") return;

    if (isDoubleDoseRisk) {
      const confirmForce = window.confirm(
        `${safetyMessage}\n\nAre you sure you want to log another dose? Check with your pediatrician if you are unsure.`
      );
      if (!confirmForce) return;
    }

    const note = `${selectedMed.name} dose given: ${result.band.dose} (calculated weight: ${parsedWeight} kg)`;
    addLog("medicine", note);
    toast.success(`${selectedMed.name} logged`, {
      description: `Dose: ${result.band.dose} logged at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    });
    speak(`${selectedMed.name} dose logged.`);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Title */}
        <section className="glass-card rounded-[2rem] p-6">
          <p className="text-sm uppercase tracking-[0.2em] font-semibold text-primary">Pediatric Safety Suite</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight mt-1">Medicine Center</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Pediatric clinical reference tools to calculate safe infant dosages. AI is never used to compute values. Always cross-reference with your pediatrician.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Calculator Controls */}
          <div className="glass-card rounded-[2rem] p-6 md:col-span-2 space-y-5">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Pill className="size-5 text-primary" /> Active Dosage Calculator
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Select Medication</span>
                <select
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
                >
                  {MEDICINES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Baby Weight (kg)</span>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
                />
              </label>

              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Baby Age (Months)</span>
                <input
                  type="number"
                  step="1"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
                />
              </label>
            </div>

            {/* Safety Double Dosing Warnings */}
            {isDoubleDoseRisk && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-destructive flex items-start gap-3">
                <ShieldAlert className="size-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Double-Dosing Hazard Detected</p>
                  <p className="text-xs text-foreground/80 mt-0.5">{safetyMessage}</p>
                </div>
              </div>
            )}

            {/* Results */}
            {result.status === "ok" ? (
              <div className="rounded-2xl bg-muted/30 p-5 border border-border/50">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Safe Dose Volume</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display text-5xl font-extrabold text-primary">{result.band.dose}</span>
                  <span className="text-xs text-muted-foreground">({result.band.concentration})</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 mt-4 pt-4 border-t border-border/40 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">Interval</span>
                    <span className="font-semibold">{result.band.frequency}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">Max in 24 Hours</span>
                    <span className="font-semibold">{result.band.maxPerDay}</span>
                  </div>
                </div>

                <div className="mt-4 text-xs text-muted-foreground space-y-1 bg-background/60 p-3.5 rounded-xl border border-border/50">
                  <p className="font-bold text-foreground flex items-center gap-1">
                    <ShieldCheck className="size-3.5 text-success" /> Validated reference guidelines
                  </p>
                  {selectedMed.notes.map((note, idx) => (
                    <p key={idx}>• {note}</p>
                  ))}
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={handleLogDose}
                    className="flex-1 flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer"
                  >
                    <Check className="size-4" /> Log Administered Dose
                  </button>
                  <button
                    onClick={() => speak(result.spoken)}
                    className="flex size-11 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all cursor-pointer"
                    title="Speak dosage guidelines"
                  >
                    <Volume2 className="size-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-muted/40 p-5 text-center text-sm border border-border/50">
                <Info className="size-8 text-primary mx-auto opacity-70 mb-2" />
                <p className="font-semibold">Calculation Blocked</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {result.status === "need-info" ? result.spoken : (result as any).reason}
                </p>
              </div>
            )}
          </div>

          {/* Quick Schedule & Safety Library */}
          <div className="space-y-4">
            {/* Last Logged */}
            <div className="glass-card rounded-[2rem] p-6 space-y-3">
              <h3 className="font-display text-base font-bold flex items-center gap-2">
                <Clock className="size-4.5 text-secondary" /> History (24h)
              </h3>
              {medicineLogs.length > 0 ? (
                <div className="space-y-2.5">
                  {medicineLogs.slice(0, 3).map((l) => (
                    <div key={l.id} className="text-xs bg-muted/30 border border-border/40 p-3 rounded-xl">
                      <p className="font-bold">{l.note}</p>
                      <p className="text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="size-3" />
                        {new Date(l.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ({new Date(l.at).toLocaleDateString([], { day: "numeric", month: "short" })})
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-3">No doses logged for this medicine today.</p>
              )}
            </div>

            {/* Concentration Guide */}
            <div className="glass-card rounded-[2rem] p-6 space-y-3">
              <h3 className="font-display text-base font-bold flex items-center gap-2">
                <Info className="size-4.5 text-accent" /> Concentration Check
              </h3>
              <p className="text-xs text-muted-foreground">
                Before dosing, verify the strength on the front of your bottle matches:
              </p>
              <div className="text-xs space-y-2 bg-muted/40 border border-border/50 p-3.5 rounded-xl">
                <div>
                  <span className="font-bold block">Paracetamol (Infant Calpol/Tylenol)</span>
                  <span className="text-primary font-semibold">120 mg per 5 ml</span>
                </div>
                <div className="pt-2 border-t border-border/30">
                  <span className="font-bold block">Ibuprofen (Infant Nurofen/Advil)</span>
                  <span className="text-secondary font-semibold">100 mg per 5 ml</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
