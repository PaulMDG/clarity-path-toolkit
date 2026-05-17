import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, NewButton, Card } from "@/components/admin/AdminUI";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/faqs/")({ component: FaqsList });

function FaqsList() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("faqs").select("*").order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });
  const del = async (id: string) => {
    if (!confirm("Delete FAQ?")) return;
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-faqs"] }); }
  };
  return (
    <div>
      <PageHeader title="FAQs" action={<NewButton to="/admin/faqs/new" label="New FAQ" />} />
      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="px-4 py-3">Question</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Order</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {data?.map((f) => (
              <tr key={f.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{f.question}</td>
                <td className="px-4 py-3 text-muted-foreground">{f.category ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{f.display_order}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Link to="/admin/faqs/$id" params={{ id: f.id }} className="rounded p-1.5 hover:bg-muted"><Pencil size={14} /></Link>
                    <button onClick={() => del(f.id)} className="rounded p-1.5 text-destructive hover:bg-muted"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {data?.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No FAQs yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
