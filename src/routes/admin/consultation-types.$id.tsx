import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, Field, PageHeader, inputCls, textareaCls } from "@/components/admin/AdminUI";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/consultation-types/$id")({ component: CtEdit });

type Form = { title: string; description: string; duration_minutes: number; price_cents: number; stripe_price_id: string; is_active: boolean };
const empty: Form = { title: "", description: "", duration_minutes: 60, price_cents: 0, stripe_price_id: "", is_active: true };

function CtEdit() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const isNew = id === "new";
  const [form, setForm] = useState<Form>(empty);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["ct", id], enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("consultation_types").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data) setForm({
      title: data.title, description: data.description ?? "",
      duration_minutes: data.duration_minutes ?? 60, price_cents: data.price_cents ?? 0,
      stripe_price_id: data.stripe_price_id ?? "", is_active: !!data.is_active,
    });
  }, [data]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = { ...form, stripe_price_id: form.stripe_price_id || null };
    const res = isNew
      ? await supabase.from("consultation_types").insert(payload)
      : await supabase.from("consultation_types").update(payload).eq("id", id);
    if (res.error) toast.error(res.error.message);
    else { toast.success("Saved"); nav({ to: "/admin/consultation-types" }); }
    setBusy(false);
  };

  if (!isNew && isLoading) return <div>Loading…</div>;

  return (
    <form onSubmit={save}>
      <PageHeader title={isNew ? "New consultation type" : "Edit consultation type"}
        action={<button disabled={busy} className="btn-primary !py-2 !text-sm">{busy ? "Saving…" : "Save"}</button>} />
      <Card className="space-y-4">
        <Field label="Title">
          <input className={inputCls} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Description">
          <textarea className={textareaCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Duration (minutes)">
            <input type="number" className={inputCls} value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
          </Field>
          <Field label="Price (cents)" hint="0 = free consultation">
            <input type="number" className={inputCls} value={form.price_cents}
              onChange={(e) => setForm({ ...form, price_cents: Number(e.target.value) })} />
          </Field>
          <Field label="Stripe price ID" hint="Optional — for paid types">
            <input className={inputCls} value={form.stripe_price_id} onChange={(e) => setForm({ ...form, stripe_price_id: e.target.value })} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          Active
        </label>
      </Card>
    </form>
  );
}
