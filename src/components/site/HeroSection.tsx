import { Link } from "@tanstack/react-router";
import heroImg from "@/assets/Samuel-Beckett-bridge.jpg";
import { Icon } from "@/lib/icons";
import type { HomepageContent } from "@/hooks/useSiteSettings";

const defaults: NonNullable<HomepageContent["hero"]> = {
  eyebrow: "STRUCTURED GUIDANCE. CLEARER FUTURES.",
  headline_pre: "Clear guidance through the",
  headline_accent: "Irish",
  headline_post: "immigration journey.",
  subheading:
    "We help individuals and families prepare documentation, understand next steps, and navigate immigration processes with greater clarity and confidence.",
  primary_cta: "Book a Consultation",
  secondary_cta: "Learn More",
  trust_indicators: [
    { icon: "Lock", label: "Confidential Support" },
    { icon: "ClipboardList", label: "Structured Guidance" },
    { icon: "Globe", label: "Ireland Focused" },
    { icon: "MessageCircle", label: "Consultation Based Approach" },
  ],
};

export function HeroSection({ content }: { content?: HomepageContent["hero"] }) {
  const c = { ...defaults, ...(content ?? {}) };
  return (
  <section className="relative -mt-px min-h-[calc(100vh-72px)] overflow-hidden bg-white">
    <div className="relative min-h-[calc(100vh-72px)]">
      {/* Right full-screen image */}
      <div className="absolute inset-y-0 right-0 w-full lg:w-[62%]">
        <img
          src={heroImg}
          alt="Samuel Beckett Bridge, Dublin"
          className="h-full w-full object-cover"
          width={1280}
          height={1024}
        />

        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{
            background:
              "linear-gradient(to right, #FFFFFF 0%, rgba(255,255,255,0.92) 18%, rgba(255,255,255,0.55) 34%, transparent 58%)",
          }}
        />
      </div>

      {/* Left content */}
      <div className="container-cp relative z-10 flex min-h-[calc(100vh-72px)] items-center">
        <div className="max-w-[660px] py-12 md:py-16">
          <span className="eyebrow">{c.eyebrow}</span>

          <h1 className="mt-5 font-serif text-[42px] leading-[1.05] tracking-tight md:text-[60px] lg:text-[72px]">
            {c.headline_pre}{" "}
            <em
              className="not-italic"
              style={{ color: "#2D6A4F", fontStyle: "italic" }}
            >
              {c.headline_accent}
            </em>{" "}
            {c.headline_post}
          </h1>

          <p
            className="mt-6 max-w-xl text-[17px] leading-relaxed"
            style={{ color: "#6B7280" }}
          >
            {c.subheading}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/book-consultation" className="btn-primary">
              {c.primary_cta} →
            </Link>
            <Link to="/about" className="btn-secondary">
              {c.secondary_cta} →
            </Link>
          </div>
 
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
            {c.trust_indicators?.map((t) => (
              <div
                key={t.label}
                className="flex items-center gap-2 text-[13px]"
                style={{ color: "#1A2B3C" }}
              >
                <Icon name={t.icon} size={16} color="#2D6A4F" />
                <span className="font-medium">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);
