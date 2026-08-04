import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Bell, Droplets, Moon, Sparkles, Utensils } from "lucide-react";
import { useEffect, useState } from "react";

import { averageGapMinutes, timeAgo, useCareLogs, useProfile } from "@/lib/nesta/store";

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function NightDashboard() {
  const now = useClock();
  const { logs, lastOf } = useCareLogs();
  const { profile } = useProfile();

  const feedGap = averageGapMinutes(logs, "fed", 150);
  const lastFed = lastOf("fed")?.at;
  const minutesSinceFeed = lastFed ? Math.floor((Date.now() - lastFed) / 60000) : null;
  const dueIn = minutesSinceFeed === null ? null : feedGap - minutesSinceFeed;

  const greeting = !now
    ? "Hello"
    : now.getHours() < 5
      ? "It's a long night"
      : now.getHours() < 12
        ? "Good morning"
        : now.getHours() < 18
          ? "Good afternoon"
          : "Good evening";

  return (
    <section className="space-y-4">
      <div className="glass-card rounded-[2rem] p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {greeting}, {profile.parentName}.
            </p>
            <p className="font-display text-6xl font-bold tabular-nums sm:text-7xl">
              {now
                ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "--:--"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {profile.babyName} · {Math.round(profile.ageMonths)} months · {profile.weightKg} kg
            </p>
          </div>
          <div className="rounded-3xl bg-primary/10 px-5 py-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
              <Bell className="size-4" /> Gentle nudge
            </p>
            <p className="mt-1 max-w-[15rem] text-base font-medium">
              {dueIn === null
                ? `Tap “Fed” once and I'll start learning ${profile.babyName}'s rhythm.`
                : dueIn <= 0
                  ? `${profile.babyName} usually feeds around now — no rush.`
                  : `Next feed likely in about ${dueIn} min (usual gap ${Math.round(feedGap / 60 * 10) / 10} hr).`}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <StatusTile icon={Utensils} label="Last feed" value={timeAgo(lastOf("fed")?.at)} />
          <StatusTile icon={Moon} label="Last sleep" value={timeAgo(lastOf("slept")?.at)} />
          <StatusTile icon={Droplets} label="Last diaper" value={timeAgo(lastOf("diaper")?.at)} />
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Link
          to="/timeline"
          className="flex min-h-[64px] items-center justify-between rounded-3xl border border-border/70 px-6 text-base font-semibold transition hover:border-primary/50"
        >
          <span className="flex items-center gap-3">
            <Sparkles className="size-5 text-accent" /> Tonight&apos;s summary &amp; full timeline
          </span>
          <span className="text-muted-foreground">→</span>
        </Link>
      </motion.div>
    </section>
  );
}

function StatusTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Moon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-muted/40 p-5">
      <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon className="size-4" /> {label}
      </p>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}