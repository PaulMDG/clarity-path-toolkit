import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";

export const Route = createFileRoute("/terms-and-conditions")({
  component: () => (
    <SiteShell>
      <PageHero eyebrow="LEGAL" title="Terms & Conditions" />
      <section className="py-16">
        <div className="container-cp max-w-3xl prose prose-lg">
          <p>These terms govern your use of the ClarityPath website and services.</p>
          <p><em>This is placeholder content. Update via Admin → Pages.</em></p>
        </div>
      </section>
    </SiteShell>
  ),
});
