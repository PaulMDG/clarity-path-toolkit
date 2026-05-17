import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { supabase } from "@/integrations/supabase/client";
import { Download, ExternalLink, FileText } from "lucide-react";

export const Route = createFileRoute("/resources")({
  component: Resources,
  head: () => ({ meta: [{ title: "Resources | ClarityPath" }] }),
});

const types = ["all", "article", "pdf", "guide", "checklist", "external_link"] as const;

function Resources() {
  const [filter, setFilter] = useState<(typeof types)[number]>("all");
  const { data } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const filtered = (data ?? []).filter((r) => filter === "all" || r.type === filter);
  return (
    <SiteShell>
      <PageHero eyebrow="RESOURCES" title="Helpful articles, guides and checklists." />
      <section className="py-16">
        <div className="container-cp">
          <div className="mb-8 flex flex-wrap gap-2">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  filter === t ? "bg-[#2D6A4F] text-white border-[#2D6A4F]" : "bg-white text-[#1A2B3C]"
                }`}
                style={{ borderColor: filter === t ? "#2D6A4F" : "#E5E7EB" }}
              >
                {t === "all" ? "All" : t.replace("_", " ")}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <p style={{ color: "#6B7280" }}>No resources published yet.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => (
                <div key={r.id} className="card-cp flex flex-col">
                  <span className="inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider" style={{ background: "#EAF3EE", color: "#2D6A4F" }}>{r.type.replace("_", " ")}</span>
                  <h3 className="mt-4 font-serif text-[20px]">{r.title}</h3>
                  <p className="mt-2 flex-1 text-[14px]" style={{ color: "#6B7280" }}>{r.description}</p>
                  {(r.file_url || r.external_url) && (
                    <a
                      href={r.file_url || r.external_url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex items-center gap-2 text-sm font-medium"
                      style={{ color: "#2D6A4F" }}
                    >
                      {r.type === "external_link" ? <ExternalLink size={14} /> : r.type === "pdf" ? <Download size={14} /> : <FileText size={14} />}
                      {r.type === "external_link" ? "Visit" : "Open"}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
