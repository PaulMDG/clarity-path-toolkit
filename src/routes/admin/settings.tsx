import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, Field, PageHeader, inputCls, textareaCls } from "@/components/admin/AdminUI";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({ component: Settings });

type Form = {
  business_name: string; tagline: string; email: string; phone: string; address: string;
  footer_description: string; logo_url: string | null; favicon_url: string | null;
  default_seo_title: string; default_meta_description: string;
  stripe_publishable_key: string; calendly_url_free: string; calendly_url_paid: string;
  google_analytics_id: string;
  social_links: string; homepage_content: string;
};

function Settings() {
  const [id, setId] = useState<string | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["site-settings-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data) {
      setId(data.id);
      setForm({
        business_name: data.business_name ?? "",
        tagline: data.tagline ?? "",
        email: data.email ?? "", phone: data.phone ?? "", address: data.address ?? "",
        footer_description: data.footer_description ?? "",
        logo_url: data.logo_url, favicon_url: data.favicon_url,
        default_seo_title: data.default_seo_title ?? "",
        default_meta_description: data.default_meta_description ?? "",
        stripe_publishable_key: data.stripe_publishable_key ?? "",
        calendly_url_free: data.calendly_url_free ?? "",
        calendly_url_paid: data.calendly_url_paid ?? "",
        google_analytics_id: data.google_analytics_id ?? "",
        social_links: JSON.stringify(data.social_links ?? {}, null, 2),
        homepage_content: JSON.stringify(data.homepage_content ?? {}, null, 2),
      });
    }
  }, [data]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    let social: unknown, home: unknown;
    try { social = JSON.parse(form.social_links || "{}"); }
    catch { toast.error("Social links is not valid JSON"); setBusy(false); return; }
    try { home = JSON.parse(form.homepage_content || "{}"); }
    catch { toast.error("Homepage content is not valid JSON"); setBusy(false); return; }
    const payload = { ...form, social_links: social, homepage_content: home };
    const res = id
      ? await supabase.from("site_settings").update(payload).eq("id", id)
      : await supabase.from("site_settings").insert(payload);
    if (res.error) toast.error(res.error.message);
    else toast.success("Saved");
    setBusy(false);
  };

  if (isLoading || !form) return <div>Loading…</div>;

  return (
    <form onSubmit={save}>
      <PageHeader title="Site settings"
        action={<button disabled={busy} className="btn-primary !py-2 !text-sm">{busy ? "Saving…" : "Save"}</button>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h3 className="text-sm font-semibold">Business</h3>
          <Field label="Business name">
            <input className={inputCls} value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
          </Field>
          <Field label="Tagline">
            <input className={inputCls} value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
          </Field>
          <Field label="Email">
            <input className={inputCls} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Phone">
            <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Address">
            <textarea className={textareaCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Footer description">
            <textarea className={textareaCls} value={form.footer_description} onChange={(e) => setForm({ ...form, footer_description: e.target.value })} />
          </Field>
        </Card>
        <Card className="space-y-4">
          <h3 className="text-sm font-semibold">Branding</h3>
          <ImageUpload label="Logo" value={form.logo_url} onChange={(u) => setForm({ ...form, logo_url: u })} />
          <ImageUpload label="Favicon" value={form.favicon_url} onChange={(u) => setForm({ ...form, favicon_url: u })} />
          <h3 className="pt-2 text-sm font-semibold">SEO defaults</h3>
          <Field label="Default SEO title">
            <input className={inputCls} value={form.default_seo_title} onChange={(e) => setForm({ ...form, default_seo_title: e.target.value })} />
          </Field>
          <Field label="Default meta description">
            <textarea className={textareaCls} value={form.default_meta_description} onChange={(e) => setForm({ ...form, default_meta_description: e.target.value })} />
          </Field>
          <Field label="Google Analytics ID">
            <input className={inputCls} value={form.google_analytics_id} onChange={(e) => setForm({ ...form, google_analytics_id: e.target.value })} />
          </Field>
        </Card>
        <Card className="space-y-4">
          <h3 className="text-sm font-semibold">Integrations</h3>
          <Field label="Stripe publishable key">
            <input className={inputCls} value={form.stripe_publishable_key} onChange={(e) => setForm({ ...form, stripe_publishable_key: e.target.value })} />
          </Field>
          <Field label="Calendly URL — free">
            <input className={inputCls} value={form.calendly_url_free} onChange={(e) => setForm({ ...form, calendly_url_free: e.target.value })} />
          </Field>
          <Field label="Calendly URL — paid">
            <input className={inputCls} value={form.calendly_url_paid} onChange={(e) => setForm({ ...form, calendly_url_paid: e.target.value })} />
          </Field>
        </Card>
        <Card className="space-y-4">
          <h3 className="text-sm font-semibold">JSON</h3>
          <Field label="Social links (JSON)" hint='e.g. {"facebook":"…","instagram":"…"}'>
            <textarea className={textareaCls + " font-mono text-xs min-h-[120px]"} value={form.social_links} onChange={(e) => setForm({ ...form, social_links: e.target.value })} />
          </Field>
          <Field label="Homepage content (JSON)" hint="Used by the hero, process, about preview and CTA band">
            <textarea className={textareaCls + " font-mono text-xs min-h-[260px]"} value={form.homepage_content} onChange={(e) => setForm({ ...form, homepage_content: e.target.value })} />
          </Field>
        </Card>
      </div>
    </form>
  );
}
