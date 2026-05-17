import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServiceClient, loadSecrets } from "@/lib/webhooks.server";

const schema = z.object({
  consultation_type_id: z.string().uuid(),
  full_name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50).optional(),
  origin: z.string().url(),
});

export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((input) => schema.parse(input))
  .handler(async ({ data }) => {
    const admin = getServiceClient();
    const secrets = await loadSecrets(admin);
    const stripeKey = secrets.stripe_secret_key;
    if (!stripeKey) {
      throw new Error("Stripe is not configured. Add a Stripe secret key in Admin → Settings.");
    }

    const { data: type, error: typeErr } = await admin
      .from("consultation_types")
      .select("id, title, description, price_cents, is_active")
      .eq("id", data.consultation_type_id)
      .maybeSingle();
    if (typeErr || !type || !type.is_active) {
      throw new Error("Consultation type unavailable.");
    }
    if (!type.price_cents || type.price_cents <= 0) {
      throw new Error("This consultation is free — no payment required.");
    }

    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .insert({
        full_name: data.full_name,
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        consultation_type_id: type.id,
        payment_status: "pending",
      })
      .select("id")
      .single();
    if (bErr || !booking) throw new Error("Could not create booking.");

    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("success_url", `${data.origin}/book-consultation?success=true&booking_id=${booking.id}&session_id={CHECKOUT_SESSION_ID}`);
    params.append("cancel_url", `${data.origin}/book-consultation?canceled=true&booking_id=${booking.id}`);
    params.append("customer_email", data.email);
    params.append("client_reference_id", booking.id);
    params.append("metadata[booking_id]", booking.id);
    params.append("line_items[0][quantity]", "1");
    params.append("line_items[0][price_data][currency]", "eur");
    params.append("line_items[0][price_data][unit_amount]", String(type.price_cents));
    params.append("line_items[0][price_data][product_data][name]", type.title);
    if (type.description) {
      params.append("line_items[0][price_data][product_data][description]", type.description.slice(0, 500));
    }

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const json = await res.json() as { id?: string; url?: string; error?: { message?: string } };
    if (!res.ok || !json.url) {
      console.error("Stripe error:", json);
      throw new Error(json.error?.message || "Stripe checkout failed.");
    }

    await admin.from("bookings").update({ stripe_session_id: json.id }).eq("id", booking.id);
    return { url: json.url, booking_id: booking.id };
  });
