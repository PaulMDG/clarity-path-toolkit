import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function TestimonialsSection() {
  const { data } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("status", "published")
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <section className="py-20 md:py-24" style={{ background: "#F9F8F6" }}>
      <div className="container-cp">
        <div className="mb-14 max-w-2xl">
          <span className="eyebrow">WHAT OUR CLIENTS SAY</span>
          <h2 className="mt-4 font-serif text-[36px] leading-tight md:text-[44px]">
            Real people. Real results.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {data?.map((t) => (
            <div key={t.id} className="card-cp">
              <div className="font-serif text-5xl leading-none" style={{ color: "#2D6A4F" }}>“</div>
              <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "#1A2B3C" }}>
                {t.testimonial_text}
              </p>
              <div className="mt-6 text-[14px] font-semibold" style={{ color: "#1A2B3C" }}>
                — {t.client_name}
              </div>
              {t.location && (
                <div className="text-[13px]" style={{ color: "#6B7280" }}>{t.location}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
