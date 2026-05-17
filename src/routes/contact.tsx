import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Mail, Phone, MapPin } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({ meta: [{ title: "Contact | ClarityPath" }] }),
});

const schema = z.object({
  full_name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50).optional(),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1).max(5000),
});

function Contact() {
  const { data: settings } = useSiteSettings();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", subject: "", message: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const parsed = schema.safeParse(form);
      if (!parsed.success) {
        toast.error("Please complete all required fields with valid info.");
        return;
      }
      const { error } = await supabase.from("contact_submissions").insert(parsed.data);
      if (error) throw error;
      toast.success("Thanks! We'll be in touch shortly.");
      setForm({ full_name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SiteShell>
      <Toaster richColors position="top-center" />
      <PageHero eyebrow="CONTACT" title="Get in touch." subtitle="Send us a message and we'll respond shortly." />
      <section className="py-16">
        <div className="container-cp grid gap-10 lg:grid-cols-[1fr_360px]">
          <form onSubmit={onSubmit} className="card-cp space-y-4">
            <Field label="Full name *">
              <input className={inputCls} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required maxLength={200} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Email *"><input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
              <Field label="Phone"><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            </div>
            <Field label="Subject"><input className={inputCls} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
            <Field label="Message *"><textarea className={inputCls} rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required maxLength={5000} /></Field>
            <button disabled={submitting} className="btn-primary">{submitting ? "Sending…" : "Send message →"}</button>
          </form>
          <aside className="space-y-5">
            {settings?.email && <ContactRow icon={<Mail size={16} color="#2D6A4F" />} label="Email" value={settings.email} />}
            {settings?.phone && <ContactRow icon={<Phone size={16} color="#2D6A4F" />} label="Phone" value={settings.phone} />}
            {settings?.address && <ContactRow icon={<MapPin size={16} color="#2D6A4F" />} label="Address" value={settings.address} />}
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}

const inputCls = "w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2D6A4F]/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium" style={{ color: "#1A2B3C" }}>{label}</span>
      {children}
    </label>
  );
}
function ContactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card-cp">
      <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>{icon} {label}</div>
      <div className="mt-2 text-[15px]" style={{ color: "#1A2B3C" }}>{value}</div>
    </div>
  );
}
