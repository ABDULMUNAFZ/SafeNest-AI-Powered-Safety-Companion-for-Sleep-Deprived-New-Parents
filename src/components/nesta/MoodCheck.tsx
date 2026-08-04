import { motion } from "motion/react";
import { HeartHandshake, Mic, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { findAnswers } from "@/lib/nesta/knowledge";
import { speak, useVoiceInput } from "@/lib/nesta/speech";
import { useMoods, useProfile, type MoodEntry } from "@/lib/nesta/store";

const FACES: Array<{ score: MoodEntry["score"]; emoji: string; label: string }> = [
  { score: 1, emoji: "😔", label: "Struggling" },
  { score: 2, emoji: "😕", label: "Low" },
  { score: 3, emoji: "😐", label: "Okay" },
  { score: 4, emoji: "🙂", label: "Good" },
  { score: 5, emoji: "😊", label: "Great" },
];

export function MoodCheck() {
  const { addMood, moods, lowStreak, average } = useMoods();
  const { profile } = useProfile();
  const [note, setNote] = useState("");
  const voice = useVoiceInput((text) => setNote(text));

  const record = (score: MoodEntry["score"]) => {
    addMood(score, note.trim() || undefined);
    setNote("");
    if (score <= 2) {
      speak("Thank you for telling me. You deserve support too.");
      toast("You deserve support too.", { description: "I saved this check-in gently." });
    } else {
      speak("Noted. Thanks for checking in.");
      toast.success("Check-in saved");
    }
  };

  const escalate = lowStreak >= 3;
  const noteMatch = note ? findAnswers(note)[0] : undefined;

  return (
    <section className="space-y-4">
      <div className="glass-card rounded-[2rem] p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-accent">Daily check-in</p>
        <h2 className="mt-2 font-display text-3xl font-bold">How are you feeling today?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          One tap is enough. This is never a diagnosis — it just helps spot patterns early.
        </p>

        <div className="mt-6 grid grid-cols-5 gap-2">
          {FACES.map((face) => (
            <motion.button
              key={face.score}
              whileTap={{ scale: 0.94 }}
              onClick={() => record(face.score)}
              className="flex min-h-[104px] flex-col items-center justify-center gap-1 rounded-3xl bg-muted/40 transition hover:bg-primary/15"
            >
              <span className="text-4xl">{face.emoji}</span>
              <span className="text-[11px] font-semibold text-muted-foreground">{face.label}</span>
            </motion.button>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Anything you want to add? (optional)"
            className="min-h-[56px] flex-1 rounded-2xl border border-input bg-muted/40 px-5 outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => (voice.listening ? voice.stop() : voice.start())}
            className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-border px-6 font-semibold"
          >
            {voice.listening ? <Send className="size-5" /> : <Mic className="size-5" />}
            {voice.listening ? "Listening…" : "Speak"}
          </button>
        </div>

        {noteMatch && (
          <div className="mt-4 rounded-2xl bg-muted/40 p-4 text-sm">
            <p className="font-semibold">{noteMatch.answer}</p>
            <p className="mt-2 text-xs text-muted-foreground">Source: {noteMatch.source}</p>
          </div>
        )}
      </div>

      {escalate && (
        <div className="rounded-[2rem] border border-accent/40 bg-accent/10 p-6">
          <p className="flex items-center gap-2 font-display text-2xl font-bold text-accent">
            <HeartHandshake className="size-6" /> You deserve support too
          </p>
          <p className="mt-2 text-base">
            That&apos;s {lowStreak} low check-ins in a row. Talking to your doctor, midwife, or a
            postnatal support line today is a good next step.
          </p>
          {profile.shareWithPartner && (
            <p className="mt-3 rounded-2xl bg-background/60 p-4 text-sm text-muted-foreground">
              Support alert ready for {profile.partnerName}: “{profile.parentName} may need some extra
              care today — a warm check-in would mean a lot.”
            </p>
          )}
          <a
            href={`tel:${profile.pediatricianPhone}`}
            className="mt-4 inline-flex min-h-[64px] items-center rounded-3xl bg-accent px-8 text-lg font-bold text-accent-foreground"
          >
            Talk to someone now
          </a>
        </div>
      )}

      <div className="glass-card rounded-[2rem] p-6">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-xl font-semibold">Mood trend</h3>
          <p className="text-sm text-muted-foreground">
            {moods.length ? `7-check-in average ${average.toFixed(1)} / 5` : "No check-ins yet"}
          </p>
        </div>
        <div className="mt-5 flex h-32 items-end gap-2">
          {(moods.length ? moods.slice(0, 14).reverse() : []).map((mood) => (
            <div key={mood.id} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={`w-full rounded-t-xl ${mood.score <= 2 ? "bg-warning/70" : "bg-primary/70"}`}
                style={{ height: `${mood.score * 18}%` }}
              />
              <span className="text-[10px] text-muted-foreground">
                {new Date(mood.at).toLocaleDateString([], { day: "numeric", month: "short" })}
              </span>
            </div>
          ))}
          {!moods.length && (
            <p className="text-sm text-muted-foreground">
              Your first check-in will start the trend here.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}