import { Link } from "@tanstack/react-router";
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

  return (
    <section className="w-full select-none mt-4">
      {/* 6 Gapped Folder-Tab Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 w-full">
        
        {/* Card 1: Infant Profile */}
        <div className="relative h-[112px] w-full group">
          {/* Custom SVG Tab Background Shape */}
          <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full fill-neutral-900 stroke-neutral-800 stroke-[1.5px] drop-shadow-sm transition-colors group-hover:fill-neutral-900/90">
            <path d="M 0,16 A 16,16 0 0,1 16,0 L 100,0 C 115,0 120,20 135,20 L 184,20 A 16,16 0 0,1 200,36 L 200,84 A 16,16 0 0,1 184,100 L 16,100 A 16,16 0 0,1 0,84 Z" />
          </svg>
          {/* Card Content Overlay */}
          <div className="relative z-10 p-4 h-full flex flex-col justify-between text-white">
            <span className="text-[8px] font-black uppercase tracking-wider text-neutral-400">
              Infant Profile
            </span>
            <div className="flex items-center gap-2 mt-1">
              <div className="grid size-6 place-items-center rounded bg-primary text-white font-display font-black text-xs shrink-0">
                {profile.babyName.charAt(0)}
              </div>
              <div className="min-w-0">
                <h4 className="font-display text-[11px] font-black text-white uppercase truncate leading-none">
                  {profile.babyName}
                </h4>
                <p className="text-[7px] text-neutral-400 font-bold uppercase mt-0.5 truncate leading-none">
                  Male, {profile.ageMonths}m · {profile.weightKg}kg
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Active Status */}
        <div className="relative h-[112px] w-full group">
          <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full fill-neutral-900 stroke-neutral-800 stroke-[1.5px] drop-shadow-sm transition-colors group-hover:fill-neutral-900/90">
            <path d="M 0,16 A 16,16 0 0,1 16,0 L 100,0 C 115,0 120,20 135,20 L 184,20 A 16,16 0 0,1 200,36 L 200,84 A 16,16 0 0,1 184,100 L 16,100 A 16,16 0 0,1 0,84 Z" />
          </svg>
          <div className="relative z-10 p-4 h-full flex flex-col justify-between text-white">
            <span className="text-[8px] font-black uppercase tracking-wider text-neutral-400">
              Active Status
            </span>
            <div className="mb-0.5">
              <p className="font-display text-sm font-black text-primary uppercase leading-none mt-1">
                {dueIn === null ? "CALM" : dueIn <= 0 ? "FEED DUE" : `${dueIn}m`}
              </p>
              <p className="text-[8px] text-neutral-400 mt-1 font-bold leading-none">
                Next Feed Rhythm
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Last Feeding */}
        <div className="relative h-[112px] w-full group">
          <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full fill-neutral-900 stroke-neutral-800 stroke-[1.5px] drop-shadow-sm transition-colors group-hover:fill-neutral-900/90">
            <path d="M 0,16 A 16,16 0 0,1 16,0 L 100,0 C 115,0 120,20 135,20 L 184,20 A 16,16 0 0,1 200,36 L 200,84 A 16,16 0 0,1 184,100 L 16,100 A 16,16 0 0,1 0,84 Z" />
          </svg>
          <div className="relative z-10 p-4 h-full flex flex-col justify-between text-white">
            <span className="text-[8px] font-black uppercase tracking-wider text-neutral-400">
              Last Feeding
            </span>
            <div className="mb-0.5">
              <p className="font-display text-sm font-black text-white leading-none mt-1">
                {timeAgo(lastOf("fed")?.at) || "No Record"}
              </p>
              <p className="text-[8px] text-neutral-400 mt-1 font-bold truncate leading-none">
                {lastOf("fed")?.note || "milk"}
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Last Sleep */}
        <div className="relative h-[112px] w-full group">
          <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full fill-neutral-900 stroke-neutral-800 stroke-[1.5px] drop-shadow-sm transition-colors group-hover:fill-neutral-900/90">
            <path d="M 0,16 A 16,16 0 0,1 16,0 L 100,0 C 115,0 120,20 135,20 L 184,20 A 16,16 0 0,1 200,36 L 200,84 A 16,16 0 0,1 184,100 L 16,100 A 16,16 0 0,1 0,84 Z" />
          </svg>
          <div className="relative z-10 p-4 h-full flex flex-col justify-between text-white">
            <span className="text-[8px] font-black uppercase tracking-wider text-neutral-400">
              Last Sleep
            </span>
            <div className="mb-0.5">
              <p className="font-display text-sm font-black text-white leading-none mt-1">
                {timeAgo(lastOf("slept")?.at) || "No Record"}
              </p>
              <p className="text-[8px] text-neutral-400 mt-1 font-bold truncate leading-none">
                {lastOf("slept")?.note || "Slept soundly"}
              </p>
            </div>
          </div>
        </div>

        {/* Card 5: Last Diaper */}
        <div className="relative h-[112px] w-full group">
          <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full fill-neutral-900 stroke-neutral-800 stroke-[1.5px] drop-shadow-sm transition-colors group-hover:fill-neutral-900/90">
            <path d="M 0,16 A 16,16 0 0,1 16,0 L 100,0 C 115,0 120,20 135,20 L 184,20 A 16,16 0 0,1 200,36 L 200,84 A 16,16 0 0,1 184,100 L 16,100 A 16,16 0 0,1 0,84 Z" />
          </svg>
          <div className="relative z-10 p-4 h-full flex flex-col justify-between text-white">
            <span className="text-[8px] font-black uppercase tracking-wider text-neutral-400">
              Last Diaper
            </span>
            <div className="mb-0.5">
              <p className="font-display text-sm font-black text-white leading-none mt-1">
                {timeAgo(lastOf("diaper")?.at) || "No Record"}
              </p>
              <p className="text-[8px] text-neutral-400 mt-1 font-bold truncate leading-none">
                {lastOf("diaper")?.note || "Diaper change"}
              </p>
            </div>
          </div>
        </div>

        {/* Card 6: Clinical Sync */}
        <div className="relative h-[112px] w-full group">
          <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full fill-neutral-900 stroke-neutral-800 stroke-[1.5px] drop-shadow-sm transition-colors group-hover:fill-neutral-900/90">
            <path d="M 0,16 A 16,16 0 0,1 16,0 L 100,0 C 115,0 120,20 135,20 L 184,20 A 16,16 0 0,1 200,36 L 200,84 A 16,16 0 0,1 184,100 L 16,100 A 16,16 0 0,1 0,84 Z" />
          </svg>
          <div className="relative z-10 p-4 h-full flex flex-col justify-between text-white">
            <span className="text-[8px] font-black uppercase tracking-wider text-neutral-400">
              Clinical Sync
            </span>
            <div className="mb-0.5">
              <p className="font-display text-sm font-black text-white leading-none mt-1">
                100%
              </p>
              <p className="text-[8px] text-[#00FF66] font-extrabold uppercase tracking-wider mt-1 leading-none">
                Synced
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}