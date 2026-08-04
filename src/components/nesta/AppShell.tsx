import { Link, useRouterState } from "@tanstack/react-router";
import { Baby, Clock, HeartHandshake, MessageCircleHeart, Siren, Users } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Baby },
  { to: "/timeline", label: "Timeline", icon: Clock },
  { to: "/wellbeing", label: "You", icon: HeartHandshake },
  { to: "/assistant", label: "Ask", icon: MessageCircleHeart },
  { to: "/family", label: "Family", icon: Users },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative min-h-screen bg-background">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px] opacity-70"
        style={{ background: "var(--gradient-halo)" }}
      />
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-5 pt-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Baby className="size-6" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            NESTA<span className="text-primary"> AI</span>
          </span>
        </Link>
        <Link
          to="/emergency"
          className="flex h-12 items-center gap-2 rounded-full bg-destructive/15 px-5 text-sm font-semibold text-destructive ring-1 ring-destructive/40 transition hover:bg-destructive/25"
        >
          <Siren className="size-5" />
          Emergency
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-5 pt-6 pb-36">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-stretch justify-between px-2 py-2">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold transition",
                  active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-6" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}