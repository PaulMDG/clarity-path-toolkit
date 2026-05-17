import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";

export const Route = createFileRoute("/privacy-policy")({
  component: () => (
    <SiteShell>
      <PageHero eyebrow="LEGAL" title="Privacy Policy" />
      <section className="py-16">
        <div className="container-cp max-w-3xl prose prose-lg">
          <p>This Privacy Policy describes how ClarityPath collects, uses, and protects your personal information.</p>
          <p><em>This is placeholder content. Update via Admin → Pages.</em></p>
        </div>
      </section>
    </SiteShell>
  ),
});
