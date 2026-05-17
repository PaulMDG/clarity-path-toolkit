import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";

// Verify Stripe webhook signature (t=, v1=)
function verifyStripe(header: string | null, body: string, secret: string): boolean {
  if (!header) return false;
  const parts: Record<string, string> = {};
  for (const piece of header.split(",")) {
    const [k, v] = piece.split("=");
    if (k && v) {
      if (k.trim() === "v1") parts.v1 = (parts.v1 ? parts.v1 + "," : "") + v.trim();
      else parts[k.trim()] = v.trim();
    }
  }
  const t = parts.t;
  if (!t || !parts.v1) return false;
  const signed = `${t}.${body}`;
  const expected = createHmac("sha256", secret).update(signed).digest("hex");
  const expBuf = Buffer.from(expected);
  return parts.v1.split(",").some((sig) => {
    const sigBuf = Buffer.from(sig);
    if (sigBuf.length !== expBuf.length) return false;
    try { return timingSafeEqual(sigBuf, expBuf); } catch { return false; }
  });
}

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) return new Response("Not configured", { status: 500 });

        const body = await request.text();
        const sig = request.headers.get("stripe-signature");
        if (!verifyStripe(sig, body, secret)) {
          return new Response("Invalid signature", { status: 401 });
        }

        const event = JSON.parse(body) as { type: string; data: { object: Record<string, unknown> } };
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );

        if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
          const session = event.data.object as {
            id: string;
            client_reference_id?: string;
            payment_intent?: string;
            metadata?: { booking_id?: string };
            payment_status?: string;
          };
          const bookingId = session.metadata?.booking_id || session.client_reference_id;
          if (bookingId && (session.payment_status === "paid" || event.type === "checkout.session.completed")) {
            await supabase
              .from("bookings")
              .update({
                payment_status: "paid",
                stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
                stripe_session_id: session.id,
              })
              .eq("id", bookingId);
          }
        } else if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
          const session = event.data.object as { id: string; metadata?: { booking_id?: string }; client_reference_id?: string };
          const bookingId = session.metadata?.booking_id || session.client_reference_id;
          if (bookingId) {
            await supabase.from("bookings").update({ payment_status: "failed" }).eq("id", bookingId);
          }
        }

        return new Response("ok");
      },
    },
  },
});
