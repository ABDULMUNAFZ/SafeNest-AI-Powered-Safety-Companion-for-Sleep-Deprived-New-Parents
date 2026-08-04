import { createFileRoute } from "@tanstack/react-router";
import { 
  Baby, 
  Clock, 
  Droplets, 
  Moon, 
  Pill, 
  Sparkles, 
  Trash2, 
  Filter, 
  Calendar 
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/safenest/AppShell";
import { QuickLog } from "@/components/safenest/QuickLog";
import { clockTime, useCareLogs, useMoods, useProfile, type LogKind } from "@/lib/safenest/store";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Baby Care Health Timeline — SafeNest AI" },
      {
        name: "description",
        content: "Track baby feeds, sleep, diaper changes, and medicine schedules in an interactive clinical timeline.",
      },
    ],
  }),
  component: TimelinePage,
});

const META: Record<LogKind, { label: string; icon: typeof Baby; tone: string; bg: string }> = {
  fed: { label: "Fed", icon: Baby, tone: "text-primary", bg: "bg-primary/10 border-primary/20" },
  slept: { label: "Slept", icon: Moon, tone: "text-secondary", bg: "bg-secondary/10 border-secondary/20" },
  diaper: { label: "Diaper Changed", icon: Droplets, tone: "text-accent", bg: "bg-accent/10 border-accent/20" },
  medicine: { label: "Medicine Given", icon: Pill, tone: "text-success", bg: "bg-success/10 border-success/20" },
  water: { label: "Parent Hydration", icon: Droplets, tone: "text-secondary", bg: "bg-secondary/15 border-secondary/20" },
};

function partOfDay(at: number) {
  const hour = new Date(at).getHours();
  if (hour < 5) return "Night";
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  if (hour < 21) return "Evening";
  return "Night";
}

function TimelinePage() {
  const { logs, replace } = useCareLogs();
  const { moods } = useMoods();
  const { profile } = useProfile();
  
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<LogKind | "all">("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  // Filtered logs
  const todayLogs = logs.filter((log) => log.at >= startOfDay.getTime());
  const filteredToday = todayLogs.filter(log => filter === "all" || log.kind === filter);

  const count = (kind: LogKind) => todayLogs.filter((l) => l.kind === kind).length;
  const groups: Array<"Morning" | "Afternoon" | "Evening" | "Night"> = ["Morning", "Afternoon", "Evening", "Night"];
  const moodToday = moods.find((m) => m.at >= startOfDay.getTime());

  const handleDeleteLog = (id: string) => {
    const nextLogs = logs.filter(l => l.id !== id);
    replace(nextLogs);
    toast.success("Log entry removed", {
      description: "Care record deleted successfully."
    });
  };

  if (!mounted) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Hydrating timeline...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        
        {/* Quick Log Widget at top */}
        <section className="space-y-2.5">
          <h2 className="font-display text-base font-bold">New Entry</h2>
          <QuickLog />
        </section>

        {/* Today's Counts Summary */}
        <section className="glass-card rounded-[2rem] p-6 border-border/60">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-accent">
            <Sparkles className="size-4 animate-pulse" /> Daily Clinical Metrics
          </div>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
            {profile.babyName}&apos;s Day
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log activity stats on {new Date().toLocaleDateString([], { day: "numeric", month: "long" })}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Feedings" value={count("fed")} icon={Baby} tone="text-primary bg-primary/5" />
            <Stat label="Naps" value={count("slept")} icon={Moon} tone="text-secondary bg-secondary/5" />
            <Stat label="Diapers" value={count("diaper")} icon={Droplets} tone="text-accent bg-accent/5" />
            <Stat label="Medications" value={count("medicine")} icon={Pill} tone="text-success bg-success/5" />
          </div>
        </section>

        {/* Filter Categories Bar */}
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
            <Filter className="size-3.5" /> Filter Timeline
          </div>
          
          <div className="flex flex-wrap gap-1.5 justify-end">
            {(["all", "fed", "slept", "diaper", "medicine"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase border transition-all cursor-pointer ${
                  filter === cat 
                    ? "bg-primary/10 text-primary border-primary/20" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat === "all" ? "Show All" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Vertical timeline grouped by part of day */}
        <section className="space-y-4">
          {groups.map((group) => {
            const entries = filteredToday.filter((log) => partOfDay(log.at) === group);
            if (!entries.length) return null;

            return (
              <div key={group} className="glass-card rounded-[2rem] p-6 border-border/40">
                <h2 className="font-display text-lg font-bold tracking-tight text-foreground border-b border-border/40 pb-2 mb-4">
                  {group}
                </h2>
                
                <div className="relative pl-4 border-l border-border/60 ml-2 space-y-4">
                  {entries.map((log) => {
                    const meta = META[log.kind];
                    const Icon = meta.icon;
                    return (
                      <div key={log.id} className="relative flex items-start gap-4">
                        {/* Dot indicator */}
                        <div className="absolute -left-[27px] top-1.5 grid size-5 place-items-center rounded-full bg-background border-2 border-border/80">
                          <span className={`size-1.5 rounded-full ${meta.tone} bg-current`} />
                        </div>

                        {/* Event Card */}
                        <div className="flex-1 rounded-2xl bg-muted/20 border border-border/40 p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`grid size-9 shrink-0 place-items-center rounded-xl border ${meta.bg}`}>
                              <Icon className={`size-4.5 ${meta.tone}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground text-sm">{meta.label}</span>
                                <span className="text-[10px] text-muted-foreground font-semibold">
                                  {clockTime(log.at)}
                                </span>
                              </div>
                              {log.note && (
                                <p className="text-xs text-muted-foreground mt-1 italic leading-normal">
                                  &ldquo;{log.note}&rdquo;
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="rounded-lg p-2 border border-border text-muted-foreground hover:bg-destructive/15 hover:text-destructive hover:border-destructive/30 transition-all cursor-pointer"
                            title="Delete log entry"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredToday.length === 0 && (
            <div className="rounded-[2rem] bg-muted/20 p-8 text-center text-sm border border-border/50">
              <Calendar className="size-8 text-primary mx-auto opacity-70 mb-2" />
              <p className="font-semibold">Timeline Empty</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                No logs fit the selected filter for today.
              </p>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ 
  label, 
  value, 
  icon: Icon,
  tone 
}: { 
  label: string; 
  value: number; 
  icon: typeof Baby;
  tone: string 
}) {
  return (
    <div className={`rounded-2xl border border-border/40 p-4 ${tone}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{label}</span>
        <Icon className="size-4 opacity-75" />
      </div>
      <p className="font-display text-3xl font-black mt-2 text-foreground tracking-tight">{value}</p>
    </div>
  );
}