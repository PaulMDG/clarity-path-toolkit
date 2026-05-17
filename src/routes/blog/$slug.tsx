import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/blog/$slug")({
  component: Post,
});

function Post() {
  const { slug } = Route.useParams();
  const { data: post, isLoading } = useQuery({
    queryKey: ["blog_post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <SiteShell><div className="container-cp py-24 text-center" style={{ color: "#6B7280" }}>Loading…</div></SiteShell>;
  if (!post) return <SiteShell><div className="container-cp py-24 text-center"><h1 className="font-serif text-3xl">Post not found</h1><Link to="/blog" className="btn-primary mt-6">Back to blog</Link></div></SiteShell>;
  return (
    <SiteShell>
      <article className="container-cp max-w-3xl py-16">
        <Link to="/blog" className="text-sm font-medium" style={{ color: "#2D6A4F" }}>← All posts</Link>
        <h1 className="mt-6 font-serif text-[44px] leading-tight">{post.title}</h1>
        {post.published_at && <div className="mt-3 text-sm" style={{ color: "#6B7280" }}>{new Date(post.published_at).toLocaleDateString()}</div>}
        {post.featured_image_url && <img src={post.featured_image_url} alt={post.title} className="mt-8 w-full rounded-xl object-cover" />}
        <div className="prose prose-lg mt-8 max-w-none" dangerouslySetInnerHTML={{ __html: post.content ?? "" }} />
      </article>
    </SiteShell>
  );
}
