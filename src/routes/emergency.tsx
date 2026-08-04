import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Hospital, Phone, Stethoscope, Users } from "lucide-react";

import { clockTime, timeAgo, useCareLogs, useProfile } from "@/lib/nesta/store";

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency Mode — NESTA AI" },
      {
        name: "description",
        content:
          "Oversized one-tap emergency calling, hospital search, baby medical details and recent medicine history for stressful moments.",
      },
      { property: "og:title", content: "Emergency Mode — NESTA AI" },
      {
        property: "og:description",
        content: "Everything a paramedic or doctor asks for, on one calm screen.",
      },
    ],
  }),
  component: EmergencyPage,
});

function EmergencyPage() {
  const { profile } = useProfile();
  const { logs } = useCareLogs();
  const recentMedicine = logs.filter((l) => l.kind === "medicine").slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl space-y-4 px-5 py-8">
        <div className="rounded-[2rem] border border-destructive/50 bg-destructive/15 p-6 text-center">
          <AlertTriangle className="mx-auto size-12 text-destructive" />
          <h1 className="mt-3 font-display text-4xl font-bold text-destructive">Emergency Mode</h1>
          <p className="mt-2 text-lg">
            If your baby is struggling to breathe, blue, limp, or having a seizure — call now.
          </p>
        </div>

        <a
          href={`tel:${profile.emergencyNumber}`}
          className="flex min-h-[96px] items-center justify-center gap-4 rounded-[2rem] bg-destructive text-2xl font-bold text-destructive-foreground"
        >
          <Phone className="size-8" /> Call {profile.emergencyNumber}
        </a>

        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href={`tel:${profile.pediatricianPhone}`}
            className="glass-card flex min-h-[88px] items-center gap-4 rounded-3xl px-6 text-lg font-semibold"
          >
            <Stethoscope className="size-7 text-primary" />
            <span>
              Pediatrician
              <span className="block text-sm font-normal text-muted-foreground">
                {profile.pediatrician}
              </span>
            </span>
          </a>
          <a
            href={`tel:${profile.partnerPhone}`}
            className="glass-card flex min-h-[88px] items-center gap-4 rounded-3xl px-6 text-lg font-semibold"
          >
            <Users className="size-7 text-accent" />
            <span>
              {profile.partnerName}
              <span className="block text-sm font-normal text-muted-foreground">Call partner</span>
            </span>
          </a>
          <a
            href="https://www.google.com/maps/search/hospital+emergency+near+me"
            target="_blank"
            rel="noreferrer"
            className="glass-card flex min-h-[88px] items-center gap-4 rounded-3xl px-6 text-lg font-semibold sm:col-span-2"
          >
            <Hospital className="size-7 text-secondary" />
            Nearest hospital &amp; emergency room
          </a>
        </div>

        <section className="glass-card rounded-[2rem] p-6">
          <h2 className="font-display text-2xl font-bold">Show this to the medic</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <Row label="Baby" value={`${profile.babyName}, ${Math.round(profile.ageMonths)} months`} />
            <Row label="Weight" value={`${profile.weightKg} kg`} />
            <Row label="Blood group" value={profile.bloodGroup} />
            <Row label="Allergies" value={profile.allergies} />
            <Row label="Last feed" value={timeAgo(logs.find((l) => l.kind === "fed")?.at)} />
            <Row label="Last sleep" value={timeAgo(logs.find((l) => l.kind === "slept")?.at)} />
          </dl>
          <div className="mt-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Recent medicine</p>
            {recentMedicine.length ? (
              <ul className="mt-2 space-y-2">
                {recentMedicine.map((log) => (
                  <li key={log.id} className="rounded-2xl bg-muted/40 p-3 text-base">
                    {log.note ?? "Medicine given"} · {clockTime(log.at)} ({timeAgo(log.at)})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-base text-muted-foreground">No medicine logged recently.</p>
            )}
          </div>
        </section>

        <Link
          to="/"
          className="flex min-h-[72px] items-center justify-center rounded-3xl border border-border text-lg font-semibold"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="text-xl font-semibold">{value}</dd>
    </div>
  );
}