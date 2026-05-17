import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { getServiceClient, loadSecrets, markWebhookProcessed } from "@/lib/webhooks.server";

interface CalendlyPayload {
  event: "invitee.created" | "invitee.canceled" | string;
  payload: {
    event?: string;
    uri?: string;
    email?: string;
    name?: string;
    cancel_url?: string;
    reschedule_url?: string;
    cancellation?: { reason?: string };
    scheduled_event?: {
      uri?: string;
      start_time?: string;
      end_time?: string;
    };
  };
}

function verifySignature(header: string | null, body: string, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), (v ?? "").trim()];
    }),
  );
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/calendly")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        const supabase = getServiceClient();
        const secrets = await loadSecrets(supabase);
        if (!secrets.calendly_webhook_signing_key) {
          return new Response("Calendly webhook not configured", { status: 500 });
        }

        const sig = request.headers.get("calendly-webhook-signature");
        if (!verifySignature(sig, body, secrets.calendly_webhook_signing_key)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let evt: CalendlyPayload;
        try { evt = JSON.parse(body); } catch { return new Response("Bad JSON", { status: 400 }); }

        // Idempotency: invitee URI + event type uniquely identifies the delivery
        const inviteeUri = evt.payload.uri ?? null;
        const eventKey = `${evt.event}:${inviteeUri ?? body.length}`;
        const fresh = await markWebhookProcessed(supabase, "calendly", eventKey, evt.event);
        if (!fresh) return new Response("ok (duplicate)");

        const email = (evt.payload.email ?? "").toLowerCase().trim();
        const startTime = evt.payload.scheduled_event?.start_time ?? null;
        const eventUri = evt.payload.scheduled_event?.uri ?? null;

        if (evt.event === "invitee.canceled") {
          if (inviteeUri) {
            const { data: updated } = await supabase
              .from("bookings")
              .update({ cancelled_at: new Date().toISOString() })
              .eq("calendly_invitee_uri", inviteeUri)
              .select("id, email, full_name, scheduled_at")
              .maybeSingle();
            if (updated) {
              await tryEnqueueEmail(supabase, "booking-cancelled", updated as BookingRow, eventKey);
            }
          }
          return new Response("ok");
        }

        if (evt.event === "invitee.created") {
          // 1) If we already linked this invitee URI, do nothing.
          if (inviteeUri) {
            const { data: existing } = await supabase
              .from("bookings")
              .select("id")
              .eq("calendly_invitee_uri", inviteeUri)
              .maybeSingle();
            if (existing) return new Response("ok (already linked)");
          }

          // 2) Match a pending booking by email + recency.
          let attachedId: string | null = null;
          if (email) {
            const { data: candidates } = await supabase
              .from("bookings")
              .select("id, email, scheduled_at, calendly_invitee_uri, created_at")
              .eq("email", email)
              .is("calendly_invitee_uri", null)
              .is("cancelled_at", null)
              .order("created_at", { ascending: false })
              .limit(5);

            const list = candidates ?? [];
            // Prefer one created within the last 6 hours (recent booking flow)
            const cutoff = Date.now() - 6 * 60 * 60 * 1000;
            const recent = list.find((b) => new Date(b.created_at!).getTime() >= cutoff);
            attachedId = (recent ?? list[0])?.id ?? null;
          }

          // 3) Fallback: match by start_time if a pending booking already had one (e.g., reschedule).
          if (!attachedId && startTime) {
            const { data: byTime } = await supabase
              .from("bookings")
              .select("id")
              .eq("scheduled_at", startTime)
              .is("calendly_invitee_uri", null)
              .is("cancelled_at", null)
              .limit(1);
            attachedId = byTime?.[0]?.id ?? null;
          }

          let booking: BookingRow | null = null;
          if (attachedId) {
            const { data: updated } = await supabase
              .from("bookings")
              .update({
                calendly_invitee_uri: inviteeUri,
                calendly_event_url: eventUri,
                scheduled_at: startTime,
              })
              .eq("id", attachedId)
              .select("id, email, full_name, scheduled_at")
              .maybeSingle();
            booking = (updated as BookingRow) ?? null;
          } else {
            // 4) No pre-existing booking — insert a new one from the Calendly event.
            const { data: inserted } = await supabase
              .from("bookings")
              .insert({
                full_name: evt.payload.name ?? "Calendly invitee",
                email: email || "unknown@calendly.local",
                payment_status: "free",
                calendly_invitee_uri: inviteeUri,
                calendly_event_url: eventUri,
                scheduled_at: startTime,
              })
              .select("id, email, full_name, scheduled_at")
              .maybeSingle();
            booking = (inserted as BookingRow) ?? null;
          }

          if (booking) {
            await tryEnqueueEmail(supabase, "booking-confirmed", booking, eventKey);
          }
          return new Response("ok");
        }

        return new Response("ignored");
      },
    },
  },
});

type BookingRow = { id: string; email: string; full_name: string; scheduled_at: string | null };

async function tryEnqueueEmail(
  supabase: ReturnType<typeof getServiceClient>,
  template: string,
  booking: BookingRow,
  idempotencyKey: string,
) {
  try {
    // If Lovable Emails has been set up, this RPC exists; otherwise it just fails silently.
    await supabase.rpc("enqueue_email" as never, {
      p_queue_name: "transactional_emails",
      p_payload: {
        template_name: template,
        recipient_email: booking.email,
        idempotency_key: `${template}-${booking.id}-${idempotencyKey}`,
        template_data: {
          name: booking.full_name,
          scheduled_at: booking.scheduled_at,
        },
      },
    } as never);
  } catch (e) {
    console.warn("email enqueue skipped:", (e as Error).message);
  }
}
