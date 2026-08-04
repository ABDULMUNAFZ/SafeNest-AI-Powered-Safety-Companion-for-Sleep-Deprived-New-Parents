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
  WifiOff,
  Mic
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useSafeNestSettings, useProfile } from "@/lib/safenest/store";
import { useSafeNestAuth } from "@/lib/safenest/auth-context";
import { LogOut } from "lucide-react";

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
  const { user, signOut } = useSafeNestAuth();
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

  const NAV_LEFT = [
    { to: "/", label: dict.home, icon: Baby },
    { to: "/timeline", label: dict.timeline, icon: Clock },
  ] as const;

  const NAV_RIGHT = [
    { to: "/wellbeing", label: dict.you, icon: HeartHandshake },
    { to: "/profile", label: dict.profile, icon: Users },
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

      {/* Sunken Tab Presentation Header */}
      {/* Desktop/Tablet View (md:flex hidden) */}
      <div className="fixed top-0 inset-x-0 z-40 w-full md:flex hidden items-start justify-center select-none bg-transparent">
        <div className="flex-grow h-4 bg-neutral-950" />
        <div className="w-full max-w-[1400px] h-[80px] shrink-0 relative">
          <svg viewBox="0 0 1200 72" preserveAspectRatio="none" className="w-full h-full fill-neutral-950">
            <path d="M 0,0 L 1200,0 L 1200,16 L 950,16 C 880,16 850,72 780,72 L 420,72 C 350,72 320,16 250,16 L 0,16 Z" />
          </svg>
          {/* Overlay Navigation Links (Wider & Larger) */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-1 h-14 w-[520px] flex items-center justify-between text-neutral-300 z-50">
            <Link to="/" className={cn("text-xs font-black uppercase tracking-widest transition-colors", pathname === "/" ? "text-orange-400" : "text-neutral-400 hover:text-white")}>Dashboard</Link>
            <Link to="/timeline" className={cn("text-xs font-black uppercase tracking-widest transition-colors", pathname === "/timeline" ? "text-orange-400" : "text-neutral-400 hover:text-white")}>Timeline</Link>
            <Link to="/wellbeing" className={cn("text-xs font-black uppercase tracking-widest transition-colors", pathname === "/wellbeing" ? "text-orange-400" : "text-neutral-400 hover:text-white")}>Wellness</Link>
            <Link to="/profile" className={cn("text-xs font-black uppercase tracking-widest transition-colors", pathname === "/profile" ? "text-orange-400" : "text-neutral-400 hover:text-white")}>Pediatrics</Link>
            <Link to="/family" className={cn("text-xs font-black uppercase tracking-widest transition-colors", pathname === "/family" ? "text-orange-400" : "text-neutral-400 hover:text-white")}>Sync</Link>
          </div>
        </div>
        <div className="flex-grow h-4 bg-neutral-950" />
      </div>

      {/* Mobile/Responsive Top Bar (md:hidden block) */}
      <div className="fixed top-0 inset-x-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-900 h-14 px-4 md:hidden flex items-center justify-between select-none">
        <Link to="/" className="flex items-center gap-1.5">
          <span className="grid size-6 place-items-center rounded bg-orange-500 text-white">
            <Baby className="size-3.5" />
          </span>
          <span className="font-display text-[10px] font-black tracking-tight text-white uppercase">
            SafeNest<span className="text-orange-500">.ai</span>
          </span>
        </Link>
        <div className="flex items-center gap-3.5 text-neutral-300">
          <Link to="/" className={cn("text-[9px] font-black uppercase tracking-wider", pathname === "/" ? "text-orange-400" : "text-neutral-400")}>Home</Link>
          <Link to="/timeline" className={cn("text-[9px] font-black uppercase tracking-wider", pathname === "/timeline" ? "text-orange-400" : "text-neutral-400")}>Timeline</Link>
          <Link to="/wellbeing" className={cn("text-[9px] font-black uppercase tracking-wider", pathname === "/wellbeing" ? "text-orange-400" : "text-neutral-400")}>You</Link>
          <Link to="/profile" className={cn("text-[9px] font-black uppercase tracking-wider", pathname === "/profile" ? "text-orange-400" : "text-neutral-400")}>Ped</Link>
          <Link to="/family" className={cn("text-[9px] font-black uppercase tracking-wider", pathname === "/family" ? "text-orange-400" : "text-neutral-400")}>Sync</Link>
        </div>
      </div>
 
      {/* Floating Logo & User Details Header Row (absolutely positioned over the page margins) */}
      <header className="relative z-30 mx-auto flex w-full max-w-7xl items-center justify-between px-6 pt-6 lg:px-8 h-12">
        {/* Left Logo (matches crypko position) */}
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-orange-500 text-white">
            <Baby className="size-4.5" />
          </span>
          <span className="font-display text-base font-black tracking-tight text-foreground uppercase">
            SafeNest<span className="text-orange-500">.ai</span>
          </span>
        </Link>
 
        {/* Right Buttons (matches crypko position) */}
        <div className="flex items-center gap-3">
          <Link
            to="/emergency"
            className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-white hover:bg-neutral-50 px-5 text-xs font-bold text-foreground transition-all shadow-sm active:scale-95"
          >
            <Siren className="size-3.5 text-orange-500" />
            SOS Emergency
          </Link>
 
          {user && (
            <div className="flex items-center gap-1.5 border border-border/80 bg-muted/40 pl-1.5 pr-1 py-1 rounded-full shrink-0">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || "User"} 
                  className="size-5 rounded-full object-cover border border-orange-500/20"
                />
              ) : (
                <span className="grid size-5 place-items-center rounded-full bg-orange-500/25 text-[8px] font-bold text-orange-500">
                  {user.displayName?.charAt(0).toUpperCase() || "U"}
                </span>
              )}
              <button
                onClick={signOut}
                title="Sign Out"
                className="grid size-5 place-items-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:scale-95 transition-all cursor-pointer border-none bg-transparent"
              >
                <LogOut className="size-3" />
              </button>
            </div>
          )}
        </div>
      </header>
 
      {/* Main Content Area */}
      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        {children}
      </main>
 
      {/* Floating Dark Tab Bottom Navigation Bar (rising pocket symmetry) */}
      {/* Desktop/Tablet View (md:flex hidden) */}
      <div className="fixed bottom-0 inset-x-0 z-45 w-full md:flex hidden items-end justify-center select-none bg-transparent">
        <div className="flex-grow h-4 bg-neutral-950" />
        <div className="w-full max-w-[1400px] h-[80px] shrink-0 relative">
          <svg viewBox="0 0 1200 72" preserveAspectRatio="none" className="w-full h-full fill-neutral-950">
            <path d="M 0,72 L 1200,72 L 1200,56 L 950,56 C 880,56 850,0 780,0 L 420,0 C 350,0 320,56 250,56 L 0,56 Z" />
          </svg>
          {/* Bottom Nav Items (centered over the rising tab - Wider & Larger) */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1 h-14 w-[520px] flex items-center justify-between z-50">
            {/* Left items */}
            {NAV_LEFT.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-0.5 text-xs font-black uppercase tracking-wider transition-colors duration-200 cursor-pointer",
                    active ? "text-orange-400 scale-105" : "text-neutral-400 hover:text-white"
                  )}
                >
                  <Icon className="size-5" />
                  <span className="hidden sm:inline text-[9px] mt-0.5">{label}</span>
                  {/* Custom Yellow Badge Indicator as seen in reference image! */}
                  {to === "/timeline" && (
                    <span className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full bg-yellow-400 text-[8px] font-black text-black ring-1 ring-neutral-950">
                      6
                    </span>
                  )}
                </Link>
              );
            })}
 
            {/* Centered AI Voice Assistant Floating Button */}
            <div className="relative px-2 shrink-0">
              <Link
                to="/assistant"
                className={cn(
                  "flex size-11 items-center justify-center rounded-full bg-orange-500 text-white hover:scale-108 active:scale-95 transition-all shadow-md",
                  pathname === "/assistant" ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-neutral-950" : ""
                )}
              >
                <Mic className="size-4.5 text-white" />
              </Link>
              {/* Custom Yellow Badge Indicator on Ask button! */}
              <span className="absolute -top-1 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-yellow-400 text-[8px] font-black text-black ring-1 ring-neutral-950 animate-pulse">
                2
              </span>
            </div>
 
            {/* Right items */}
            {NAV_RIGHT.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-0.5 text-xs font-black uppercase tracking-wider transition-colors duration-200 cursor-pointer",
                    active ? "text-orange-400 scale-105" : "text-neutral-400 hover:text-white"
                  )}
                >
                  <Icon className="size-5" />
                  <span className="hidden sm:inline text-[9px] mt-0.5">{label}</span>
                  {/* Custom Yellow Badge Indicator on Wellbeing tab! */}
                  {to === "/wellbeing" && (
                    <span className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full bg-yellow-400 text-[8px] font-black text-black ring-1 ring-neutral-950">
                      3
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex-grow h-4 bg-neutral-950" />
      </div>

      {/* Mobile Bottom Navigation Bar (md:hidden block) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-900 px-6 py-2 md:hidden flex items-center justify-around select-none">
        <Link to="/" className={cn("flex flex-col items-center justify-center text-neutral-400", pathname === "/" && "text-orange-400")}>
          <Baby className="size-5" />
          <span className="text-[8px] font-black uppercase mt-1">Home</span>
        </Link>
        
        <Link to="/timeline" className={cn("relative flex flex-col items-center justify-center text-neutral-400", pathname === "/timeline" && "text-orange-400")}>
          <Clock className="size-5" />
          <span className="text-[8px] font-black uppercase mt-1">Timeline</span>
          <span className="absolute -top-1 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-yellow-400 text-[8px] font-black text-black ring-1 ring-neutral-950">
            6
          </span>
        </Link>

        {/* Centered AI Voice Assistant Floating Button */}
        <Link
          to="/assistant"
          className={cn(
            "flex size-11 items-center justify-center rounded-full bg-orange-500 text-white hover:scale-105 active:scale-95 transition-all shadow-md -mt-4 border-4 border-neutral-950",
            pathname === "/assistant" ? "ring-2 ring-orange-500" : ""
          )}
        >
          <Mic className="size-4.5 text-white" />
        </Link>

        <Link to="/wellbeing" className={cn("relative flex flex-col items-center justify-center text-neutral-400", pathname === "/wellbeing" && "text-orange-400")}>
          <HeartHandshake className="size-5" />
          <span className="text-[8px] font-black uppercase mt-1">You</span>
          <span className="absolute -top-1 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-yellow-400 text-[8px] font-black text-black ring-1 ring-neutral-950">
            3
          </span>
        </Link>

        <Link to="/profile" className={cn("flex flex-col items-center justify-center text-neutral-400", pathname === "/profile" && "text-orange-400")}>
          <Users className="size-5" />
          <span className="text-[8px] font-black uppercase mt-1">Profile</span>
        </Link>
      </div>
    </div>
  );
}