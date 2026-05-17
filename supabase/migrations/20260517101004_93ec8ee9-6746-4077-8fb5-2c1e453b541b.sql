
CREATE TABLE IF NOT EXISTS public.integration_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_secret_key text,
  stripe_webhook_secret text,
  calendly_webhook_signing_key text,
  calendly_personal_token text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage integration secrets"
  ON public.integration_secrets FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER set_integration_secrets_updated_at
  BEFORE UPDATE ON public.integration_secrets
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.integration_secrets (id) VALUES (gen_random_uuid())
  ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text NOT NULL,
  event_type text,
  processed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read webhook events"
  ON public.webhook_events FOR SELECT USING (is_admin());
