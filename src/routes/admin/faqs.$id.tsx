import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, Field, PageHeader, inputCls } from "@/components/admin/AdminUI";
import { RichEditor } from "@/components/admin/RichEditor";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/faqs/$id")({ component: FaqEdit });

type Form = { question: string; answer: string; category: string; display_order: number };
const empty: Form = { question: "", answer: "", category: "", display_order: 0 };

function FaqEdit() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const isNew = id === "new";
  const [form, setForm] = useState<Form>(empty);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["faq", id], enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("faqs").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data) setForm({
      question: data.question, answer: data.answer,
      category: data.category ?? "", display_order: data.display_order ?? 0,
    });
  }, [data]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = { ...form, category: form.category || null };
    const res = isNew
      ? await supabase.from("faqs").insert(payload)
      : await supabase.from("faqs").update(payload).eq("id", id);
    if (res.error) toast.error(res.error.message);
    else { toast.success("Saved"); nav({ to: "/admin/faqs" }); }
    setBusy(false);
  };

  if (!isNew && isLoading) return <div>Loading…</div>;

  return (
    <form onSubmit={save}>
      <PageHeader title={isNew ? "New FAQ" : "Edit FAQ"}
        action={<button disabled={busy} className="btn-primary !py-2 !text-sm">{busy ? "Saving…" : "Save"}</button>} />
      <Card className="space-y-4">
        <Field label="Question">
          <input className={inputCls} required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
        </Field>
        <Field label="Answer">
          <RichEditor value={form.answer} onChange={(v) => setForm({ ...form, answer: v })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </Field>
          <Field label="Display order">
            <input type="number" className={inputCls} value={form.display_order}
              onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} />
          </Field>
        </div>
      </Card>
    </form>
  );
}
