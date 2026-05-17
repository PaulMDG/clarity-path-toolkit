import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Secrets = {
  stripe_secret_key: string | null;
  stripe_webhook_secret: string | null;
  calendly_webhook_signing_key: string | null;
};

export function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function loadSecrets(supabase: SupabaseClient): Promise<Secrets> {
  const { data } = await supabase
    .from("integration_secrets")
    .select("stripe_secret_key, stripe_webhook_secret, calendly_webhook_signing_key")
    .limit(1)
    .maybeSingle();
  return {
    stripe_secret_key: data?.stripe_secret_key || process.env.STRIPE_SECRET_KEY || null,
    stripe_webhook_secret: data?.stripe_webhook_secret || process.env.STRIPE_WEBHOOK_SECRET || null,
    calendly_webhook_signing_key:
      data?.calendly_webhook_signing_key || process.env.CALENDLY_WEBHOOK_SIGNING_KEY || null,
  };
}

/**
 * Record a webhook event for idempotency.
 * Returns true if this is the first time we see the event (we should process it),
 * false if we've already processed it.
 */
export async function markWebhookProcessed(
  supabase: SupabaseClient,
  provider: string,
  eventId: string,
  eventType?: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("webhook_events")
    .insert({ provider, event_id: eventId, event_type: eventType ?? null });
  if (error) {
    // 23505 = unique_violation => duplicate
    if ((error as { code?: string }).code === "23505") return false;
    // Fail-open: still process if we can't write the dedupe row
    console.warn("webhook idempotency insert failed", error);
    return true;
  }
  return true;
}
