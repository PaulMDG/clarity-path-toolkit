
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS calendly_invitee_uri text UNIQUE,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_bookings_email_status ON public.bookings (email, payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session ON public.bookings (stripe_session_id);
