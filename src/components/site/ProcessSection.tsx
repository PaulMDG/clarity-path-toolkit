import { Icon } from "@/lib/icons";
import type { HomepageContent } from "@/hooks/useSiteSettings";

const defaults: NonNullable<HomepageContent["process_steps"]> = [
  { icon: "Calendar", number: "01", title: "Book a Consultation", description: "Schedule an initial call to discuss your situation." },
  { icon: "Search", number: "02", title: "Review Your Situation", description: "We review your circumstances and identify the best pathway." },
  { icon: "FileCheck", number: "03", title: "Prepare & Organise", description: "Organise documentation clearly and completely." },
  { icon: "ArrowRight", number: "04", title: "Move Forward with Confidence", description: "Proceed with clarity at every stage of the journey." },
];

export function ProcessSection({ steps }: { steps?: HomepageContent["process_steps"] }) {
  const list = steps && steps.length ? steps : defaults;
  return (
    <section className="py-20 md:py-24" style={{ background: "#F9F8F6" }}>
      <div className="container-cp">
        <div className="mb-14 max-w-2xl">
          <span className="eyebrow">OUR PROCESS</span>
          <h2 className="mt-4 font-serif text-[36px] leading-tight md:text-[44px]">
            A clearer path forward
          </h2>
        </div>
        <div className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div
            className="absolute left-6 right-6 top-6 hidden h-px lg:block"
            style={{ background: "#2D6A4F", opacity: 0.25 }}
          />
          {list.map((s) => (
            <div key={s.number} className="relative">
              <div
                className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: "#FFFFFF", border: "1px solid #2D6A4F" }}
              >
                <Icon name={s.icon} size={20} color="#2D6A4F" />
              </div>
              <div className="mt-5 font-serif text-[28px]" style={{ color: "#1A2B3C", opacity: 0.4 }}>{s.number}</div>
              <h3 className="mt-1 font-serif text-[20px]" style={{ color: "#1A2B3C" }}>{s.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "#6B7280" }}>{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
