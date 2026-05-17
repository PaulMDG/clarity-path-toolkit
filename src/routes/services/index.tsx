import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { ServicesSection } from "@/components/site/ServicesSection";
import { CtaBand } from "@/components/site/CtaBand";

export const Route = createFileRoute("/services/")({
  component: Services,
  head: () => ({ meta: [{ title: "Services | ClarityPath" }] }),
});

function Services() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="OUR SERVICES"
        title="Structured support at every step."
        subtitle="From your first question to the final document, we provide clear, calm guidance."
      />
      <ServicesSection />
      <CtaBand />
    </SiteShell>
  );
}
