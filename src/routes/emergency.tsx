import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  AlertTriangle, 
  Hospital, 
  Phone, 
  Stethoscope, 
  Users, 
  Copy, 
  ChevronLeft, 
  ShieldAlert, 
  BookOpen,
  ArrowRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

import { clockTime, timeAgo, useCareLogs, useProfile } from "@/lib/safenest/store";
import { speak } from "@/lib/safenest/speech";

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency SOS Mode — SafeNest AI" },
      {
        name: "description",
        content: "One-touch emergency calling, pediatric guides for CPR and choking, and instant copyable baby medical cards for paramedics.",
      },
    ],
  }),
  component: EmergencyPage,
});

function EmergencyPage() {
  const { profile } = useProfile();
  const { logs } = useCareLogs();
  
  const [mounted, setMounted] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<"cpr" | "choking" | "fever" | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const triggerCall = (name: string, phone: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    const isMobile = typeof window !== "undefined" && 
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) {
      e.preventDefault();
      speak(`Simulating emergency call to ${name} at ${phone}.`);
      toast.success(`Calling ${name}...`, {
        description: `Simulated dialer on desktop: ${phone}`,
        duration: 5000
      });
    } else {
      toast.info(`Dialing ${name} (${phone})...`);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading Emergency Center...</p>
      </div>
    );
  }

  const recentMedicine = logs.filter((l) => l.kind === "medicine").slice(0, 3);

  const handleCopySOSCard = () => {
    const lastFeed = logs.find((l) => l.kind === "fed")?.at;
    const lastSleep = logs.find((l) => l.kind === "slept")?.at;
    
    const sosText = `*** SafeNest MEDICAL SOS CARD ***
Baby Name: ${profile.babyName}
Age: ${profile.ageMonths} Months
Weight: ${profile.weightKg} kg
Blood Group: ${profile.bloodGroup}
Allergies: ${profile.allergies}
Last Feed: ${timeAgo(lastFeed)} (${lastFeed ? clockTime(lastFeed) : "No log"})
Last Sleep: ${timeAgo(lastSleep)} (${lastSleep ? clockTime(lastSleep) : "No log"})
Medication History (Last 24h):
${recentMedicine.length ? recentMedicine.map(m => `• ${m.note} at ${clockTime(m.at)}`).join("\n") : "• No meds logged"}
Insurance Provider: ${profile.insuranceName} (${profile.insurancePolicy})
Preferred Hospital: ${profile.hospitalName}`;

    navigator.clipboard.writeText(sosText);
    toast.success("SOS Card Copied!", {
      description: "Send via SMS/iMessage to paramedics or emergency contacts."
    });
    speak("S O S details copied to clipboard.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors pb-16">
      {/* High Contrast Red Warning Header */}
      <header className="bg-destructive text-destructive-foreground py-6 px-5 border-b border-destructive-foreground/10">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1 text-sm font-bold text-destructive-foreground/80 hover:text-destructive-foreground">
            <ChevronLeft className="size-4.5" /> Back
          </Link>
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-5 animate-pulse" />
            <span className="font-display font-extrabold tracking-wide uppercase text-sm">Emergency SOS Mode</span>
          </div>
          <span className="w-10" />
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl space-y-5 px-4 pt-6">
        
        {/* Critical Banner */}
        <section className="bg-destructive/10 border border-destructive/25 rounded-3xl p-5 text-center">
          <AlertTriangle className="mx-auto size-12 text-destructive animate-bounce" />
          <h2 className="font-display text-xl font-extrabold text-destructive mt-2">When to call emergency services</h2>
          <p className="text-xs text-foreground/80 mt-1 max-w-md mx-auto leading-relaxed">
            If your baby is limp, struggling to breathe (flaring nostrils/chest drawing in), bluish lips, or having a fit, dial emergency services immediately.
          </p>
        </section>

        {/* Giant Red Dial Button */}
        <a
          href={`tel:${profile.emergencyNumber}`}
          onClick={(e) => triggerCall("Emergency Services", profile.emergencyNumber, e)}
          className="flex min-h-[96px] items-center justify-center gap-3.5 rounded-[2.0rem] bg-destructive text-white hover:bg-destructive/95 active:scale-98 transition-all shadow-lg text-2xl font-black tracking-wide"
        >
          <Phone className="size-8 animate-pulse" /> Call {profile.emergencyNumber}
        </a>

        {/* Secondary Contact Actions Grid */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          <a
            href={`tel:${profile.pediatricianPhone}`}
            onClick={(e) => triggerCall(profile.pediatrician, profile.pediatricianPhone, e)}
            className="glass-card flex min-h-[80px] items-center gap-4 rounded-2xl px-5 text-base font-bold hover:border-primary/50 transition-all cursor-pointer"
          >
            <Stethoscope className="size-6 text-primary shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Pediatrician</span>
              <p className="truncate">{profile.pediatrician}</p>
            </div>
          </a>
          
          <a
            href={`tel:${profile.partnerPhone}`}
            onClick={(e) => triggerCall(profile.partnerName, profile.partnerPhone, e)}
            className="glass-card flex min-h-[80px] items-center gap-4 rounded-2xl px-5 text-base font-bold hover:border-accent/50 transition-all cursor-pointer"
          >
            <Users className="size-6 text-accent shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Partner</span>
              <p className="truncate">Call {profile.partnerName}</p>
            </div>
          </a>
          
          <a
            href="https://www.google.com/maps/search/hospital+emergency+near+me"
            target="_blank"
            rel="noreferrer"
            className="glass-card flex min-h-[80px] items-center gap-4 rounded-2xl px-5 text-base font-bold hover:border-secondary/50 transition-all cursor-pointer sm:col-span-2"
          >
            <Hospital className="size-6 text-secondary shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Emergency Room</span>
              <p className="truncate">Find Nearest Hospital on Maps</p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </a>
        </div>

        {/* 1. SOS Information Card Generator */}
        <section className="glass-card rounded-[2rem] p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-display text-lg font-bold">Emergency SOS Card</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Quickly share vital stats with first responders.</p>
            </div>
            <button
              onClick={handleCopySOSCard}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/20 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted/40 transition-all cursor-pointer"
            >
              <Copy className="size-3.5" /> Copy Details
            </button>
          </div>

          <dl className="grid gap-3 grid-cols-2 sm:grid-cols-3 bg-muted/20 p-4 rounded-2xl border border-border/40 text-xs">
            <div>
              <dt className="text-muted-foreground uppercase tracking-wide">Baby</dt>
              <dd className="font-bold text-sm mt-0.5">{profile.babyName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground uppercase tracking-wide">Age</dt>
              <dd className="font-bold text-sm mt-0.5">{profile.ageMonths} Months</dd>
            </div>
            <div>
              <dt className="text-muted-foreground uppercase tracking-wide">Weight</dt>
              <dd className="font-bold text-sm mt-0.5">{profile.weightKg} kg</dd>
            </div>
            <div>
              <dt className="text-muted-foreground uppercase tracking-wide">Blood Group</dt>
              <dd className="font-bold text-sm mt-0.5">{profile.bloodGroup}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground uppercase tracking-wide">Last Feed</dt>
              <dd className="font-bold text-sm mt-0.5">{timeAgo(logs.find((l) => l.kind === "fed")?.at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground uppercase tracking-wide">Allergies</dt>
              <dd className="font-bold text-sm mt-0.5 text-destructive truncate" title={profile.allergies}>{profile.allergies}</dd>
            </div>
          </dl>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Medicine Given (Last 24 Hours)</p>
            {recentMedicine.length ? (
              <ul className="mt-2 space-y-1.5">
                {recentMedicine.map((log) => (
                  <li key={log.id} className="rounded-xl bg-muted/40 p-2.5 text-xs border border-border/40 flex justify-between">
                    <span className="font-semibold">{log.note}</span>
                    <span className="text-muted-foreground">{clockTime(log.at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground italic">No medicine logs recorded in the last 24 hours.</p>
            )}
          </div>
        </section>

        {/* 2. Pediatric Emergency Reference Guides */}
        <section className="glass-card rounded-[2rem] p-5 space-y-4">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <BookOpen className="size-5 text-primary" /> First-Aid Reference Guidelines
          </h2>

          <div className="flex gap-2">
            {(["cpr", "choking", "fever"] as const).map((guide) => (
              <button
                key={guide}
                onClick={() => {
                  setSelectedGuide(selectedGuide === guide ? null : guide);
                  speak(
                    guide === "cpr" 
                      ? "If infant is unresponsive, call services. Perform thirty chest compressions, followed by two rescue breaths."
                      : guide === "choking"
                        ? "Perform five back blows between shoulders, then five quick chest thrusts on breastbone."
                        : "For fever in babies under three months, call pediatrician. Do not administer over-the-counter paracetamol."
                  );
                }}
                className={`flex-1 h-9 rounded-xl text-xs font-bold uppercase border transition-all cursor-pointer ${
                  selectedGuide === guide 
                    ? "bg-primary/10 text-primary border-primary/20" 
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {guide === "cpr" ? "Infant CPR" : guide === "choking" ? "Choking" : "High Fever"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {selectedGuide && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-muted/20 border border-border/40 p-4 rounded-2xl text-xs space-y-2 leading-relaxed"
              >
                {selectedGuide === "cpr" && (
                  <>
                    <p className="font-bold text-sm text-foreground">Infant CPR (Under 1 Year Old)</p>
                    <ol className="list-decimal pl-4 space-y-1.5 text-muted-foreground">
                      <li>Check for responsiveness. If limp, tap foot and shout.</li>
                      <li>Call <span className="font-bold text-foreground">{profile.emergencyNumber}</span> immediately if alone or have someone call.</li>
                      <li>Give <strong>30 chest compressions</strong>: Press down 1.5 inches deep using two fingers on the center of the breastbone, at a rate of 100-120/min.</li>
                      <li>Give <strong>2 gentle rescue breaths</strong>: Cover baby&apos;s nose and mouth with your mouth, puff gently just enough to see chest rise.</li>
                      <li>Repeat cycle (30 compressions, 2 breaths) until professional help arrives.</li>
                    </ol>
                  </>
                )}
                {selectedGuide === "choking" && (
                  <>
                    <p className="font-bold text-sm text-foreground">Infant Choking Relief</p>
                    <ol className="list-decimal pl-4 space-y-1.5 text-muted-foreground">
                      <li>Hold baby face-down on your forearm, supporting their chin/head, with head lower than body.</li>
                      <li>Deliver <strong>5 firm back blows</strong> between shoulder blades using the heel of your hand.</li>
                      <li>If object doesn&apos;t dislodge, flip baby face-up, supporting head.</li>
                      <li>Deliver <strong>5 chest thrusts</strong> using two fingers on breastbone, pressing 1.5 inches down.</li>
                      <li>Repeat cycles. Call emergency services immediately if baby turns blue or loses consciousness.</li>
                    </ol>
                  </>
                )}
                {selectedGuide === "fever" && (
                  <>
                    <p className="font-bold text-sm text-foreground">Infant Fever Management</p>
                    <ul className="list-disc pl-4 space-y-1.5 text-muted-foreground">
                      <li><strong>Under 3 Months:</strong> Any rectal/ear reading of 38°C (100.4°F) or higher is a red flag. Immediately visit emergency care. Do not give fever medicine at home without doctor direction.</li>
                      <li><strong>3–6 Months:</strong> Consult pediatrician before administering paracetamol or ibuprofen. Monitor feeds and wet diapers.</li>
                      <li><strong>Safe Dosing:</strong> Always use the oral syringe provided with medicine. Never use kitchen spoons. Refer to the dosage calculator in the Medicine tab.</li>
                    </ul>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <Link
          to="/"
          className="flex min-h-[56px] items-center justify-center rounded-2xl border border-border text-sm font-bold tracking-wide hover:bg-muted/30 transition-all cursor-pointer"
        >
          Exit Emergency Mode
        </Link>
      </div>
    </div>
  );
}