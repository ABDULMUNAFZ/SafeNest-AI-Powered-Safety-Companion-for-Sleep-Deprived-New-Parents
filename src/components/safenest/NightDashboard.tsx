import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Bell, Droplets, Moon, Sparkles, Utensils, Clock, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { averageGapMinutes, timeAgo, useCareLogs, useProfile } from "@/lib/safenest/store";

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

  // Calculate percentage of feed window completed
  const feedPercent = dueIn === null || dueIn <= 0
    ? 100 
    : Math.min(100, Math.round(((feedGap - dueIn) / feedGap) * 100));

  return (
    <section className="space-y-4">
      {/* Rhythm Panel */}
      <div className="glass-card rounded-[2rem] p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Clock & Greeting */}
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              {greeting}, {profile.parentName}
            </p>
            <p className="font-display text-5xl font-black tracking-tight tabular-nums text-foreground sm:text-6xl">
              {now
                ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "--:--"}
            </p>
            <p className="text-xs text-muted-foreground">
              {now ? now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" }) : ""}
            </p>
          </div>

          {/* Schedule Nudge Card */}
          <div className="flex-1 max-w-md rounded-2xl bg-muted/40 p-4 border border-border/50 flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Clock className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <Bell className="size-3.5" /> Next Feed Rhythm
              </p>
              
              <p className="mt-1 text-sm font-semibold text-foreground leading-snug">
                {dueIn === null
                  ? `Tap "Fed" once to start tracking feeding patterns.`
                  : dueIn <= 0
                    ? `${profile.babyName} is due for a feed now.`
                    : `Feed due in about ${dueIn} mins (approx ${Math.round((feedGap / 60) * 10) / 10} hr gap).`}
              </p>

              {/* Progress bar */}
              {dueIn !== null && (
                <div className="mt-2.5 w-full bg-border/40 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-500" 
                    style={{ width: `${feedPercent}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Tiles Grid */}
        <div className="mt-6 grid gap-3 grid-cols-1 sm:grid-cols-3">
          <StatusTile 
            icon={Utensils} 
            label="Last feeding" 
            value={timeAgo(lastOf("fed")?.at)} 
            note={lastOf("fed")?.note}
            tone="text-primary border-primary/10" 
          />
          <StatusTile 
            icon={Moon} 
            label="Last sleep" 
            value={timeAgo(lastOf("slept")?.at)} 
            note={lastOf("slept")?.note}
            tone="text-secondary border-secondary/10" 
          />
          <StatusTile 
            icon={Droplets} 
            label="Last diaper" 
            value={timeAgo(lastOf("diaper")?.at)} 
            note={lastOf("diaper")?.note}
            tone="text-accent border-accent/10" 
          />
        </div>
      </div>

      {/* Navigation Shortcut to full view */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Link
          to="/timeline"
          className="flex min-h-[56px] items-center justify-between rounded-2xl border border-border/60 bg-muted/20 px-5 text-sm font-bold tracking-wide hover:border-primary/50 hover:bg-muted/40 transition-all shadow-sm"
        >
          <span className="flex items-center gap-2.5">
            <Sparkles className="size-4.5 text-accent animate-pulse" /> Today&apos;s Full Health Timeline
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      </motion.div>
    </section>
  );
}

function StatusTile({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: typeof Moon;
  label: string;
  value: string;
  note?: string;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl bg-muted/25 p-4 border border-border/40 flex flex-col justify-between ${tone}`}>
      <div>
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <Icon className="size-3.5" /> {label}
        </p>
        <p className="mt-2 font-display text-xl font-extrabold text-foreground tracking-tight">{value}</p>
      </div>
      {note && (
        <p className="text-[10px] text-muted-foreground mt-1.5 truncate border-t border-border/30 pt-1.5 italic">
          &ldquo;{note}&rdquo;
        </p>
      )}
    </div>
  );
}