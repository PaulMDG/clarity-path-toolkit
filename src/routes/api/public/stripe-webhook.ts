import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { getServiceClient, loadSecrets, markWebhookProcessed } from "@/lib/webhooks.server";

function verifyStripe(header: string | null, body: string, secret: string): boolean {
  if (!header) return false;
  const parts: Record<string, string> = {};
  const v1s: string[] = [];
  for (const piece of header.split(",")) {
    const [k, v] = piece.split("=");
    if (!k || !v) continue;
    if (k.trim() === "v1") v1s.push(v.trim());
    else parts[k.trim()] = v.trim();
  }
  const t = parts.t;
  if (!t || v1s.length === 0) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  const expBuf = Buffer.from(expected);
  return v1s.some((sig) => {
    const sigBuf = Buffer.from(sig);
    if (sigBuf.length !== expBuf.length) return false;
    try { return timingSafeEqual(sigBuf, expBuf); } catch { return false; }
  });
}

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabase = getServiceClient();
        const secrets = await loadSecrets(supabase);
        if (!secrets.stripe_webhook_secret) {
          return new Response("Stripe webhook not configured", { status: 500 });
        }

        const body = await request.text();
        const sig = request.headers.get("stripe-signature");
        if (!verifyStripe(sig, body, secrets.stripe_webhook_secret)) {
          return new Response("Invalid signature", { status: 401 });
        }

        const event = JSON.parse(body) as {
          id: string;
          type: string;
          data: { object: Record<string, unknown> };
        };

        // Idempotency: Stripe sends a stable event.id.
        const fresh = await markWebhookProcessed(supabase, "stripe", event.id, event.type);
        if (!fresh) return new Response("ok (duplicate)");

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
            const { data: booking } = await supabase
              .from("bookings")
              .update({
                payment_status: "paid",
                stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
                stripe_session_id: session.id,
              })
              .eq("id", bookingId)
              .select("id, email, full_name, scheduled_at")
              .maybeSingle();

            if (booking) {
              try {
                await supabase.rpc("enqueue_email" as never, {
                  p_queue_name: "transactional_emails",
                  p_payload: {
                    template_name: "payment-confirmed",
                    recipient_email: (booking as { email: string }).email,
                    idempotency_key: `payment-${booking.id}-${event.id}`,
                    template_data: {
                      name: (booking as { full_name: string }).full_name,
                    },
                  },
                } as never);
              } catch (e) {
                console.warn("payment-confirmed email skipped:", (e as Error).message);
              }
            }
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
