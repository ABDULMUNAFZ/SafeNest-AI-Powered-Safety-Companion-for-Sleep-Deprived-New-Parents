import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  AlertCircle, 
  Baby, 
  CheckCircle, 
  Heart, 
  HelpCircle, 
  MessageSquare, 
  Mic, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle 
} from "lucide-react";
import { useState, useEffect } from "react";

import { AppShell } from "@/components/safenest/AppShell";
import { NightDashboard } from "@/components/safenest/NightDashboard";
import { QuickLog } from "@/components/safenest/QuickLog";
import { 
  useCareLogs, 
  useMoods, 
  useProfile, 
  useRiskScores, 
  useDailySummary, 
  useVaccinations 
} from "@/lib/safenest/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SafeNest AI — Postpartum Companion Dashboard" },
      {
        name: "description",
        content: "Postpartum infant safety logger, validated pediatric dosages, dynamic risk assessments and smart care reminders.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { logs } = useCareLogs();
  const { moods } = useMoods();
  const { profile } = useProfile();
  const { vaccines } = useVaccinations();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const risk = useRiskScores(logs, moods, profile);
  const dailySummary = useDailySummary(logs, moods, profile);

  if (!mounted) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Hydrating dashboard...</p>
        </div>
      </AppShell>
    );
  }

  // Calculate dynamic smart insights based on logs
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayLogs = logs.filter((log) => log.at >= startOfDay.getTime());
  
  const feedsCount = todayLogs.filter((l) => l.kind === "fed").length;
  const sleepsCount = todayLogs.filter((l) => l.kind === "slept").length;
  const waterCount = todayLogs.filter((l) => l.kind === "water").length;

  const insights: string[] = [];

  if (feedsCount > 0 && feedsCount < 3) {
    insights.push(`Feeding frequency: ${feedsCount} feeds logged today. Newborns thrive on 8-12 feeds daily.`);
  } else if (feedsCount >= 5) {
    insights.push(`Feeding patterns: ${feedsCount} feedings logged. Consistent feeding supports active weight gain.`);
  }

  if (sleepsCount < 2) {
    insights.push(`${profile.babyName} has logged shorter sleep windows today. Monitor for signs of over-tiredness.`);
  }

  if (waterCount < 3) {
    insights.push("Hydration: You logged only a few water cups. Nursing mothers need extra hydration.");
  } else {
    insights.push("Hydration: Great job! You are keeping up with your daily hydration goals.");
  }

  const nextVaccine = vaccines.find(v => v.status === "scheduled");
  if (nextVaccine) {
    insights.push(`Preventative Care: Next vaccine due: "${nextVaccine.name}" (${nextVaccine.notes.split(".")[0]}).`);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Urgent Warnings / Critical SOS Banner */}
        {risk.baby.score === "High" && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive flex items-start gap-3 animate-pulse">
            <AlertTriangle className="size-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Critical Health Alert</p>
              <p className="text-xs text-foreground/90 mt-0.5">{risk.baby.reason}</p>
            </div>
          </div>
        )}

        {/* Cardiology-style full width overview */}
        <NightDashboard />

        {/* Responsive Desktop Layout: Split-screen Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main Feed Activity Column (2/3 width on desktop) */}
          <div className="space-y-6 lg:col-span-2">

            {/* Quick Logger Widgets */}
            <section className="space-y-3 bg-white p-6 rounded-2xl border border-border">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-foreground">
                  One-Tap Safety Logger
                </h2>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  Auto-saves to database
                </span>
              </div>
              <QuickLog />
            </section>

            {/* Smart Insights List */}
            {insights.length > 0 && (
              <section className="glass-card rounded-2xl p-6 bg-white border border-border">
                <h3 className="font-display text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 mb-4">
                  <TrendingUp className="size-4.5 text-secondary" /> Smart Rhythm Insights
                </h3>
                <ul className="space-y-3">
                  {insights.map((insight, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground leading-relaxed flex items-start gap-2 bg-muted/20 p-3 rounded-lg border border-border/40">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Sidebar / Profile & Evaluations Column (1/3 width on desktop) */}
          <div className="space-y-6 lg:col-span-1">
            {/* Demographic Profile Card */}
            <section className="glass-card rounded-2xl p-6 bg-white border border-border flex flex-col justify-between min-h-[180px]">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  Infant Profile
                </p>
                <h3 className="font-display text-2xl font-black tracking-tight text-foreground uppercase mt-1">
                  {profile.babyName}
                </h3>
                
                <div className="mt-4 space-y-2 border-t border-border/60 pt-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Age:</span>
                    <span className="font-bold text-foreground">{Math.round(profile.ageMonths)} months</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Weight:</span>
                    <span className="font-bold text-foreground">{profile.weightKg} kg</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Pediatrician:</span>
                    <span className="font-bold text-foreground">{profile.pediatrician}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-border/60 flex flex-col gap-2">
                <Link
                  to="/assistant"
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-all shadow-sm cursor-pointer"
                >
                  <Mic className="size-3.5 animate-bounce" />
                  AI Voice Assistant
                </Link>
                
                <Link
                  to="/profile"
                  className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-xs font-bold text-foreground hover:bg-muted transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  View Clinical Profile
                </Link>
              </div>
            </section>

            {/* Daily Safety Evaluations (Vertical Index List) */}
            <section className="glass-card rounded-2xl p-6 bg-white border border-border">
              <div className="mb-4">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <span className="inline-block size-1.5 bg-primary" /> Evaluation Center
                </p>
                <h2 className="font-display text-lg font-black tracking-tight text-foreground uppercase mt-1">
                  Daily Health Indicators
                </h2>
              </div>

              <div className="divide-y divide-border/60">
                {/* Item 01: Infant Risk Status */}
                <div className="py-4 first:pt-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex gap-2 items-start">
                      <span className="font-display text-base font-black text-muted-foreground tracking-tighter shrink-0 select-none">
                        01
                      </span>
                      <div>
                        <h4 className="font-display text-xs font-extrabold uppercase tracking-tight text-foreground">
                          Baby Clinical Status
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          {risk.baby.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <span className={`rounded px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider border ${
                      risk.baby.score === "High" 
                        ? "bg-destructive/10 text-destructive border-destructive/20" 
                        : risk.baby.score === "Medium"
                          ? "bg-warning/10 text-warning border-warning/20"
                          : "bg-success/10 text-success border-success/20"
                    }`}>
                      {risk.baby.score} RISK
                    </span>
                  </div>
                </div>

                {/* Item 02: Parent Wellbeing Check */}
                <div className="py-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex gap-2 items-start">
                      <span className="font-display text-base font-black text-muted-foreground tracking-tighter shrink-0 select-none">
                        02
                      </span>
                      <div>
                        <h4 className="font-display text-xs font-extrabold uppercase tracking-tight text-foreground">
                          Parent Wellness
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          {risk.parent.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <span className={`rounded px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider border ${
                      risk.parent.score === "High" 
                        ? "bg-destructive/10 text-destructive border-destructive/20" 
                        : risk.parent.score === "Medium"
                          ? "bg-warning/10 text-warning border-warning/20"
                          : "bg-success/10 text-success border-success/20"
                    }`}>
                      {risk.parent.score} STRESS
                    </span>
                  </div>
                </div>

                {/* Item 03: AI Clinical Health Summary */}
                <div className="py-4 last:pb-0">
                  <div className="flex gap-2 items-start">
                    <span className="font-display text-base font-black text-muted-foreground tracking-tighter shrink-0 select-none">
                      03
                    </span>
                    <div>
                      <h4 className="font-display text-xs font-extrabold uppercase tracking-tight text-foreground flex items-center gap-1.5">
                        Clinical Synthesis
                      </h4>
                      <p className="text-[11px] font-semibold text-foreground/95 mt-1 leading-normal">
                        {dailySummary}
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-2.5 flex items-center gap-1">
                        <ShieldCheck className="size-3.5 text-success" /> Generated from logs
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
