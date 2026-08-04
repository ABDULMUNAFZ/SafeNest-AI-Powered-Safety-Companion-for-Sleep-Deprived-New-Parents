import { motion, AnimatePresence } from "motion/react";
import { 
  HeartHandshake, 
  Mic, 
  Send, 
  Droplets, 
  Coffee, 
  Activity, 
  Check, 
  Wind, 
  Play, 
  Square,
  Smile,
  Frown,
  TrendingUp
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";

import { findAnswers } from "@/lib/safenest/knowledge";
import { speak, useVoiceInput } from "@/lib/safenest/speech";
import { useMoods, useProfile, useCareLogs, type MoodEntry } from "@/lib/safenest/store";

const FACES: Array<{ score: MoodEntry["score"]; emoji: string; label: string; tone: string }> = [
  { score: 1, emoji: "😔", label: "Struggling", tone: "hover:bg-destructive/15 text-destructive" },
  { score: 2, emoji: "😕", label: "Low", tone: "hover:bg-warning/15 text-warning" },
  { score: 3, emoji: "😐", label: "Okay", tone: "hover:bg-primary/15 text-primary" },
  { score: 4, emoji: "🙂", label: "Good", tone: "hover:bg-secondary/15 text-secondary" },
  { score: 5, emoji: "😊", label: "Great", tone: "hover:bg-success/15 text-success" },
];

export function MoodCheck() {
  const { addMood, moods, lowStreak, average, averageStress, averageEnergy } = useMoods();
  const { profile } = useProfile();
  const { logs, addLog } = useCareLogs();

  const [note, setNote] = useState("");
  const [stress, setStress] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [moodScore, setMoodScore] = useState<MoodEntry["score"] | null>(null);

  // Guided breathing states
  const [isBreathing, setIsBreathing] = useState(false);
  const [breatheSeconds, setBreatheSeconds] = useState(0);
  const [breathePhase, setBreathePhase] = useState<"inhale" | "hold" | "exhale">("inhale");

  const voice = useVoiceInput((text) => setNote(text));

  // Handle breathing exercise interval timer
  useEffect(() => {
    let interval: any;
    if (isBreathing) {
      interval = setInterval(() => {
        setBreatheSeconds((prev) => {
          const next = prev + 1;
          const cycleSec = next % 12;
          if (cycleSec < 4) {
            setBreathePhase("inhale");
          } else if (cycleSec < 8) {
            setBreathePhase("hold");
          } else {
            setBreathePhase("exhale");
          }
          return next;
        });
      }, 1000);
    } else {
      setBreatheSeconds(0);
      setBreathePhase("inhale");
    }
    return () => clearInterval(interval);
  }, [isBreathing]);

  const recordCheckIn = () => {
    if (!moodScore) {
      toast.error("Please select an emoji mood level first.");
      return;
    }
    addMood(moodScore, note.trim() || undefined, stress, energy);
    
    if (moodScore <= 2) {
      speak("Thank you for sharing. You are doing a wonderful job under tough conditions. Please look after yourself.");
      toast("Wellbeing logged gently", { description: "You deserve support. Take a deep breath." });
    } else {
      speak("Wellness check-in recorded. Thank you.");
      toast.success("Wellness check-in recorded");
    }

    setNote("");
    setMoodScore(null);
    setStress(5);
    setEnergy(5);
  };

  const handleLogWater = (ml: number) => {
    addLog("water", `${ml} ml of water`);
    toast.success(`Logged ${ml}ml of water`, { description: "Staying hydrated supports postpartum recovery" });
    speak("Water logged.");
  };

  const escalate = lowStreak >= 3;
  const noteMatch = note ? findAnswers(note)[0] : undefined;

  // Hydration summary calculations
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const waterLogs = logs.filter(l => l.kind === "water" && l.at >= startOfDay.getTime());
  const totalWaterMl = waterLogs.reduce((sum, l) => {
    const mlMatch = l.note?.match(/(\d+)/);
    return sum + (mlMatch ? parseInt(mlMatch[0]) : 250);
  }, 0);

  // Prepare wellbeing trend chart data
  const chartData = moods.slice(0, 10).reverse().map((m) => ({
    date: new Date(m.at).toLocaleDateString([], { day: "numeric", month: "short" }),
    Mood: m.score,
    Stress: m.stressScore || 5,
    Energy: m.energyScore || 5,
  }));

  return (
    <section className="space-y-6">
      
      {/* 1. EPDS Mood & Wellness Survey */}
      <div className="flex flex-col">
        <div className="bg-white border-t border-x border-border px-3 py-1 rounded-t-lg text-[8px] font-black uppercase tracking-wider text-muted-foreground w-fit relative z-10 -mb-[1px]">
          Mental Wellness Journal
        </div>
        <div className="bg-white border border-border rounded-b-[1.5rem] rounded-tr-[1.5rem] p-6 shadow-sm relative z-0 space-y-5">
          <div>
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-neutral-950">How are you feeling, {profile.parentName}?</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Postpartum recovery is physically and emotionally demanding. Checking in helps spot stress trends early.
            </p>
          </div>

          {/* Emojis selection */}
          <div className="grid grid-cols-5 gap-2.5">
            {FACES.map((face) => {
              const isSelected = moodScore === face.score;
              return (
                <motion.button
                  key={face.score}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => {
                    setMoodScore(face.score);
                    speak(face.label);
                  }}
                  className={`flex min-h-[96px] flex-col items-center justify-center gap-1.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected 
                      ? "bg-neutral-950 border-neutral-950 text-white shadow-md scale-[1.02]" 
                      : `bg-[#f4f4f5] border-neutral-200 text-muted-foreground ${face.tone}`
                  }`}
                >
                  <span className="text-3xl sm:text-4xl">{face.emoji}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider">{face.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Sliders for Stress & Energy */}
          <div className="grid gap-5 sm:grid-cols-2 pt-2">
            {/* Stress Slider */}
            <div className="space-y-2 bg-[#f4f4f5] border border-neutral-200 p-4 rounded-xl">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span className="text-muted-foreground flex items-center gap-1"><Frown className="size-3.5 text-warning" /> Stress Level</span>
                <span className="text-foreground">{stress} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={stress}
                onChange={(e) => setStress(parseInt(e.target.value))}
                className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>Calm</span>
                <span>Highly Stressed</span>
              </div>
            </div>

            {/* Energy Slider */}
            <div className="space-y-2 bg-[#f4f4f5] border border-neutral-200 p-4 rounded-xl">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span className="text-muted-foreground flex items-center gap-1"><Smile className="size-3.5 text-success" /> Energy Level</span>
                <span className="text-foreground">{energy} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={energy}
                onChange={(e) => setEnergy(parseInt(e.target.value))}
                className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>Exhausted</span>
                <span>Rested</span>
              </div>
            </div>
          </div>

          {/* Text Area Note */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="mood-note-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add comments on sleep, anxiety, or achievements... (optional)"
              className="flex-1 h-12 rounded-xl border border-neutral-200 bg-[#f4f4f5] px-4 text-sm outline-none focus:ring-2 focus:ring-neutral-950 focus:bg-white transition-all"
            />
            <button
              onClick={() => (voice.listening ? voice.stop() : voice.start())}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 font-bold text-neutral-600 hover:text-neutral-950 hover:bg-[#f4f4f5] transition-all cursor-pointer"
            >
              {voice.listening ? "Listening..." : "Speak Note"}
            </button>
          </div>

          {/* Suggestion responses */}
          {noteMatch && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-xs">
              <p className="font-semibold">{noteMatch.answer}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Reference: {noteMatch.source}</p>
            </div>
          )}

          <button
            onClick={recordCheckIn}
            className="w-full flex h-12 items-center justify-center gap-1.5 rounded-full bg-neutral-950 font-bold text-white hover:bg-neutral-900 transition-all cursor-pointer text-sm shadow-sm active:scale-95"
          >
            <Check className="size-4.5" /> Submit Wellness Check-in
          </button>
        </div>
      </div>

      {/* 2. Low Mood Escalation Nudge */}
      {escalate && (
        <div className="rounded-[2rem] border border-accent/30 bg-accent/5 p-6 space-y-4">
          <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold text-accent">
            <HeartHandshake className="size-6 text-accent" /> You deserve support too
          </h2>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Sarah, you have logged {lowStreak} consecutive low check-ins. Caring for a newborn is exhausting, and you don&apos;t have to do it alone. Sharing this with your midwife, pediatrician, or partner is a strong safety step.
          </p>
          {profile.shareWithPartner && (
            <div className="rounded-xl bg-background/60 p-4 border border-accent/20 text-xs text-muted-foreground italic">
              <span className="font-bold text-foreground not-italic block mb-0.5">Partner Support Alert Sent</span>
              &ldquo;{profile.parentName} may need some extra care and a rest shift today. A warm check-in would mean a lot.&rdquo;
            </div>
          )}
          <a
            href={`tel:${profile.pediatricianPhone}`}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-6 text-sm font-bold text-accent-foreground hover:bg-accent/95 transition-all shadow-md"
          >
            Contact Doctor / Lactation Support
          </a>
        </div>
      )}

      {/* 3. Interactive Guided Breathing Exercise */}
      <div className="flex flex-col">
        <div className="bg-white border-t border-x border-border px-3 py-1 rounded-t-lg text-[8px] font-black uppercase tracking-wider text-muted-foreground w-fit relative z-10 -mb-[1px]">
          SafeNest Breathe
        </div>
        <div className="bg-white border border-border rounded-b-[1.5rem] rounded-tr-[1.5rem] p-6 shadow-sm relative z-0 flex flex-col items-center text-center space-y-5">
          <div>
            <h3 className="font-display text-lg font-black uppercase tracking-tight text-neutral-950">Guided Breathing Helper</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              A 12-second cyclic breathing exercise (4s inhale, 4s hold, 4s exhale) to reduce heart rate and anxiety.
            </p>
          </div>

          {/* Breathing Circle Visualizer */}
          <div className="h-44 w-full grid place-items-center relative select-none">
            <div 
              className={`size-20 rounded-full border border-neutral-200 flex items-center justify-center transition-all ${
                isBreathing ? "breathing-circle" : "bg-neutral-50"
              }`}
            >
              <Wind className="size-8 text-neutral-600" />
            </div>
            
            {isBreathing && (
              <div className="absolute bottom-0 text-sm font-bold capitalize text-neutral-800 animate-pulse">
                {breathePhase} ({breatheSeconds % 4 + 1}s)
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setIsBreathing(!isBreathing);
              speak(isBreathing ? "Breathing session ended." : "Inhale deeply as the circle expands...");
            }}
            className="flex h-11 items-center gap-1.5 rounded-full bg-[#d4fc34] px-6 font-bold text-neutral-950 hover:bg-[#c2eb23] transition-all cursor-pointer shadow-sm active:scale-95 text-xs"
          >
            {isBreathing ? (
              <>
                <Square className="size-4" /> Stop Breathing
              </>
            ) : (
              <>
                <Play className="size-4" /> Start Breathing Break
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Postpartum Hydration Companion */}
      <div className="flex flex-col">
        <div className="bg-white border-t border-x border-border px-3 py-1 rounded-t-lg text-[8px] font-black uppercase tracking-wider text-muted-foreground w-fit relative z-10 -mb-[1px]">
          Parent Hydration
        </div>
        <div className="bg-white border border-border rounded-b-[1.5rem] rounded-tr-[1.5rem] p-6 shadow-sm relative z-0 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-display text-lg font-black uppercase tracking-tight text-neutral-950 flex items-center gap-2">
                <Droplets className="size-5 text-primary animate-pulse" /> Postpartum Hydration Tracker
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hydration supports healing and milk volume. Target: 2,500 ml daily.
              </p>
            </div>
            <span className="rounded-full bg-neutral-950 border border-neutral-950 px-4 py-1.5 text-xs font-black text-[#d4fc34] shadow-sm">
              {totalWaterMl} / 2500 ml
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button
              onClick={() => handleLogWater(250)}
              className="flex h-14 flex-col items-center justify-center border border-neutral-200 rounded-xl hover:border-neutral-950 bg-white transition-all cursor-pointer shadow-sm"
            >
              <Coffee className="size-4 text-primary" />
              <span className="text-xs font-bold mt-1 text-neutral-755">+250 ml (Cup)</span>
            </button>
            <button
              onClick={() => handleLogWater(500)}
              className="flex h-14 flex-col items-center justify-center border border-neutral-200 rounded-xl hover:border-neutral-950 bg-white transition-all cursor-pointer shadow-sm"
            >
              <Droplets className="size-4 text-primary" />
              <span className="text-xs font-bold mt-1 text-neutral-755">+500 ml (Bottle)</span>
            </button>
            <button
              onClick={() => handleLogWater(750)}
              className="flex h-14 flex-col items-center justify-center border border-neutral-200 rounded-xl hover:border-neutral-950 bg-white transition-all cursor-pointer shadow-sm"
            >
              <Droplets className="size-4.5 text-primary" />
              <span className="text-xs font-bold mt-1 text-neutral-755">+750 ml (Large)</span>
            </button>
            <button
              onClick={() => handleLogWater(1000)}
              className="flex h-14 flex-col items-center justify-center border border-neutral-200 rounded-xl hover:border-neutral-950 bg-white transition-all cursor-pointer shadow-sm"
            >
              <Droplets className="size-5 text-primary" />
              <span className="text-xs font-bold mt-1 text-neutral-755">+1.0 L (Flask)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Wellbeing Trends Charts */}
      {moods.length > 0 && (
        <div className="flex flex-col">
          <div className="bg-white border-t border-x border-border px-3 py-1 rounded-t-lg text-[8px] font-black uppercase tracking-wider text-muted-foreground w-fit relative z-10 -mb-[1px]">
            Wellness Trend
          </div>
          <div className="bg-white border border-border rounded-b-[1.5rem] rounded-tr-[1.5rem] p-6 shadow-sm relative z-0 space-y-4">
            <div>
              <h3 className="font-display text-lg font-black uppercase tracking-tight text-neutral-950 flex items-center gap-2">
                <TrendingUp className="size-5 text-primary" /> Wellbeing &amp; Stress Trend
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Weekly historical chart of stress vs. mood index.
              </p>
            </div>

            <div className="h-48 w-full pr-4 text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="date" stroke="var(--color-muted-foreground)" />
                  <YAxis domain={[0, 10]} stroke="var(--color-muted-foreground)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "var(--color-card)", 
                      borderColor: "var(--color-border)",
                      borderRadius: "1rem",
                      color: "var(--color-foreground)"
                    }} 
                  />
                  <Bar dataKey="Mood" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Stress" fill="var(--color-warning)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}