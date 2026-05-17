import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, NewButton, Card, StatusBadge } from "@/components/admin/AdminUI";
import { toast } from "sonner";
import { Pencil, Trash2, Star } from "lucide-react";

export const Route = createFileRoute("/admin/testimonials/")({ component: TList });

function TList() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const del = async (id: string) => {
    if (!confirm("Delete testimonial?")) return;
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-testimonials"] }); }
  };
  return (
    <div>
      <PageHeader title="Testimonials" action={<NewButton to="/admin/testimonials/new" label="New testimonial" />} />
      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="px-4 py-3">Client</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Rating</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {data?.map((t) => (
              <tr key={t.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{t.client_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.location ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {t.rating ? <span className="inline-flex items-center gap-0.5">{t.rating}<Star size={12} /></span> : "—"}
                </td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Link to="/admin/testimonials/$id" params={{ id: t.id }} className="rounded p-1.5 hover:bg-muted"><Pencil size={14} /></Link>
                    <button onClick={() => del(t.id)} className="rounded p-1.5 text-destructive hover:bg-muted"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {data?.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No testimonials yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
