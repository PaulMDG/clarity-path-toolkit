import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";

// Calendly v2 webhook payload shape (relevant fields only)
interface CalendlyPayload {
  event: "invitee.created" | "invitee.canceled" | string;
  payload: {
    event?: string; // event URI
    uri?: string;   // invitee URI
    email?: string;
    name?: string;
    cancel_url?: string;
    reschedule_url?: string;
    scheduled_event?: {
      uri?: string;
      start_time?: string;
      end_time?: string;
    };
  };
}

function verifySignature(header: string | null, body: string, secret: string): boolean {
  if (!header) return false;
  // Header format: "t=<ts>,v1=<sig>"
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), (v ?? "").trim()];
    }),
  );
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;
  const signedPayload = `${t}.${body}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");
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
        const secret = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
        if (!secret) {
          return new Response("Server not configured", { status: 500 });
        }
        const sig = request.headers.get("calendly-webhook-signature");
        if (!verifySignature(sig, body, secret)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let evt: CalendlyPayload;
        try { evt = JSON.parse(body); } catch { return new Response("Bad JSON", { status: 400 }); }

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );

        const inviteeUri = evt.payload.uri ?? null;
        const email = (evt.payload.email ?? "").toLowerCase().trim();
        const startTime = evt.payload.scheduled_event?.start_time ?? null;
        const eventUri = evt.payload.scheduled_event?.uri ?? null;

        if (evt.event === "invitee.canceled") {
          if (inviteeUri) {
            await supabase
              .from("bookings")
              .update({ cancelled_at: new Date().toISOString() })
              .eq("calendly_invitee_uri", inviteeUri);
          }
          return new Response("ok");
        }

        if (evt.event === "invitee.created") {
          // Try to attach to most recent matching booking by email (within last 24h, not cancelled)
          let attached = false;
          if (email) {
            const { data: existing } = await supabase
              .from("bookings")
              .select("id")
              .eq("email", email)
              .is("calendly_invitee_uri", null)
              .is("cancelled_at", null)
              .order("created_at", { ascending: false })
              .limit(1);

            if (existing && existing.length > 0) {
              await supabase
                .from("bookings")
                .update({
                  calendly_invitee_uri: inviteeUri,
                  calendly_event_url: eventUri,
                  scheduled_at: startTime,
                })
                .eq("id", existing[0].id);
              attached = true;
            }
          }

          if (!attached) {
            // No pre-existing booking — insert a new one from the Calendly event
            await supabase.from("bookings").insert({
              full_name: evt.payload.name ?? "Calendly invitee",
              email: email || "unknown@calendly.local",
              payment_status: "free",
              calendly_invitee_uri: inviteeUri,
              calendly_event_url: eventUri,
              scheduled_at: startTime,
            });
          }
          return new Response("ok");
        }

        return new Response("ignored");
      },
    },
  },
});
