import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { HeroSection } from "@/components/site/HeroSection";
import { ServicesSection } from "@/components/site/ServicesSection";
import { ProcessSection } from "@/components/site/ProcessSection";
import { AboutPreview } from "@/components/site/AboutPreview";
import { TestimonialsSection } from "@/components/site/TestimonialsSection";
import { CtaBand } from "@/components/site/CtaBand";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "ClarityPath | Ireland Immigration Support" },
      {
        name: "description",
        content:
          "Clear, structured guidance through the Irish immigration journey. Book a consultation with ClarityPath.",
      },
    ],
  }),
});

function Index() {
  const { data: settings } = useSiteSettings();
  const hc = settings?.homepage_content ?? {};
  return (
    <SiteShell>
      <HeroSection content={hc.hero} />
      <ServicesSection />
      <ProcessSection steps={hc.process_steps} />
      <AboutPreview content={hc.about} />
      <TestimonialsSection />
      <CtaBand content={hc.cta_band} />
    </SiteShell>
  );
}
