import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://clarity-path-toolkit.lovable.app";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
        );

        const [services, posts, pages] = await Promise.all([
          supabase.from("services").select("slug, updated_at").eq("status", "published"),
          supabase.from("blog_posts").select("slug, updated_at").eq("status", "published"),
          supabase.from("pages").select("slug, updated_at").eq("status", "published"),
        ]);

        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/about", changefreq: "monthly", priority: "0.8" },
          { path: "/services", changefreq: "weekly", priority: "0.9" },
          { path: "/resources", changefreq: "weekly", priority: "0.7" },
          { path: "/blog", changefreq: "weekly", priority: "0.8" },
          { path: "/faqs", changefreq: "monthly", priority: "0.6" },
          { path: "/contact", changefreq: "monthly", priority: "0.6" },
          { path: "/book-consultation", changefreq: "monthly", priority: "0.9" },
          { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
          { path: "/terms-and-conditions", changefreq: "yearly", priority: "0.3" },
        ];

        for (const s of services.data ?? []) {
          entries.push({ path: `/services/${s.slug}`, lastmod: s.updated_at ?? undefined, changefreq: "monthly", priority: "0.8" });
        }
        for (const p of posts.data ?? []) {
          entries.push({ path: `/blog/${p.slug}`, lastmod: p.updated_at ?? undefined, changefreq: "monthly", priority: "0.7" });
        }
        for (const pg of pages.data ?? []) {
          entries.push({ path: `/p/${pg.slug}`, lastmod: pg.updated_at ?? undefined, changefreq: "monthly", priority: "0.6" });
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ].filter(Boolean).join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
