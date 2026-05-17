import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, Field, PageHeader, inputCls, textareaCls, slugify } from "@/components/admin/AdminUI";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { RichEditor } from "@/components/admin/RichEditor";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pages/$id")({ component: PageEdit });

type Form = {
  title: string; slug: string; featured_image_url: string | null;
  content: string; status: string; seo_title: string; meta_description: string;
};
const empty: Form = { title: "", slug: "", featured_image_url: null, content: "", status: "draft", seo_title: "", meta_description: "" };

function PageEdit() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const isNew = id === "new";
  const [form, setForm] = useState<Form>(empty);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["page", id], enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("pages").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data) setForm({
      title: data.title, slug: data.slug, featured_image_url: data.featured_image_url,
      content: data.content ?? "", status: data.status ?? "draft",
      seo_title: data.seo_title ?? "", meta_description: data.meta_description ?? "",
    });
  }, [data]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = { ...form, slug: form.slug || slugify(form.title) };
    const res = isNew
      ? await supabase.from("pages").insert(payload)
      : await supabase.from("pages").update(payload).eq("id", id);
    if (res.error) toast.error(res.error.message);
    else { toast.success("Saved"); nav({ to: "/admin/pages" }); }
    setBusy(false);
  };

  if (!isNew && isLoading) return <div>Loading…</div>;

  return (
    <form onSubmit={save}>
      <PageHeader title={isNew ? "New page" : "Edit page"}
        action={<button disabled={busy} className="btn-primary !py-2 !text-sm">{busy ? "Saving…" : "Save"}</button>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="space-y-4">
            <Field label="Title">
              <input className={inputCls} required value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} />
            </Field>
            <Field label="Slug">
              <input className={inputCls} required value={form.slug}
                onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
            </Field>
            <Field label="Content">
              <RichEditor value={form.content} onChange={(v) => setForm({ ...form, content: v })} />
            </Field>
          </Card>
          <Card className="space-y-4">
            <h3 className="text-sm font-semibold">SEO</h3>
            <Field label="SEO title">
              <input className={inputCls} value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} />
            </Field>
            <Field label="Meta description">
              <textarea className={textareaCls} value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} />
            </Field>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="space-y-4">
            <Field label="Status">
              <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </Field>
          </Card>
          <Card>
            <ImageUpload value={form.featured_image_url} onChange={(u) => setForm({ ...form, featured_image_url: u })} />
          </Card>
        </div>
      </div>
    </form>
  );
}
