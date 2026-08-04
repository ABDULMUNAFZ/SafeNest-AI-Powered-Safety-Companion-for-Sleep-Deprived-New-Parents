import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/nesta/AppShell";
import { ParentChat } from "@/components/nesta/ParentChat";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Parent Assistant — NESTA AI" },
      {
        name: "description",
        content:
          "Voice-first answers on newborn feeding, sleep, teething and breastfeeding, sourced from WHO, NHS, CDC and AAP guidance.",
      },
      { property: "og:title", content: "AI Parent Assistant — NESTA AI" },
      {
        property: "og:description",
        content: "Ask out loud and hear evidence-based newborn care answers with their sources.",
      },
    ],
  }),
  component: AssistantPage,
});

function AssistantPage() {
  return (
    <AppShell>
      <ParentChat />
    </AppShell>
  );
}