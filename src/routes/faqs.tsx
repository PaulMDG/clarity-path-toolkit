import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/faqs")({
  component: FAQs,
  head: () => ({ meta: [{ title: "FAQs | ClarityPath" }] }),
});

function FAQs() {
  const { data } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("faqs").select("*").order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });
  return (
    <SiteShell>
      <PageHero eyebrow="FAQS" title="Frequently asked questions." />
      <section className="py-16">
        <div className="container-cp max-w-3xl space-y-3">
          {data?.map((f) => <Item key={f.id} q={f.question} a={f.answer} />)}
        </div>
      </section>
      <CtaBand />
    </SiteShell>
  );
}

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border" style={{ borderColor: "#E5E7EB", background: "#fff" }}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-5 text-left">
        <span className="font-serif text-[18px]" style={{ color: "#1A2B3C" }}>{q}</span>
        <ChevronDown size={18} className={`transition-transform ${open ? "rotate-180" : ""}`} color="#2D6A4F" />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <div className="prose max-w-none text-[15px]" style={{ color: "#6B7280" }} dangerouslySetInnerHTML={{ __html: a }} />
        </div>
      )}
    </div>
  );
}
