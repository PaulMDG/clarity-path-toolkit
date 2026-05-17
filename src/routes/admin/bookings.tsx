import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Card, inputCls } from "@/components/admin/AdminUI";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/bookings")({ component: Bookings });

type Filter = "all" | "upcoming" | "paid" | "pending" | "free" | "failed" | "cancelled";
const STATUSES = ["pending", "paid", "free", "failed"] as const;

function Bookings() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

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

  const filtered = useMemo(() => {
    const now = Date.now();
    const term = q.trim().toLowerCase();
    return (data ?? []).filter((b) => {
      if (filter === "cancelled" && !b.cancelled_at) return false;
      if (filter !== "cancelled" && filter !== "all" && b.cancelled_at) return false;
      if (filter === "upcoming") {
        if (!b.scheduled_at) return false;
        if (new Date(b.scheduled_at).getTime() < now) return false;
      }
      if (["paid", "pending", "free", "failed"].includes(filter) && b.payment_status !== filter) return false;
      if (term) {
        const hay = `${b.full_name} ${b.email} ${b.phone ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [data, filter, q]);

  const counts = useMemo(() => {
    const c = { all: 0, upcoming: 0, paid: 0, pending: 0, free: 0, failed: 0, cancelled: 0 } as Record<Filter, number>;
    const now = Date.now();
    for (const b of data ?? []) {
      c.all++;
      if (b.cancelled_at) { c.cancelled++; continue; }
      if (b.scheduled_at && new Date(b.scheduled_at).getTime() >= now) c.upcoming++;
      const s = b.payment_status as Filter;
      if (s in c) (c as Record<string, number>)[s]++;
    }
    return c;
  }, [data]);

  const updateStatus = async (id: string, payment_status: string) => {
    const { error } = await supabase.from("bookings").update({ payment_status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-bookings"] }); }
  };
  const toggleCancel = async (id: string, cancelled: boolean) => {
    const { error } = await supabase.from("bookings").update({ cancelled_at: cancelled ? null : new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(cancelled ? "Restored" : "Cancelled"); qc.invalidateQueries({ queryKey: ["admin-bookings"] }); }
  };
  const del = async (id: string) => {
    if (!confirm("Delete booking permanently?")) return;
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-bookings"] }); }
  };

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All" }, { key: "upcoming", label: "Upcoming" },
    { key: "paid", label: "Paid" }, { key: "pending", label: "Pending" },
    { key: "free", label: "Free" }, { key: "failed", label: "Failed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div>
      <PageHeader title="Bookings" description="View and manage consultation requests." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              filter === t.key ? "border-foreground bg-foreground text-background" : "hover:bg-muted"
            }`}>
            {t.label} <span className="ml-1 opacity-60">{counts[t.key]}</span>
          </button>
        ))}
        <input className={`${inputCls} ml-auto max-w-xs`} placeholder="Search name, email, phone…"
          value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th><th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Scheduled</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => {
              const cancelled = !!b.cancelled_at;
              return (
                <tr key={b.id} className="border-b last:border-0 align-top">
                  <td className="px-4 py-3 font-medium">
                    {b.full_name}
                    {cancelled && <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-destructive">Cancelled</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{b.email}</div>
                    {b.phone && <div className="text-xs">{b.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {(b as { consultation_types?: { title?: string } }).consultation_types?.title ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {b.scheduled_at ? new Date(b.scheduled_at).toLocaleString() : "—"}
                    {b.calendly_event_url && (
                      <a href={b.calendly_event_url} target="_blank" rel="noreferrer" className="block text-primary underline">Calendly event</a>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select value={b.payment_status ?? "pending"} onChange={(e) => updateStatus(b.id, e.target.value)}
                      className="rounded border bg-background px-2 py-1 text-xs">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(b.created_at!).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleCancel(b.id, cancelled)}
                      className="mr-2 rounded border px-2 py-1 text-xs hover:bg-muted">
                      {cancelled ? "Restore" : "Cancel"}
                    </button>
                    <button onClick={() => del(b.id)} className="rounded p-1.5 text-destructive hover:bg-muted">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No bookings match.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
