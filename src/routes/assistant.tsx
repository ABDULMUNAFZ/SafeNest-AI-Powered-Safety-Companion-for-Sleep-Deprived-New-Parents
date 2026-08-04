import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/safenest/AppShell";
import { ParentChat } from "@/components/safenest/ParentChat";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Parent Assistant — SafeNest AI" },
      {
        name: "description",
        content:
          "Voice-first answers on newborn feeding, sleep, teething and breastfeeding, sourced from WHO, NHS, CDC and AAP guidance.",
      },
      { property: "og:title", content: "AI Parent Assistant — SafeNest AI" },
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