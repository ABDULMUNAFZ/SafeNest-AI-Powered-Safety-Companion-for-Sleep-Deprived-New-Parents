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
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive flex items-start gap-3 animate-pulse">
            <AlertTriangle className="size-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Critical Health Alert</p>
              <p className="text-xs text-foreground/90 mt-0.5">{risk.baby.reason}</p>
            </div>
          </div>
        )}

        {/* Dashboard Demographics Header */}
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Dashboard
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Caring for <span className="font-bold text-foreground">{profile.babyName}</span> · {Math.round(profile.ageMonths)} months · {profile.weightKg} kg
            </p>
          </div>

          <Link
            to="/assistant"
            className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/95 transition-all shadow-md cursor-pointer"
          >
            <Mic className="size-4 animate-bounce" />
            AI Voice Assistant
          </Link>
        </section>

        {/* 1. Clinical Safety Center (Risk Scores) */}
        <section className="grid gap-4 sm:grid-cols-2">
          {/* Baby Status Card */}
          <div className="glass-card rounded-[2.0rem] p-5 flex flex-col justify-between border-border/60">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Infant Risk Score</p>
                <h3 className="font-display text-lg font-bold text-foreground mt-0.5">
                  {profile.babyName}&apos;s Status
                </h3>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
                risk.baby.score === "High" 
                  ? "bg-destructive/15 text-destructive" 
                  : risk.baby.score === "Medium"
                    ? "bg-warning/15 text-warning"
                    : "bg-success/15 text-success"
              }`}>
                {risk.baby.score} Risk
              </span>
            </div>
            
            <div className="mt-4 flex gap-3 items-start bg-muted/20 p-3.5 rounded-xl border border-border/40">
              {risk.baby.score === "Low" ? (
                <ShieldCheck className="size-5 shrink-0 text-success mt-0.5" />
              ) : (
                <AlertCircle className="size-5 shrink-0 text-warning mt-0.5" />
              )}
              <p className="text-xs text-muted-foreground leading-normal">
                {risk.baby.reason}
              </p>
            </div>
          </div>

          {/* Parent Stress Card */}
          <div className="glass-card rounded-[2.0rem] p-5 flex flex-col justify-between border-border/60">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Postnatal Wellbeing</p>
                <h3 className="font-display text-lg font-bold text-foreground mt-0.5">
                  {profile.parentName}&apos;s Wellness
                </h3>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
                risk.parent.score === "High" 
                  ? "bg-destructive/15 text-destructive" 
                  : risk.parent.score === "Medium"
                    ? "bg-warning/15 text-warning"
                    : "bg-success/15 text-success"
              }`}>
                {risk.parent.score} Stress
              </span>
            </div>

            <div className="mt-4 flex gap-3 items-start bg-muted/20 p-3.5 rounded-xl border border-border/40">
              <Heart className={`size-5 shrink-0 mt-0.5 ${
                risk.parent.score === "Low" ? "text-success" : "text-warning"
              }`} />
              <p className="text-xs text-muted-foreground leading-normal">
                {risk.parent.reason}
              </p>
            </div>
          </div>
        </section>

        {/* 2. AI Daily Health Summary */}
        <section className="glass-card rounded-[2rem] p-6 border-primary/20 relative overflow-hidden bg-gradient-calm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="size-4 animate-pulse" />
            AI Daily Health Summary
          </div>
          <p className="mt-3 text-sm text-foreground/90 font-medium leading-relaxed">
            {dailySummary}
          </p>
          <div className="mt-4 text-[10px] text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-success" />
            Clinical analysis generated from verified caregiver logs.
          </div>
        </section>

        {/* 3. Quick Logger Widgets */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-foreground">One-Tap Safety Logger</h2>
            <span className="text-xs text-muted-foreground font-medium">Auto-saves with sound</span>
          </div>
          <QuickLog />
        </section>

        {/* 4. Schedule & Rhythm Indicators */}
        <NightDashboard />

        {/* 5. Smart Insights List */}
        {insights.length > 0 && (
          <section className="glass-card rounded-[2rem] p-6">
            <h3 className="font-display text-base font-bold flex items-center gap-2 mb-4">
              <TrendingUp className="size-4.5 text-secondary" /> Smart Rhythm Insights
            </h3>
            <ul className="space-y-3">
              {insights.map((insight, idx) => (
                <li key={idx} className="text-xs text-muted-foreground leading-relaxed flex items-start gap-2 bg-muted/20 p-3 rounded-xl border border-border/40">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

      </div>
    </AppShell>
  );
}
