import type { ReactNode } from "react";
import heroImage from "@/assets/Samuel-Beckett-bridge.jpeg";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-[#F9F8F6]">
      <div className="container-cp relative min-h-[560px] py-20 md:py-24">
        <div className="relative z-10 max-w-[560px]">
          {eyebrow && (
            <span className="eyebrow tracking-[0.22em]">
              {eyebrow}
            </span>
          )}

          <h1 className="mt-5 font-serif text-[48px] leading-[1.05] text-[#1A2B3C] md:text-[68px]">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-6 max-w-[520px] text-[17px] leading-relaxed text-[#5F6B7A]">
              {subtitle}
            </p>
          )}

          {children && <div className="mt-8">{children}</div>}
        </div>

        <div className="absolute inset-y-0 right-0 w-[62%]">
          <img
            src={heroImage}
            alt="Samuel Beckett Bridge, Dublin"
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#F9F8F6] via-[#F9F8F6]/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F9F8F6]/20 to-transparent" />
        </div>
      </div>
    </section>
  );
}
