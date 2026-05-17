import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, Field, PageHeader, inputCls, textareaCls } from "@/components/admin/AdminUI";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/resources/$id")({ component: ResourceEdit });

type Form = {
  title: string; description: string; type: string; category: string;
  file_url: string | null; external_url: string;
  featured_image_url: string | null; status: string;
};
const empty: Form = { title: "", description: "", type: "pdf", category: "", file_url: null, external_url: "", featured_image_url: null, status: "draft" };

function ResourceEdit() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const isNew = id === "new";
  const [form, setForm] = useState<Form>(empty);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["resource", id], enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("resources").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data) setForm({
      title: data.title, description: data.description ?? "",
      type: data.type, category: data.category ?? "",
      file_url: data.file_url, external_url: data.external_url ?? "",
      featured_image_url: data.featured_image_url, status: data.status ?? "draft",
    });
  }, [data]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      ...form,
      category: form.category || null,
      external_url: form.external_url || null,
    };
    const res = isNew
      ? await supabase.from("resources").insert(payload)
      : await supabase.from("resources").update(payload).eq("id", id);
    if (res.error) toast.error(res.error.message);
    else { toast.success("Saved"); nav({ to: "/admin/resources" }); }
    setBusy(false);
  };

  if (!isNew && isLoading) return <div>Loading…</div>;

  return (
    <form onSubmit={save}>
      <PageHeader title={isNew ? "New resource" : "Edit resource"}
        action={<button disabled={busy} className="btn-primary !py-2 !text-sm">{busy ? "Saving…" : "Save"}</button>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="space-y-4">
            <Field label="Title">
              <input className={inputCls} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Description">
              <textarea className={textareaCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type">
                <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="pdf">PDF / Document</option>
                  <option value="link">External link</option>
                  <option value="video">Video</option>
                  <option value="guide">Guide</option>
                </select>
              </Field>
              <Field label="Category">
                <input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </Field>
            </div>
            <Field label="External URL" hint="For link/video types">
              <input className={inputCls} type="url" value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} />
            </Field>
            <ImageUpload
              label="Downloadable file"
              bucket="resources"
              accept="*"
              folder="files"
              value={form.file_url}
              onChange={(u) => setForm({ ...form, file_url: u })}
            />
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
