import { motion } from "motion/react";
import { Baby, Droplets, Moon, Pill } from "lucide-react";
import { toast } from "sonner";

import { speak } from "@/lib/nesta/speech";
import { timeAgo, useCareLogs, type LogKind } from "@/lib/nesta/store";

const ACTIONS: Array<{ kind: LogKind; label: string; icon: typeof Baby; tone: string }> = [
  { kind: "fed", label: "Fed", icon: Baby, tone: "text-primary" },
  { kind: "slept", label: "Slept", icon: Moon, tone: "text-secondary" },
  { kind: "diaper", label: "Diaper", icon: Droplets, tone: "text-accent" },
  { kind: "medicine", label: "Medicine", icon: Pill, tone: "text-success" },
];

export function QuickLog() {
  const { addLog, lastOf } = useCareLogs();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ACTIONS.map(({ kind, label, icon: Icon, tone }) => (
        <motion.button
          key={kind}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            addLog(kind);
            toast.success(`${label} logged`, { description: "Saved just now" });
            speak(`${label} logged.`);
          }}
          className="glass-card flex min-h-[112px] flex-col items-start justify-between rounded-3xl p-5 text-left transition hover:border-primary/50"
        >
          <Icon className={`size-8 ${tone}`} />
          <div>
            <p className="font-display text-2xl font-bold">{label}</p>
            <p className="text-xs text-muted-foreground">{timeAgo(lastOf(kind)?.at)}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}