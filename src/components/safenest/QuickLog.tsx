import { motion, AnimatePresence } from "motion/react";
import { Baby, Droplets, Moon, Pill, Plus, X, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { speak } from "@/lib/safenest/speech";
import { timeAgo, useCareLogs, type LogKind } from "@/lib/safenest/store";

const ACTIONS: Array<{ kind: LogKind; label: string; icon: typeof Baby; tone: string; placeholder: string }> = [
  { kind: "fed", label: "Fed", icon: Baby, tone: "text-primary", placeholder: "e.g. 120 ml formula, breast 15m" },
  { kind: "slept", label: "Slept", icon: Moon, tone: "text-secondary", placeholder: "e.g. Napped for 45 mins" },
  { kind: "diaper", label: "Diaper", icon: Droplets, tone: "text-accent", placeholder: "e.g. Wet and dirty" },
  { kind: "medicine", label: "Medicine", icon: Pill, tone: "text-success", placeholder: "e.g. Calpol 2.0 ml" },
];

export function QuickLog() {
  const { addLog, lastOf } = useCareLogs();
  const [activeLogKind, setActiveLogKind] = useState<LogKind | null>(null);
  const [note, setNote] = useState("");

  const handleLog = (kind: LogKind) => {
    const actionObj = ACTIONS.find((a) => a.kind === kind)!;
    const finalNote = note.trim() || undefined;
    addLog(kind, finalNote);
    
    toast.success(`${actionObj.label} logged`, { 
      description: finalNote ? `Saved: "${finalNote}"` : "Saved just now" 
    });
    
    speak(finalNote ? `${actionObj.label} logged. Note: ${finalNote}.` : `${actionObj.label} logged.`);
    setNote("");
    setActiveLogKind(null);
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ACTIONS.map(({ kind, label, icon: Icon, tone }) => {
          const isSelected = activeLogKind === kind;
          return (
            <motion.button
              key={kind}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                if (isSelected) {
                  setActiveLogKind(null);
                } else {
                  setActiveLogKind(kind);
                  setNote("");
                }
              }}
              className={cn(
                "glass-card flex min-h-[108px] flex-col items-start justify-between rounded-lg p-4 text-left border transition-all cursor-pointer shadow-sm relative overflow-hidden",
                isSelected 
                  ? "bg-primary border-primary text-white" 
                  : "bg-white border-border text-foreground hover:border-primary/60"
              )}
            >
              <div className="flex w-full items-center justify-between">
                <Icon className={cn("size-6 transition-transform", isSelected ? "text-white" : tone)} />
                {isSelected ? (
                  <span className="size-1.5 rounded-full bg-white animate-ping" />
                ) : (
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground select-none">
                    LOG
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="font-display text-base font-black uppercase tracking-tight leading-none">{label}</p>
                <p className={cn("text-[9px] font-bold mt-1.5", isSelected ? "text-white/80" : "text-muted-foreground")}>
                  {timeAgo(lastOf(kind)?.at)}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Slide-out Custom Detail Form */}
      <AnimatePresence>
        {activeLogKind && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card rounded-2xl p-4 border border-primary/25 bg-primary/5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Log Details for {ACTIONS.find((a) => a.kind === activeLogKind)?.label}
                </p>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={ACTIONS.find((a) => a.kind === activeLogKind)?.placeholder}
                  className="mt-1 h-10 w-full rounded-xl border border-input bg-background/50 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLog(activeLogKind);
                  }}
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setActiveLogKind(null)}
                  className="flex size-10 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                  <X className="size-4" />
                </button>
                <button
                  onClick={() => handleLog(activeLogKind)}
                  className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 font-bold text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer"
                >
                  <Check className="size-4" /> Save
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}