import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/book-consultation")({
  component: Book,
  head: () => ({ meta: [{ title: "Book a Consultation | ClarityPath" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    success: s.success === "true" || s.success === true,
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
  }),
});

const detailsSchema = z.object({
  full_name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50).optional(),
});

function Book() {
  const search = Route.useSearch();
  const { data: settings } = useSiteSettings();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState({ full_name: "", email: "", phone: "" });

  const { data: types } = useQuery({
    queryKey: ["consultation_types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultation_types").select("*").eq("is_active", true).order("price_cents");
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (search.success) setStep(3);
  }, [search.success]);

  const selected = types?.find((t) => t.id === selectedId);

  async function handleContinue() {
    const parsed = detailsSchema.safeParse(details);
    if (!parsed.success) return toast.error("Please enter your name and a valid email.");
    if (!selected) return;
    if (selected.price_cents === 0) {
      // Free: create booking and jump to scheduling
      const { error } = await supabase.from("bookings").insert({
        full_name: details.full_name,
        email: details.email,
        phone: details.phone || null,
        consultation_type_id: selected.id,
        payment_status: "free",
      });
      if (error) return toast.error("Could not create booking. Please try again.");
      setStep(3);
    } else {
      // Paid: redirect to Stripe (placeholder — wire edge function next)
      toast.info("Payment is not yet enabled. Add your Stripe key to enable checkout.");
    }
  }

  return (
    <SiteShell>
      <Toaster richColors position="top-center" />
      <PageHero eyebrow="BOOK" title="Book a consultation." subtitle="Choose the right consultation, share your details, and pick a time that suits you." />
      <section className="py-16">
        <div className="container-cp max-w-3xl">
          <Stepper step={step} />
          {step === 1 && (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {types?.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedId(t.id); setStep(2); }}
                  className="card-cp text-left"
                  style={{ borderColor: selectedId === t.id ? "#2D6A4F" : "#E5E7EB" }}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-serif text-[22px]">{t.title}</h3>
                    <span className="font-serif text-[20px]" style={{ color: "#2D6A4F" }}>
                      {t.price_cents === 0 ? "Free" : `€${(t.price_cents / 100).toFixed(0)}`}
                    </span>
                  </div>
                  <p className="mt-2 text-[14px]" style={{ color: "#6B7280" }}>{t.description}</p>
                  <p className="mt-3 text-[12px] uppercase tracking-wider font-semibold" style={{ color: "#6B7280" }}>{t.duration_minutes} minutes</p>
                </button>
              ))}
            </div>
          )}

          {step === 2 && selected && (
            <div className="mt-8 card-cp space-y-4">
              <h2 className="font-serif text-[24px]">Your details</h2>
              <Field label="Full name *"><input className={inputCls} value={details.full_name} onChange={(e) => setDetails({ ...details, full_name: e.target.value })} /></Field>
              <Field label="Email *"><input type="email" className={inputCls} value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} /></Field>
              <Field label="Phone"><input className={inputCls} value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} /></Field>
              <div className="flex justify-between gap-3 pt-2">
                <button onClick={() => setStep(1)} className="btn-secondary">← Back</button>
                <button onClick={handleContinue} className="btn-primary">
                  {selected.price_cents === 0 ? "Continue to scheduling →" : `Pay €${(selected.price_cents / 100).toFixed(0)} →`}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mt-8 card-cp text-center">
              <CheckCircle2 size={48} className="mx-auto" color="#2D6A4F" />
              <h2 className="mt-4 font-serif text-[28px]">You're booked.</h2>
              <p className="mt-2" style={{ color: "#6B7280" }}>
                {settings?.calendly_url_free || settings?.calendly_url_paid
                  ? "Pick a time below that works for you."
                  : "Scheduling will appear here once a Calendly URL is configured in admin settings."}
              </p>
              {(settings?.calendly_url_free || settings?.calendly_url_paid) && (
                <iframe
                  title="Calendly"
                  src={settings.calendly_url_paid || settings.calendly_url_free || ""}
                  className="mt-6 w-full rounded-xl border"
                  style={{ height: 700, borderColor: "#E5E7EB" }}
                />
              )}
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

function Stepper({ step }: { step: number }) {
  const items = ["Select type", "Your details", "Schedule"];
  return (
    <ol className="flex items-center gap-3 text-sm">
      {items.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <li key={label} className="flex items-center gap-3">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
              active || done ? "bg-[#2D6A4F] text-white" : "bg-[#EAF3EE] text-[#2D6A4F]"
            }`}>{n}</span>
            <span style={{ color: active ? "#1A2B3C" : "#6B7280" }}>{label}</span>
            {n < items.length && <span className="h-px w-8 bg-[#E5E7EB]" />}
          </li>
        );
      })}
    </ol>
  );
}

const inputCls = "w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2D6A4F]/30";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium" style={{ color: "#1A2B3C" }}>{label}</span>{children}</label>;
}
