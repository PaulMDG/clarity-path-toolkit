import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Icon } from "@/lib/icons";

export function ServicesSection() {
  const { data: services } = useQuery({
    queryKey: ["services_published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id,title,slug,icon,short_description")
        .eq("status", "published")
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <section className="py-20 md:py-24">
      <div className="container-cp">
        <div className="mb-14 max-w-2xl">
          <span className="eyebrow">OUR SERVICES</span>
          <h2 className="mt-4 font-serif text-[36px] leading-tight md:text-[44px]">
            Support at every step of your journey
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services?.map((s) => (
            <Link
              key={s.id}
              to="/services/$slug"
              params={{ slug: s.slug }}
              className="card-cp flex flex-col"
            >
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: "#EAF3EE" }}
              >
                <Icon name={s.icon ?? "Compass"} size={22} color="#2D6A4F" />
              </div>
              <h3 className="font-serif text-[20px]" style={{ color: "#1A2B3C" }}>{s.title}</h3>
              <p className="mt-3 flex-1 text-[14px] leading-relaxed" style={{ color: "#6B7280" }}>
                {s.short_description}
              </p>
              <span className="mt-5 inline-flex items-center gap-1 text-[14px] font-medium" style={{ color: "#2D6A4F" }}>
                Learn More →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
