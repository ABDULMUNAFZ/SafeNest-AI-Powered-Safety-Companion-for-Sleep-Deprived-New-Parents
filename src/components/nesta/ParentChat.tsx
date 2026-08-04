import { motion } from "motion/react";
import { Mic, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { FALLBACK_ANSWER, KNOWLEDGE, findAnswers } from "@/lib/nesta/knowledge";
import { speak, useVoiceInput } from "@/lib/nesta/speech";
import { triage } from "@/lib/nesta/triage";

type Message = { id: string; role: "parent" | "nesta"; text: string; source?: string; risk?: string };

export function ParentChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "nesta",
      text: "Ask me anything about feeding, sleep, teething, or how you're doing. I only answer from trusted pediatric guidance — and I'll say so when I don't know.",
    },
  ]);
  const [input, setInput] = useState("");

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const risk = triage(text);
    const match = findAnswers(text)[0];
    const reply: Message = {
      id: Math.random().toString(36).slice(2),
      role: "nesta",
      text: match ? match.answer : FALLBACK_ANSWER,
      ...(match ? { source: match.source } : {}),
      ...(risk.level !== "low" ? { risk: `${risk.headline} — ${risk.action}` } : {}),
    };
    setMessages((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), role: "parent", text },
      reply,
    ]);
    setInput("");
    speak([risk.spoken, reply.text].filter(Boolean).join(" "));
  };

  const voice = useVoiceInput((text) => send(text));

  return (
    <section className="space-y-4">
      <div className="glass-card rounded-[2rem] p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-secondary">AI Parent Assistant</p>
        <h2 className="mt-2 font-display text-3xl font-bold">Ask me anything</h2>

        <div className="mt-6 space-y-3">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={
                message.role === "parent"
                  ? "ml-auto max-w-[85%] rounded-3xl rounded-br-lg bg-primary/20 p-4 text-base"
                  : "max-w-[92%] rounded-3xl rounded-bl-lg bg-muted/50 p-4 text-base"
              }
            >
              {message.risk && (
                <p className="mb-2 rounded-xl bg-warning/15 p-3 text-sm font-semibold text-warning">
                  {message.risk}
                </p>
              )}
              <p>{message.text}</p>
              {message.source && (
                <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="size-4 text-success" /> Source: {message.source}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <input
            value={voice.listening ? voice.transcript : input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="My baby won't sleep…"
            className="min-h-[64px] flex-1 rounded-2xl border border-input bg-muted/40 px-5 text-base outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => (voice.listening ? voice.stop() : voice.start())}
            className="flex min-h-[64px] items-center justify-center gap-2 rounded-2xl border border-border px-6 font-semibold"
          >
            <Mic className="size-5" /> {voice.listening ? "Listening…" : "Speak"}
          </button>
          <button
            type="submit"
            className="flex min-h-[64px] items-center justify-center gap-2 rounded-2xl bg-primary px-7 font-bold text-primary-foreground"
          >
            <Send className="size-5" /> Ask
          </button>
        </form>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {KNOWLEDGE.slice(0, 6).map((entry) => (
          <button
            key={entry.id}
            onClick={() => send(entry.question)}
            className="min-h-[64px] rounded-3xl border border-border/70 px-5 text-left text-sm font-semibold transition hover:border-primary/50"
          >
            {entry.question}
          </button>
        ))}
      </div>
    </section>
  );
}