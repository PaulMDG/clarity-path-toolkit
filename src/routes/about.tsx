import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { AboutPreview } from "@/components/site/AboutPreview";
import { CtaBand } from "@/components/site/CtaBand";
import { Shield, Users, BadgeCheck, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({ meta: [{ title: "About | ClarityPath" }] }),
});

const values = [
  { icon: Shield, title: "Confidential", desc: "Every conversation is private and handled with care." },
  { icon: Users, title: "Personal", desc: "Guidance tailored to your unique circumstances." },
  { icon: BadgeCheck, title: "Structured", desc: "Clear next steps so you always know where you stand." },
  { icon: MessageCircle, title: "Honest", desc: "Plain-language advice without overpromising." },
];

function About() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="ABOUT US"
        title="Helping people move forward with clarity."
        subtitle="ClarityPath provides structured, calm support for individuals and families navigating the Irish immigration system."
      />
      <AboutPreview />
      <section className="py-20" style={{ background: "#F9F8F6" }}>
        <div className="container-cp">
          <div className="mb-12 max-w-2xl">
            <span className="eyebrow">OUR APPROACH</span>
            <h2 className="mt-4 font-serif text-[36px]">Four principles guide our work</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="card-cp">
                <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "#EAF3EE" }}>
                  <v.icon size={20} color="#2D6A4F" />
                </div>
                <h3 className="mt-5 font-serif text-[20px]">{v.title}</h3>
                <p className="mt-2 text-[14px]" style={{ color: "#6B7280" }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </SiteShell>
  );
}
