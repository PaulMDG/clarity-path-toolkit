import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, Field, PageHeader, inputCls, textareaCls, slugify } from "@/components/admin/AdminUI";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { RichEditor } from "@/components/admin/RichEditor";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/blog/$id")({ component: BlogEdit });

type Form = {
  title: string; slug: string; excerpt: string; featured_image_url: string | null;
  content: string; category_id: string | null; tags: string;
  status: string; published_at: string | null;
  seo_title: string; meta_description: string;
};

const empty: Form = {
  title: "", slug: "", excerpt: "", featured_image_url: null, content: "",
  category_id: null, tags: "", status: "draft", published_at: null,
  seo_title: "", meta_description: "",
};

function BlogEdit() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const isNew = id === "new";
  const [form, setForm] = useState<Form>(empty);
  const [busy, setBusy] = useState(false);
  const [newCat, setNewCat] = useState("");

  const { data: cats } = useQuery({
    queryKey: ["blog-cats"],
    queryFn: async () => {
      const { data } = await supabase.from("blog_categories").select("*").order("name");
      return data ?? [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["blog-post", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_posts").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data) setForm({
      title: data.title, slug: data.slug, excerpt: data.excerpt ?? "",
      featured_image_url: data.featured_image_url, content: data.content ?? "",
      category_id: data.category_id, tags: (data.tags ?? []).join(", "),
      status: data.status ?? "draft", published_at: data.published_at,
      seo_title: data.seo_title ?? "", meta_description: data.meta_description ?? "",
    });
  }, [data]);

  const addCat = async () => {
    const name = newCat.trim();
    if (!name) return;
    const { error } = await supabase.from("blog_categories").insert({ name, slug: slugify(name) });
    if (error) toast.error(error.message);
    else { setNewCat(""); qc.invalidateQueries({ queryKey: ["blog-cats"] }); }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      excerpt: form.excerpt || null,
      featured_image_url: form.featured_image_url,
      content: form.content,
      category_id: form.category_id || null,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      status: form.status,
      published_at: form.status === "published" ? form.published_at ?? new Date().toISOString() : form.published_at,
      seo_title: form.seo_title || null,
      meta_description: form.meta_description || null,
    };
    const res = isNew
      ? await supabase.from("blog_posts").insert(payload)
      : await supabase.from("blog_posts").update(payload).eq("id", id);
    if (res.error) toast.error(res.error.message);
    else { toast.success("Saved"); nav({ to: "/admin/blog" }); }
    setBusy(false);
  };

  if (!isNew && isLoading) return <div>Loading…</div>;

  return (
    <form onSubmit={save}>
      <PageHeader
        title={isNew ? "New blog post" : "Edit blog post"}
        action={<button disabled={busy} className="btn-primary !py-2 !text-sm">{busy ? "Saving…" : "Save"}</button>}
      />
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
            <Field label="Excerpt">
              <textarea className={textareaCls} value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
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
            <Field label="Category">
              <select className={inputCls} value={form.category_id ?? ""}
                onChange={(e) => setForm({ ...form, category_id: e.target.value || null })}>
                <option value="">— None —</option>
                {cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <div className="flex gap-2">
              <input className={inputCls} placeholder="Add category"
                value={newCat} onChange={(e) => setNewCat(e.target.value)} />
              <button type="button" onClick={addCat} className="rounded-md border px-3 text-sm hover:bg-muted">Add</button>
            </div>
            <Field label="Tags" hint="Comma separated">
              <input className={inputCls} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
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
