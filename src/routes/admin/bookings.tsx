import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Card } from "@/components/admin/AdminUI";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/bookings")({ component: Bookings });

function Bookings() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, consultation_types(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const del = async (id: string) => {
    if (!confirm("Delete booking?")) return;
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-bookings"] }); }
  };
  return (
    <div>
      <PageHeader title="Bookings" description="Consultation requests from your booking flow." />
      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Type</th><th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Created</th><th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((b) => (
              <tr key={b.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{b.full_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{b.email}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {(b as { consultation_types?: { title?: string } }).consultation_types?.title ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{b.payment_status}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(b.created_at!).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => del(b.id)} className="rounded p-1.5 text-destructive hover:bg-muted"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {data?.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No bookings yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
