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
  Calendar,
  ArrowUpRight
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
  const { logs, deleteLog } = useCareLogs();
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
    const logToDelete = logs.find(l => l.id === id);
    if (logToDelete) {
      deleteLog(logToDelete);
      toast.success("Log entry removed", {
        description: "Care record deleted successfully."
      });
    }
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

        {/* Today's Counts Summary Mockup Cards */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-black tracking-tight uppercase">
                {profile.babyName}&apos;s Day
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Log activity stats on {new Date().toLocaleDateString([], { day: "numeric", month: "long" })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Feedings" value={count("fed")} icon={Baby} variant="lime" />
            <Stat label="Sleep Naps" value={count("slept")} icon={Moon} variant="purple" />
            <Stat label="Diapers" value={count("diaper")} icon={Droplets} variant="yellow" />
            <Stat label="Medicines" value={count("medicine")} icon={Pill} variant="white" />
          </div>
        </section>

        {/* Filter Categories Bar */}
        <div className="flex items-center justify-between border-b border-border/50 pb-2 mt-4">
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
                    ? "bg-neutral-950 text-white border-neutral-900" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat === "all" ? "Show All" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Vertical timeline grouped by part of day */}
        <section className="space-y-6">
          {groups.map((group) => {
            const entries = filteredToday.filter((log) => partOfDay(log.at) === group);
            if (!entries.length) return null;

            return (
              <div key={group} className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="grid size-5 place-items-center rounded-full bg-neutral-950 text-[#d4fc34] text-[9px] font-black">
                    {entries.length}
                  </span>
                  <h2 className="font-display text-sm font-black tracking-tight text-foreground uppercase">
                    {group} Activities
                  </h2>
                </div>
                
                <div className="relative pl-4 border-l border-neutral-200 ml-2.5 space-y-3">
                  {entries.map((log) => {
                    const meta = META[log.kind];
                    const Icon = meta.icon;
                    return (
                      <div key={log.id} className="relative flex items-start gap-4">
                        {/* Dot indicator */}
                        <div className="absolute -left-[27px] top-1.5 grid size-5 place-items-center rounded-full bg-background border border-neutral-300">
                          <span className={`size-1.5 rounded-full ${meta.tone} bg-current`} />
                        </div>

                        {/* Event Card (mockup list item style) */}
                        <div className="flex-1 rounded-[1.5rem] bg-white border border-neutral-200 p-4 flex items-center justify-between gap-4 shadow-sm hover:border-neutral-300 transition-all">
                          <div className="flex items-start gap-3">
                            <div className={`grid size-9 shrink-0 place-items-center rounded-xl border ${meta.bg} mt-0.5`}>
                              <Icon className={`size-4.5 ${meta.tone}`} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-extrabold text-neutral-950 text-sm">{meta.label}</span>
                                <span className="bg-neutral-100 text-neutral-600 border border-neutral-200 text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full">
                                  {clockTime(log.at)}
                                </span>
                              </div>
                              {log.note && (
                                <p className="text-xs text-muted-foreground mt-1.5 italic leading-normal">
                                  &ldquo;{log.note}&rdquo;
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="rounded-full p-2 border border-neutral-200 text-neutral-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all cursor-pointer shrink-0"
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
            <div className="rounded-[2rem] bg-white p-8 text-center text-sm border border-neutral-200 shadow-sm">
              <Calendar className="size-8 text-primary mx-auto opacity-70 mb-2" />
              <p className="font-semibold text-neutral-950">Timeline Empty</p>
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
  variant
}: { 
  label: string; 
  value: number; 
  icon: typeof Baby;
  variant: "lime" | "purple" | "yellow" | "white"
}) {
  const bgClass = 
    variant === "lime" ? "bg-[#d4fc34] text-neutral-950 border-neutral-950" :
    variant === "purple" ? "bg-[#c084fc] text-neutral-950 border-neutral-950" :
    variant === "yellow" ? "bg-[#fef08a] text-neutral-950 border-neutral-950" :
    "bg-white text-neutral-950 border-neutral-200";

  return (
    <div className={`relative border rounded-[1.5rem] rounded-tr-none p-5 flex flex-col justify-between min-h-[116px] shadow-sm overflow-hidden ${bgClass}`}>
      {/* Top right diagonal arrow circle */}
      <div className="absolute top-2.5 right-2.5 size-6 rounded-full bg-neutral-950 text-white flex items-center justify-center border border-neutral-800">
        <ArrowUpRight className="size-3" />
      </div>

      <div className="flex flex-col">
        <span className="text-[9px] font-black uppercase tracking-wider opacity-80">{label}</span>
        <p className="font-display text-3xl font-black mt-2 tracking-tighter leading-none">{value}</p>
      </div>

      <div className="flex items-center gap-1 mt-2">
        <Icon className="size-3.5 opacity-60" />
        <span className="text-[8px] font-bold uppercase tracking-wide opacity-60">TODAY</span>
      </div>
    </div>
  );
}