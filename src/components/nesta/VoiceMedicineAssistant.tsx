import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { AlertTriangle, Loader2, Mic, MicOff, Phone, ShieldCheck, Volume2 } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { lookupDosage, parseRequest, type DosageResult, type ParsedRequest } from "@/lib/nesta/dosage";
import { speak, stopSpeaking, useVoiceInput } from "@/lib/nesta/speech";
import { triage, type TriageResult } from "@/lib/nesta/triage";
import { useProfile } from "@/lib/nesta/store";

const EXAMPLES = [
  "My baby is 4 months old, weighs 6 kg and has a fever. How much paracetamol?",
  "8 kg baby, teething pain, ibuprofen dose?",
  "My baby has trouble breathing",
];

type Outcome =
  | { kind: "idle" }
  | { kind: "emergency"; triage: TriageResult }
  | { kind: "dosage"; parsed: ParsedRequest; result: DosageResult; triage: TriageResult };

export function VoiceMedicineAssistant() {
  const { profile } = useProfile();
  const [outcome, setOutcome] = useState<Outcome>({ kind: "idle" });
  const [thinking, setThinking] = useState(false);
  const [typed, setTyped] = useState("");

  const handleRequest = useCallback(
    (input: string) => {
      if (!input.trim()) return;
      setThinking(true);
      stopSpeaking();

      const parsed = parseRequest(input);
      const withProfile: ParsedRequest = {
        ...parsed,
        ageMonths: parsed.ageMonths ?? profile.ageMonths,
        weightKg: parsed.weightKg ?? profile.weightKg,
      };
      const risk = triage(input, withProfile.ageMonths);

      window.setTimeout(() => {
        setThinking(false);
        if (risk.level === "critical") {
          setOutcome({ kind: "emergency", triage: risk });
          speak(risk.spoken);
          return;
        }
        const result = lookupDosage(withProfile);
        setOutcome({ kind: "dosage", parsed: withProfile, result, triage: risk });
        speak([risk.spoken, result.spoken].filter(Boolean).join(" "));
      }, 350);
    },
    [profile.ageMonths, profile.weightKg],
  );

  const voice = useVoiceInput(handleRequest);

  if (outcome.kind === "emergency") {
    return (
      <section className="rounded-[2rem] border border-destructive/50 bg-destructive/15 p-7 text-center">
        <AlertTriangle className="mx-auto size-14 text-destructive" />
        <h2 className="mt-4 font-display text-4xl font-bold text-destructive">Emergency detected</h2>
        <p className="mx-auto mt-3 max-w-md text-lg text-foreground/90">
          {outcome.triage.action} I have stopped all dosage guidance.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={`tel:${profile.emergencyNumber}`}
            className="flex min-h-[72px] items-center justify-center gap-3 rounded-3xl bg-destructive px-8 text-xl font-bold text-destructive-foreground"
          >
            <Phone className="size-6" /> Call {profile.emergencyNumber}
          </a>
          <Link
            to="/emergency"
            className="flex min-h-[72px] items-center justify-center rounded-3xl border border-destructive/50 px-8 text-lg font-semibold text-destructive"
          >
            Open Emergency Mode
          </Link>
        </div>
        <button
          onClick={() => {
            stopSpeaking();
            setOutcome({ kind: "idle" });
          }}
          className="mt-5 text-sm font-semibold text-muted-foreground underline"
        >
          This was a mistake — go back
        </button>
      </section>
    );
  }

  return (
    <section className="glass-card rounded-[2rem] p-6 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          AI Voice Medicine Assistant
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          Ask. I&apos;ll check the safe dose.
        </h1>

        <div className="relative mt-8 grid place-items-center">
          {voice.listening && (
            <span className="mic-halo absolute size-40 rounded-full bg-primary/40" aria-hidden />
          )}
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => (voice.listening ? voice.stop() : voice.start())}
            aria-label={voice.listening ? "Stop listening" : "Start voice request"}
            className="relative grid size-32 place-items-center rounded-full bg-primary text-primary-foreground"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            {voice.listening ? <MicOff className="size-14" /> : <Mic className="size-14" />}
          </motion.button>
        </div>

        <p className="mt-5 min-h-[3rem] max-w-xl text-xl font-medium">
          {thinking ? (
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" /> Checking validated dosage tables…
            </span>
          ) : voice.transcript ? (
            `“${voice.transcript}”`
          ) : voice.listening ? (
            <span className="text-muted-foreground">Listening… speak naturally.</span>
          ) : (
            <span className="text-muted-foreground">Tap the microphone and just talk.</span>
          )}
        </p>

        {!voice.supported && (
          <p className="mt-1 text-sm text-warning">
            Voice input isn&apos;t available in this browser — type your question instead.
          </p>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleRequest(typed);
            voice.setTranscript(typed);
          }}
          className="mt-5 flex w-full max-w-xl flex-col gap-3 sm:flex-row"
        >
          <input
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder="Or type: 6 kg baby, fever, paracetamol"
            className="min-h-[56px] flex-1 rounded-2xl border border-input bg-muted/40 px-5 text-base outline-none focus:ring-2 focus:ring-ring"
          />
          <Button type="submit" size="lg" className="min-h-[56px] rounded-2xl px-8 text-base font-semibold">
            Check
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              onClick={() => {
                setTyped(example);
                voice.setTranscript(example);
                handleRequest(example);
              }}
              className="rounded-full border border-border/70 px-4 py-2 text-xs text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {outcome.kind === "dosage" && !thinking && (
        <DosageCard parsed={outcome.parsed} result={outcome.result} risk={outcome.triage} />
      )}
    </section>
  );
}

function DosageCard({
  parsed,
  result,
  risk,
}: {
  parsed: ParsedRequest;
  result: DosageResult;
  risk: TriageResult;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mt-8 space-y-4"
    >
      {risk.level !== "low" && (
        <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning">
          <p className="font-display text-lg font-semibold">{risk.headline}</p>
          <p className="text-sm text-foreground/80">{risk.action}</p>
        </div>
      )}

      {result.status === "ok" ? (
        <div className="rounded-[1.75rem] bg-muted/40 p-6">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Recommended dose</p>
          <p className="font-display text-6xl font-bold text-primary sm:text-7xl">{result.band.dose}</p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <Detail label="Medicine" value={result.medicine.name} />
            <Detail label="Strength" value={result.band.concentration} />
            <Detail label="Repeat" value={result.band.frequency} />
            <Detail label="Maximum" value={result.band.maxPerDay} />
            <Detail label="Baby weight used" value={`${parsed.weightKg} kg`} />
            <Detail
              label="Baby age used"
              value={parsed.ageMonths ? `${Math.round(parsed.ageMonths)} months` : "Not given"}
            />
          </dl>
          <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
            {result.medicine.notes.map((note) => (
              <li key={note}>• {note}</li>
            ))}
          </ul>
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-background/60 p-4 text-sm">
            <ShieldCheck className="size-5 shrink-0 text-success" />
            <p>
              From validated pediatric dosage tables — never AI-generated. Always confirm with your
              pediatrician before giving medicine.
            </p>
          </div>
          <button
            onClick={() => speak(result.spoken)}
            className="mt-4 inline-flex min-h-[56px] items-center gap-2 rounded-2xl border border-border px-6 font-semibold"
          >
            <Volume2 className="size-5" /> Read it to me again
          </button>
        </div>
      ) : (
        <div className="rounded-[1.75rem] bg-muted/40 p-6">
          <p className="font-display text-2xl font-semibold">
            {result.status === "need-info" ? "I need one more detail" : "I won't guess this one"}
          </p>
          <p className="mt-2 text-lg text-muted-foreground">
            {result.status === "need-info" ? result.spoken : result.reason}
          </p>
        </div>
      )}
    </motion.div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="text-lg font-semibold">{value}</dd>
    </div>
  );
}