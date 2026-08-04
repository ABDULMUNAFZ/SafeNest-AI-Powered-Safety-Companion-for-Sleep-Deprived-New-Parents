import { Link, useRouterState } from "@tanstack/react-router";
import { 
  Baby, 
  Clock, 
  HeartHandshake, 
  MessageCircleHeart, 
  Siren, 
  Users, 
  Activity,
  Wifi,
  WifiOff
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useSafeNestSettings, useProfile } from "@/lib/safenest/store";

const LOCALIZED = {
  en: {
    home: "Home",
    timeline: "Timeline",
    you: "You",
    ask: "Ask",
    profile: "Profile",
    family: "Family",
    emergency: "Emergency",
    offline: "Offline (Local)",
    synced: "Partner Synced",
  },
  ta: {
    home: "முகப்பு",
    timeline: "காலவரிசை",
    you: "நீங்கள்",
    ask: "கேள்வி",
    profile: "விவரம்",
    family: "குடும்பம்",
    emergency: "அவசரம்",
    offline: "ஆஃப்லைன்",
    synced: "இணைக்கப்பட்டது",
  },
  hi: {
    home: "होम",
    timeline: "समयरेखा",
    you: "आप",
    ask: "पूछें",
    profile: "प्रोफ़ाइल",
    family: "परिवार",
    emergency: "आपातकाल",
    offline: "ऑफ़लाइन",
    synced: "सिंक किया गया",
  },
} as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { settings } = useSafeNestSettings();
  const { profile } = useProfile();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const goOnline = () => setIsOnline(true);
      const goOffline = () => setIsOnline(false);
      window.addEventListener("online", goOnline);
      window.addEventListener("offline", goOffline);
      return () => {
        window.removeEventListener("online", goOnline);
        window.removeEventListener("offline", goOffline);
      };
    }
  }, []);

  const lang = settings.language || "en";
  const dict = LOCALIZED[lang] || LOCALIZED.en;

  const NAV = [
    { to: "/", label: dict.home, icon: Baby },
    { to: "/timeline", label: dict.timeline, icon: Clock },
    { to: "/wellbeing", label: dict.you, icon: HeartHandshake },
    { to: "/assistant", label: dict.ask, icon: MessageCircleHeart },
    { to: "/profile", label: dict.profile, icon: Activity },
    { to: "/family", label: dict.family, icon: Users },
  ] as const;

  // Font size scale class mapping
  const fontClass = 
    settings.fontSize === "sm" ? "text-sm" :
    settings.fontSize === "lg" ? "text-lg font-medium" :
    settings.fontSize === "xl" ? "text-xl font-medium" : "text-base";

  return (
    <div className={cn("relative min-h-screen bg-background pb-32 transition-colors", fontClass)}>
      {/* Background Calm Aura Halo */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[480px] opacity-40 transition-opacity"
        style={{ background: "var(--gradient-halo)" }}
      />
      
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-5 pt-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Baby className="size-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            SafeNest<span className="text-primary"> AI</span>
          </span>
        </Link>

        {/* Sync/Offline Indicator & Emergency Quick Toggle */}
        <div className="flex items-center gap-3">
          <div 
            className={cn(
              "hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold sm:flex border transition-all",
              isOnline 
                ? "bg-success/10 text-success border-success/20" 
                : "bg-warning/10 text-warning border-warning/20"
            )}
          >
            {isOnline ? (
              <>
                <Wifi className="size-3.5" />
                <span>{dict.synced}</span>
              </>
            ) : (
              <>
                <WifiOff className="size-3.5" />
                <span>{dict.offline}</span>
              </>
            )}
          </div>

          <Link
            to="/emergency"
            className="flex h-10 items-center gap-1.5 rounded-full bg-destructive/10 px-4 text-xs font-bold text-destructive border border-destructive/20 hover:bg-destructive/20 active:scale-95 transition-all shadow-sm"
          >
            <Siren className="size-4 animate-pulse" />
            {dict.emergency}
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6">
        {children}
      </main>

      {/* Mobile/Bottom Navigation Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/40 bg-background/80 backdrop-blur-xl transition-colors">
        <div className="mx-auto flex w-full max-w-5xl items-stretch justify-between px-3 py-2">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex min-h-[60px] flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-250",
                  active 
                    ? "bg-primary/10 text-primary scale-102" 
                    : "text-muted-foreground hover:text-foreground active:scale-95",
                )}
              >
                <Icon className="size-5 sm:size-5.5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}