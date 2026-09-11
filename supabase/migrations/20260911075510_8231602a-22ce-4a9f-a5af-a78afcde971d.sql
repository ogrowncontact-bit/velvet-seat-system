-- Stripe Connect (direct charges) for reservation deposits.
--
-- Architecture: each restaurant gets its own Stripe Connect Express account.
-- Deposits are charged as DIRECT charges on that connected account (not
-- destination charges on the platform account), so the restaurant is the
-- merchant of record and 100% of the deposit (minus Stripe's own processing
-- fee) settles straight to their own bank account. The platform takes no
-- application fee on these charges — monetization is a separate subscription,
-- billed independently (not modeled here).

-- ============ 1. Restaurant Stripe Connect status ============

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_details_submitted boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.restaurants.stripe_account_id IS
  'Stripe Connect Express account id (acct_...) for this restaurant. Deposits are charged directly against this account.';

COMMENT ON COLUMN public.restaurants.stripe_charges_enabled IS
  'Mirrors the connected account''s charges_enabled flag from Stripe (kept in sync via account.updated webhook). Booking flow only offers a deposit step when true.';

GRANT SELECT (stripe_charges_enabled) ON public.restaurants TO anon, authenticated;

-- ============ 2. Reservation deposit tracking ============

DO $$ BEGIN
  CREATE TYPE public.deposit_status AS ENUM ('none', 'pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS deposit_status public.deposit_status NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS deposit_payment_intent_id text;

COMMENT ON COLUMN public.reservations.deposit_status IS
  'none = no deposit required for this restaurant/booking. pending = PaymentIntent created, awaiting confirmation. paid = charge succeeded, funds are with the restaurant. failed = card declined. refunded = restaurant refunded it themselves via their own Stripe dashboard.';

COMMENT ON COLUMN public.reservations.deposit_payment_intent_id IS
  'Stripe PaymentIntent id (pi_...), created directly on the restaurant''s connected account.';

COMMENT ON COLUMN public.reservations.deposit_amount IS
  'Amount actually charged for this reservation''s deposit (set alongside deposit_status=paid). Distinct from restaurants.default_deposit, which is the per-guest rate used to compute it.';

GRANT SELECT (deposit_status, deposit_amount) ON public.reservations TO anon, authenticated;

CREATE INDEX IF NOT EXISTS reservations_deposit_intent_idx ON public.reservations(deposit_payment_intent_id)
  WHERE deposit_payment_intent_id IS NOT NULL;