import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, subtitle, children }: { eyebrow?: string; title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <section style={{ background: "#F9F8F6" }} className="py-16 md:py-20">
      <div className="container-cp max-w-3xl">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="mt-4 font-serif text-[40px] leading-tight md:text-[52px]">{title}</h1>
        {subtitle && <p className="mt-5 text-[17px] leading-relaxed" style={{ color: "#6B7280" }}>{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
