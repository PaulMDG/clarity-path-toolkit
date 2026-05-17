import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Card } from "@/components/admin/AdminUI";
import { toast } from "sonner";
import { Trash2, MailOpen } from "lucide-react";

export const Route = createFileRoute("/admin/contact")({ component: Contact });

function Contact() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-contact"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_submissions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const toggleRead = async (id: string, current: boolean) => {
    const { error } = await supabase.from("contact_submissions").update({ is_read: !current }).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin-contact"] });
  };
  const del = async (id: string) => {
    if (!confirm("Delete message?")) return;
    const { error } = await supabase.from("contact_submissions").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-contact"] }); }
  };
  return (
    <div>
      <PageHeader title="Contact messages" />
      <div className="space-y-3">
        {data?.map((m) => (
          <Card key={m.id} className={m.is_read ? "opacity-70" : ""}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{m.full_name}</span>
                  <span className="text-sm text-muted-foreground">&lt;{m.email}&gt;</span>
                  {!m.is_read && <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">New</span>}
                </div>
                {m.subject && <div className="mt-1 text-sm font-medium">{m.subject}</div>}
                <p className="mt-2 whitespace-pre-wrap text-sm">{m.message}</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  {new Date(m.created_at!).toLocaleString()} {m.phone && `· ${m.phone}`}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => toggleRead(m.id, !!m.is_read)} className="rounded p-1.5 hover:bg-muted" title="Toggle read">
                  <MailOpen size={14} />
                </button>
                <button onClick={() => del(m.id)} className="rounded p-1.5 text-destructive hover:bg-muted" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {data?.length === 0 && (
          <Card><div className="py-6 text-center text-sm text-muted-foreground">No messages yet.</div></Card>
        )}
      </div>
    </div>
  );
}
