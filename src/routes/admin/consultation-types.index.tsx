import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, NewButton, Card } from "@/components/admin/AdminUI";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/consultation-types/")({ component: CtList });

function CtList() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-ct"],
    queryFn: async () => {
      const { data, error } = await supabase.from("consultation_types").select("*").order("price_cents");
      if (error) throw error;
      return data ?? [];
    },
  });
  const del = async (id: string) => {
    if (!confirm("Delete consultation type?")) return;
    const { error } = await supabase.from("consultation_types").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-ct"] }); }
  };
  return (
    <div>
      <PageHeader title="Consultation types" action={<NewButton to="/admin/consultation-types/new" label="New type" />} />
      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Duration</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Active</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {data?.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{c.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.duration_minutes} min</td>
                <td className="px-4 py-3 text-muted-foreground">{((c.price_cents ?? 0) / 100).toFixed(2)} €</td>
                <td className="px-4 py-3">{c.is_active ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Link to="/admin/consultation-types/$id" params={{ id: c.id }} className="rounded p-1.5 hover:bg-muted"><Pencil size={14} /></Link>
                    <button onClick={() => del(c.id)} className="rounded p-1.5 text-destructive hover:bg-muted"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {data?.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No types yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
