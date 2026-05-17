import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

type SecretsForm = {
  id: string | null;
  stripe_secret_key: string;
  stripe_webhook_secret: string;
  calendly_webhook_signing_key: string;
};

const SITE_URL = typeof window !== "undefined" ? window.location.origin : "https://clarity-path-toolkit.lovable.app";

function Settings() {
  const qc = useQueryClient();
  const [id, setId] = useState<string | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [secrets, setSecrets] = useState<SecretsForm | null>(null);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["site-settings-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: secretsRow } = useQuery({
    queryKey: ["integration-secrets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("integration_secrets").select("*").limit(1).maybeSingle();
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

  useEffect(() => {
    setSecrets({
      id: secretsRow?.id ?? null,
      stripe_secret_key: secretsRow?.stripe_secret_key ?? "",
      stripe_webhook_secret: secretsRow?.stripe_webhook_secret ?? "",
      calendly_webhook_signing_key: secretsRow?.calendly_webhook_signing_key ?? "",
    });
  }, [secretsRow]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    let social: unknown, home: unknown;
    try { social = JSON.parse(form.social_links || "{}"); }
    catch { toast.error("Social links is not valid JSON"); setBusy(false); return; }
    try { home = JSON.parse(form.homepage_content || "{}"); }
    catch { toast.error("Homepage content is not valid JSON"); setBusy(false); return; }
    const payload = { ...form, social_links: social as never, homepage_content: home as never };
    const res = id
      ? await supabase.from("site_settings").update(payload).eq("id", id)
      : await supabase.from("site_settings").insert(payload);
    if (res.error) toast.error(res.error.message);
    else toast.success("Saved");
    setBusy(false);
  };

  const saveSecrets = async () => {
    if (!secrets) return;
    setBusy(true);
    const payload = {
      stripe_secret_key: secrets.stripe_secret_key || null,
      stripe_webhook_secret: secrets.stripe_webhook_secret || null,
      calendly_webhook_signing_key: secrets.calendly_webhook_signing_key || null,
    };
    const res = secrets.id
      ? await supabase.from("integration_secrets").update(payload).eq("id", secrets.id)
      : await supabase.from("integration_secrets").insert(payload);
    if (res.error) toast.error(res.error.message);
    else { toast.success("Integration secrets saved"); qc.invalidateQueries({ queryKey: ["integration-secrets"] }); }
    setBusy(false);
  };

  if (isLoading || !form || !secrets) return <div>Loading…</div>;

  const stripeWebhookUrl = `${SITE_URL}/api/public/stripe-webhook`;
  const calendlyWebhookUrl = `${SITE_URL}/api/public/calendly`;

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
        <Card className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Stripe</h3>
            <button type="button" onClick={saveSecrets} disabled={busy} className="btn-secondary !py-1.5 !text-xs">Save Stripe & Calendly keys</button>
          </div>
          <Field label="Publishable key (public, embedded in site)">
            <input className={inputCls} placeholder="pk_live_…" value={form.stripe_publishable_key}
              onChange={(e) => setForm({ ...form, stripe_publishable_key: e.target.value })} />
          </Field>
          <Field label="Secret key (private, used for checkout sessions)">
            <input className={inputCls} type="password" placeholder="sk_live_…" value={secrets.stripe_secret_key}
              onChange={(e) => setSecrets({ ...secrets, stripe_secret_key: e.target.value })} />
          </Field>
          <Field label="Webhook signing secret">
            <input className={inputCls} type="password" placeholder="whsec_…" value={secrets.stripe_webhook_secret}
              onChange={(e) => setSecrets({ ...secrets, stripe_webhook_secret: e.target.value })} />
          </Field>
          <WebhookInfo label="Stripe webhook endpoint URL" url={stripeWebhookUrl}
            help="In Stripe Dashboard → Developers → Webhooks, add this URL and subscribe to: checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed, checkout.session.expired." />
        </Card>
        <Card className="space-y-4 lg:col-span-2">
          <h3 className="text-sm font-semibold">Calendly</h3>
          <Field label="Scheduling URL — free consultations">
            <input className={inputCls} value={form.calendly_url_free} onChange={(e) => setForm({ ...form, calendly_url_free: e.target.value })} />
          </Field>
          <Field label="Scheduling URL — paid consultations">
            <input className={inputCls} value={form.calendly_url_paid} onChange={(e) => setForm({ ...form, calendly_url_paid: e.target.value })} />
          </Field>
          <Field label="Webhook signing key">
            <input className={inputCls} type="password" placeholder="Calendly signing key" value={secrets.calendly_webhook_signing_key}
              onChange={(e) => setSecrets({ ...secrets, calendly_webhook_signing_key: e.target.value })} />
          </Field>
          <WebhookInfo label="Calendly webhook endpoint URL" url={calendlyWebhookUrl}
            help="Create a Calendly webhook subscription (via API) for invitee.created and invitee.canceled events pointed at this URL." />
        </Card>
        <Card className="space-y-4 lg:col-span-2">
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

function WebhookInfo({ label, url, help }: { label: string; url: string; help: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/30 p-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <code className="flex-1 truncate rounded bg-background px-2 py-1.5 text-xs">{url}</code>
        <button type="button" onClick={() => { navigator.clipboard.writeText(url); toast.success("Copied"); }}
          className="rounded border px-2 py-1.5 text-xs hover:bg-background">Copy</button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{help}</p>
    </div>
  );
}
