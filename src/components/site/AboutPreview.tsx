import { Link } from "@tanstack/react-router";
import aboutImg from "@/assets/about-office.jpg";
import type { HomepageContent } from "@/hooks/useSiteSettings";

const defaults: NonNullable<HomepageContent["about"]> = {
  eyebrow: "ABOUT US",
  heading: "Built around clarity, not confusion.",
  p1: "Immigration processes can feel overwhelming. We provide structured, calm support to help you understand each step.",
  p2: "Our approach is consultation-based, confidential, and focused on giving you the clarity and confidence to move forward.",
  cta: "Learn More About Us",
};

export function AboutPreview({ content }: { content?: HomepageContent["about"] }) {
  const c = { ...defaults, ...(content ?? {}) };
  return (
    <section className="py-20 md:py-24">
      <div className="container-cp grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="eyebrow">{c.eyebrow}</span>
          <h2 className="mt-4 font-serif text-[36px] leading-tight md:text-[44px]">{c.heading}</h2>
          <p className="mt-6 text-[16px] leading-relaxed" style={{ color: "#6B7280" }}>{c.p1}</p>
          <p className="mt-4 text-[16px] leading-relaxed" style={{ color: "#6B7280" }}>{c.p2}</p>
          <Link to="/about" className="btn-secondary mt-8">{c.cta} →</Link>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ background: "#F9F8F6" }}>
          <img src={aboutImg} alt="ClarityPath consultation" className="w-full object-cover" loading="lazy" width={1024} height={896} />
        </div>
      </div>
    </section>
  );
}
