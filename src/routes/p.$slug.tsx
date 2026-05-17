import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/p/$slug")({
  component: PagePublic,
});

function PagePublic() {
  const { slug } = Route.useParams();
  const { data: page, isLoading } = useQuery({
    queryKey: ["page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <SiteShell>
        <div className="container-cp py-24 text-center" style={{ color: "#6B7280" }}>Loading…</div>
      </SiteShell>
    );
  }
  if (!page) {
    return (
      <SiteShell>
        <div className="container-cp py-24 text-center">
          <h1 className="font-serif text-3xl">Page not found</h1>
          <Link to="/" className="btn-primary mt-6">Back home</Link>
        </div>
      </SiteShell>
    );
  }
  return (
    <SiteShell>
      <section style={{ background: "#F9F8F6" }} className="py-16">
        <div className="container-cp max-w-3xl">
          <h1 className="font-serif text-[44px] leading-tight">{page.title}</h1>
          {page.meta_description && (
            <p className="mt-4 text-[17px]" style={{ color: "#6B7280" }}>{page.meta_description}</p>
          )}
        </div>
      </section>
      <article className="container-cp max-w-3xl py-16">
        {page.featured_image_url && (
          <img src={page.featured_image_url} alt={page.title} className="mb-8 w-full rounded-xl object-cover" />
        )}
        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: page.content ?? "" }} />
      </article>
    </SiteShell>
  );
}
