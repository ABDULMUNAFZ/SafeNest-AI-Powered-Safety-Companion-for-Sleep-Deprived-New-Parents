import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/nesta/AppShell";
import { NightDashboard } from "@/components/nesta/NightDashboard";
import { QuickLog } from "@/components/nesta/QuickLog";
import { VoiceMedicineAssistant } from "@/components/nesta/VoiceMedicineAssistant";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NESTA AI — Postpartum Safety Companion for New Parents" },
      {
        name: "description",
        content:
          "Voice-first postpartum companion: validated infant medicine doses, one-tap baby logging, mood check-ins and instant emergency guidance.",
      },
      { property: "og:title", content: "NESTA AI — Postpartum Safety Companion" },
      {
        property: "og:description",
        content:
          "Ask out loud, get validated infant dosage guidance, log care in one tap, and reach emergency help fast.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <div className="space-y-5">
        <VoiceMedicineAssistant />
        <QuickLog />
        <NightDashboard />
      </div>
    </AppShell>
  );
}
