import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { CtaBand } from "@/components/site/CtaBand";
import { supabase } from "@/integrations/supabase/client";
import { Icon } from "@/lib/icons";

export const Route = createFileRoute("/services/$slug")({
  component: ServiceDetail,
});

function ServiceDetail() {
  const { slug } = Route.useParams();
  const { data: service, isLoading } = useQuery({
    queryKey: ["service", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <SiteShell>
        <div className="container-cp py-24 text-center" style={{ color: "#6B7280" }}>Loading…</div>
      </SiteShell>
    );
  }

  if (!service) {
    return (
      <SiteShell>
        <div className="container-cp py-24 text-center">
          <h1 className="font-serif text-3xl">Service not found</h1>
          <Link to="/services" className="btn-primary mt-6">Back to services</Link>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section style={{ background: "#F9F8F6" }} className="py-16 md:py-20">
        <div className="container-cp max-w-3xl">
          <Link to="/services" className="text-sm font-medium" style={{ color: "#2D6A4F" }}>← All services</Link>
          <div className="mt-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "#EAF3EE" }}>
              <Icon name={service.icon ?? "Compass"} size={24} color="#2D6A4F" />
            </div>
            <h1 className="font-serif text-[40px] leading-tight md:text-[52px]">{service.title}</h1>
          </div>
          {service.short_description && (
            <p className="mt-5 text-[17px]" style={{ color: "#6B7280" }}>{service.short_description}</p>
          )}
        </div>
      </section>
      <section className="py-16">
        <div className="container-cp max-w-3xl">
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: service.content ?? "" }}
          />
          <Link to="/book-consultation" className="btn-primary mt-10">Book a Consultation →</Link>
        </div>
      </section>
      <CtaBand />
    </SiteShell>
  );
}
