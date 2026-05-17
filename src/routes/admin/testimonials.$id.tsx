import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, Field, PageHeader, inputCls, textareaCls } from "@/components/admin/AdminUI";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/testimonials/$id")({ component: TEdit });

type Form = { client_name: string; location: string; rating: number; testimonial_text: string; status: string };
const empty: Form = { client_name: "", location: "", rating: 5, testimonial_text: "", status: "draft" };

function TEdit() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const isNew = id === "new";
  const [form, setForm] = useState<Form>(empty);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["testimonial", id], enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("testimonials").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data) setForm({
      client_name: data.client_name, location: data.location ?? "",
      rating: data.rating ?? 5, testimonial_text: data.testimonial_text,
      status: data.status ?? "draft",
    });
  }, [data]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = { ...form, location: form.location || null };
    const res = isNew
      ? await supabase.from("testimonials").insert(payload)
      : await supabase.from("testimonials").update(payload).eq("id", id);
    if (res.error) toast.error(res.error.message);
    else { toast.success("Saved"); nav({ to: "/admin/testimonials" }); }
    setBusy(false);
  };

  if (!isNew && isLoading) return <div>Loading…</div>;

  return (
    <form onSubmit={save}>
      <PageHeader title={isNew ? "New testimonial" : "Edit testimonial"}
        action={<button disabled={busy} className="btn-primary !py-2 !text-sm">{busy ? "Saving…" : "Save"}</button>} />
      <Card className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Client name">
            <input className={inputCls} required value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
          </Field>
          <Field label="Location">
            <input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <Field label="Rating (1–5)">
            <input type="number" min={1} max={5} className={inputCls} value={form.rating}
              onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
          </Field>
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </Field>
        </div>
        <Field label="Testimonial">
          <textarea className={textareaCls} required value={form.testimonial_text}
            onChange={(e) => setForm({ ...form, testimonial_text: e.target.value })} />
        </Field>
      </Card>
    </form>
  );
}
