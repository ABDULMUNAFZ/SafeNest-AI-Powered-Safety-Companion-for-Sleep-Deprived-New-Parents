import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/nesta/AppShell";
import { MoodCheck } from "@/components/nesta/MoodCheck";

export const Route = createFileRoute("/wellbeing")({
  head: () => ({
    meta: [
      { title: "Your Wellbeing Check-in — NESTA AI" },
      {
        name: "description",
        content:
          "A gentle one-tap daily mood check-in with EPDS-inspired trend spotting and compassionate partner support alerts.",
      },
      { property: "og:title", content: "Your Wellbeing Check-in — NESTA AI" },
      {
        property: "og:description",
        content: "Track how you're really doing and get nudged towards support before things get heavy.",
      },
    ],
  }),
  component: WellbeingPage,
});

function WellbeingPage() {
  return (
    <AppShell>
      <MoodCheck />
    </AppShell>
  );
}