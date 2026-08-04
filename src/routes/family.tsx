import { createFileRoute } from "@tanstack/react-router";
import { HeartHandshake, ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/nesta/AppShell";
import { Switch } from "@/components/ui/switch";
import { averageGapMinutes, timeAgo, useCareLogs, useMoods, useProfile } from "@/lib/nesta/store";

export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [
      { title: "Family Dashboard & Baby Profile — NESTA AI" },
      {
        name: "description",
        content:
          "Share a calm live view of feeds, sleep and mood with a partner, and keep the baby's medical details ready for emergencies.",
      },
      { property: "og:title", content: "Family Dashboard — NESTA AI" },
      {
        property: "og:description",
        content: "Partners see the rhythm, the mood trend, and when a gentle check-in is needed.",
      },
    ],
  }),
  component: FamilyPage,
});

const FIELDS = [
  { key: "babyName", label: "Baby's name", type: "text" },
  { key: "parentName", label: "Your name", type: "text" },
  { key: "ageMonths", label: "Age (months)", type: "number" },
  { key: "weightKg", label: "Weight (kg)", type: "number" },
  { key: "bloodGroup", label: "Blood group", type: "text" },
  { key: "allergies", label: "Allergies", type: "text" },
  { key: "pediatrician", label: "Pediatrician", type: "text" },
  { key: "pediatricianPhone", label: "Pediatrician phone", type: "tel" },
  { key: "partnerName", label: "Partner name", type: "text" },
  { key: "partnerPhone", label: "Partner phone", type: "tel" },
  { key: "emergencyNumber", label: "Emergency number", type: "tel" },
] as const;

function FamilyPage() {
  const { profile, save } = useProfile();
  const { logs, lastOf } = useCareLogs();
  const { moods, lowStreak, average } = useMoods();
  const feedGap = averageGapMinutes(logs, "fed", 150);

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="glass-card rounded-[2rem] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-secondary">Family dashboard</p>
          <h1 className="mt-2 font-display text-3xl font-bold">
            What {profile.partnerName} can see
          </h1>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Tile label="Last feed" value={timeAgo(lastOf("fed")?.at)} />
            <Tile label="Usual feed gap" value={`${(feedGap / 60).toFixed(1)} hr`} />
            <Tile label="Last sleep" value={timeAgo(lastOf("slept")?.at)} />
            <Tile label="Last diaper" value={timeAgo(lastOf("diaper")?.at)} />
            <Tile
              label="Mood trend"
              value={moods.length ? `${average.toFixed(1)} / 5` : "No check-ins yet"}
            />
            <Tile label="Low streak" value={`${lowStreak} in a row`} />
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 rounded-3xl bg-muted/40 p-5">
            <div>
              <p className="flex items-center gap-2 font-semibold">
                <HeartHandshake className="size-5 text-accent" /> Send support alerts
              </p>
              <p className="text-sm text-muted-foreground">
                After 3 low check-ins, {profile.partnerName} gets a warm nudge — never an alarm.
              </p>
            </div>
            <Switch
              checked={profile.shareWithPartner}
              onCheckedChange={(checked) => save({ shareWithPartner: checked })}
            />
          </div>
        </section>

        <section className="glass-card rounded-[2rem] p-6">
          <h2 className="font-display text-2xl font-bold">Baby &amp; contacts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Used for dosage lookups and Emergency Mode. Saved on this device only.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <label key={field.key} className="block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  {field.label}
                </span>
                <input
                  type={field.type}
                  value={String(profile[field.key])}
                  onChange={(event) =>
                    save({
                      [field.key]:
                        field.type === "number" ? Number(event.target.value) : event.target.value,
                    })
                  }
                  className="mt-2 min-h-[56px] w-full rounded-2xl border border-input bg-muted/40 px-4 text-base outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
            ))}
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-5 text-success" /> NESTA AI is educational support, not a
            replacement for your doctor.
          </p>
        </section>
      </div>
    </AppShell>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-muted/40 p-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}