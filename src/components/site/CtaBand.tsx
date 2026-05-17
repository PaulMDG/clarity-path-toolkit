import { Link } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import type { HomepageContent } from "@/hooks/useSiteSettings";

export function CtaBand({ content }: { content?: HomepageContent["cta_band"] }) {
  const c = {
    heading: content?.heading ?? "Start your journey with clarity.",
    subtext: content?.subtext ?? "Book a consultation today and take the first structured step.",
    button: content?.button ?? "Book a Consultation",
  };
  return (
    <section style={{ background: "#1A2B3C", color: "#fff" }} className="py-16">
      <div className="container-cp flex flex-col items-center gap-8 md:flex-row md:justify-between">
        <div className="flex items-start gap-4 max-w-xl">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
            style={{ background: "rgba(45,106,79,0.18)", color: "#7DD3A8" }}
          >
            <Calendar size={22} />
          </div>
          <div>
            <h2 className="font-serif text-[28px] leading-tight text-white md:text-[34px]">
              {c.heading}
            </h2>
            <p className="mt-2 text-[15px] text-white/70">{c.subtext}</p>
          </div>
        </div>
        <Link
          to="/book-consultation"
          className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-3 text-sm font-medium text-white hover:bg-white hover:text-[#1A2B3C] transition-colors"
        >
          {c.button} →
        </Link>
      </div>
    </section>
  );
}
