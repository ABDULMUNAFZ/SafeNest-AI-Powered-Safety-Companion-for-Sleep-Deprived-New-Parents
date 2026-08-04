import { createFileRoute } from "@tanstack/react-router";
import { Baby, Droplets, Moon, Pill, Sparkles } from "lucide-react";

import { AppShell } from "@/components/nesta/AppShell";
import { QuickLog } from "@/components/nesta/QuickLog";
import { clockTime, useCareLogs, useMoods, useProfile, type LogKind } from "@/lib/nesta/store";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Baby Care Timeline — NESTA AI" },
      {
        name: "description",
        content:
          "One-tap feeding, sleep, diaper and medicine logs, plus an evening AI summary of your baby's day.",
      },
      { property: "og:title", content: "Baby Care Timeline — NESTA AI" },
      {
        property: "og:description",
        content: "See the whole day at a glance: feeds, sleep, diapers, medicine and mood.",
      },
    ],
  }),
  component: TimelinePage,
});

const META: Record<LogKind, { label: string; icon: typeof Baby; tone: string }> = {
  fed: { label: "Fed", icon: Baby, tone: "text-primary" },
  slept: { label: "Slept", icon: Moon, tone: "text-secondary" },
  diaper: { label: "Diaper changed", icon: Droplets, tone: "text-accent" },
  medicine: { label: "Medicine given", icon: Pill, tone: "text-success" },
  water: { label: "Water", icon: Droplets, tone: "text-secondary" },
};

function partOfDay(at: number) {
  const hour = new Date(at).getHours();
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Night";
}

function TimelinePage() {
  const { logs } = useCareLogs();
  const { moods } = useMoods();
  const { profile } = useProfile();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const today = logs.filter((log) => log.at >= startOfDay.getTime());
  const count = (kind: LogKind) => today.filter((l) => l.kind === kind).length;
  const groups: Array<"Morning" | "Afternoon" | "Night"> = ["Morning", "Afternoon", "Night"];
  const moodToday = moods.find((m) => m.at >= startOfDay.getTime());

  return (
    <AppShell>
      <div className="space-y-5">
        <QuickLog />

        <section className="glass-card rounded-[2rem] p-6">
          <p className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-accent">
            <Sparkles className="size-4" /> Today&apos;s summary
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold">{profile.babyName}&apos;s day</h1>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Feeds" value={count("fed")} />
            <Stat label="Sleeps" value={count("slept")} />
            <Stat label="Diapers" value={count("diaper")} />
            <Stat label="Medicine" value={count("medicine")} />
          </div>
          <p className="mt-5 text-base text-muted-foreground">
            {today.length
              ? `${count("fed")} feeds and ${count("diaper")} diaper changes logged so far. Your mood check-in today: ${
                  moodToday ? `${moodToday.score} / 5` : "not yet — it takes one tap."
                }`
              : "Nothing logged yet today. Tap a card above — it takes one tap and no typing."}
          </p>
        </section>

        <section className="space-y-4">
          {groups.map((group) => {
            const entries = today.filter((log) => partOfDay(log.at) === group);
            return (
              <div key={group} className="glass-card rounded-[2rem] p-6">
                <h2 className="font-display text-xl font-semibold">{group}</h2>
                {entries.length ? (
                  <ol className="mt-4 space-y-3">
                    {entries.map((log) => {
                      const meta = META[log.kind];
                      const Icon = meta.icon;
                      return (
                        <li key={log.id} className="flex items-center gap-4 rounded-2xl bg-muted/40 p-4">
                          <Icon className={`size-6 ${meta.tone}`} />
                          <span className="flex-1 text-lg font-semibold">{meta.label}</span>
                          <span className="tabular-nums text-muted-foreground">{clockTime(log.at)}</span>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Nothing logged in this window.</p>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-muted/40 p-5">
      <p className="font-display text-4xl font-bold">{value}</p>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}