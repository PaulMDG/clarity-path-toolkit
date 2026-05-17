import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Card } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const tiles: { table: string; label: string; to: string }[] = [
  { table: "services", label: "Services", to: "/admin/services" },
  { table: "blog_posts", label: "Blog posts", to: "/admin/blog" },
  { table: "pages", label: "Pages", to: "/admin/pages" },
  { table: "resources", label: "Resources", to: "/admin/resources" },
  { table: "faqs", label: "FAQs", to: "/admin/faqs" },
  { table: "testimonials", label: "Testimonials", to: "/admin/testimonials" },
  { table: "bookings", label: "Bookings", to: "/admin/bookings" },
  { table: "contact_submissions", label: "Contact messages", to: "/admin/contact" },
];

function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ["admin-counts"],
    queryFn: async () => {
      const entries = await Promise.all(
        tiles.map(async (t) => {
          const { count } = await supabase
            .from(t.table as never)
            .select("*", { count: "exact", head: true });
          return [t.table, count ?? 0] as const;
        }),
      );
      return Object.fromEntries(entries);
    },
  });

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your content." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.table} to={t.to} className="block">
            <Card className="transition-shadow hover:shadow-md">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {t.label}
              </div>
              <div className="mt-2 font-serif text-3xl" style={{ color: "#1A2B3C" }}>
                {data?.[t.table] ?? "—"}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
