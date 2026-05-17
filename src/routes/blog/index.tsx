import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/blog/")({
  component: Blog,
  head: () => ({ meta: [{ title: "Blog | ClarityPath" }] }),
});

function Blog() {
  const { data } = useQuery({
    queryKey: ["blog_posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*, blog_categories(name, slug)")
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  return (
    <SiteShell>
      <PageHero eyebrow="BLOG" title="Insights and updates." />
      <section className="py-16">
        <div className="container-cp">
          {data?.length ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {data.map((p) => (
                <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }} className="card-cp flex flex-col">
                  {p.featured_image_url && (
                    <img src={p.featured_image_url} alt={p.title} className="mb-4 h-48 w-full rounded-lg object-cover" loading="lazy" />
                  )}
                  <h3 className="font-serif text-[20px]">{p.title}</h3>
                  <p className="mt-2 flex-1 text-[14px]" style={{ color: "#6B7280" }}>{p.excerpt}</p>
                  <span className="mt-4 text-sm font-medium" style={{ color: "#2D6A4F" }}>Read More →</span>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ color: "#6B7280" }}>No posts published yet.</p>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
