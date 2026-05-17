import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, NewButton, Card, StatusBadge } from "@/components/admin/AdminUI";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/resources/")({ component: ResourcesList });

function ResourcesList() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-resources"],
    queryFn: async () => {
      const { data, error } = await supabase.from("resources").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const del = async (id: string) => {
    if (!confirm("Delete resource?")) return;
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-resources"] }); }
  };
  return (
    <div>
      <PageHeader title="Resources" action={<NewButton to="/admin/resources/new" label="New resource" />} />
      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {data?.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{r.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.type}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.category ?? "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Link to="/admin/resources/$id" params={{ id: r.id }} className="rounded p-1.5 hover:bg-muted"><Pencil size={14} /></Link>
                    <button onClick={() => del(r.id)} className="rounded p-1.5 text-destructive hover:bg-muted"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {data?.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No resources yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
