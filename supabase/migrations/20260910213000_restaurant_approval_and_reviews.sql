-- Fase 2/3: platform-admin approval workflow for new restaurant registrations, and a
-- customer review/rating system. Builds on 20260910202624 (anon grant fix for
-- restaurants_public) — that migration alone is NOT sufficient: migration
-- 20260607085338 dropped the anon RLS policy on public.restaurants ("public read
-- published restaurants via view") and never recreated it, so with RLS enabled and
-- zero anon policies, every anon SELECT against the base table (and therefore
-- against the security_invoker restaurants_public view) is denied regardless of
-- column grants. This migration recreates that policy — now also requiring approval
-- — so the two migrations together actually fix the public directory.

-- ============ 1. Restaurant approval status ============
DO $$ BEGIN
  CREATE TYPE public.restaurant_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill existing restaurants as 'approved' (nothing already live gets hidden),
-- then flip the default so every NEW registration starts out pending review.
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS status public.restaurant_status NOT NULL DEFAULT 'approved';
ALTER TABLE public.restaurants ALTER COLUMN status SET DEFAULT 'pending';

COMMENT ON COLUMN public.restaurants.status IS
  'Platform-admin approval gate. New self-service signups default to pending and are invisible to the public directory/booking widget until an admin approves them via app.admin.tsx.';

-- anon needs a column-level grant on `status` too: it is now referenced in the
-- restaurants_public view WHERE clause and in the RLS policies below, and
-- security_invoker views + RLS quals both require the querying role to hold SELECT
-- on every base-table column they touch, independent of the policy itself.
GRANT SELECT (status) ON public.restaurants TO anon;

-- Recreate the anon read policy (see note above) — now gated on approval too.
DROP POLICY IF EXISTS "public read published restaurants via view" ON public.restaurants;
CREATE POLICY "public read published restaurants via view"
ON public.restaurants FOR SELECT TO anon
USING (is_published = true AND status = 'approved');

-- Both reservation-insert policies (anon widget + authenticated customer) must also
-- require approval, not just publication, so a pending restaurant can't take live
-- bookings while awaiting review.
DROP POLICY IF EXISTS "public can submit reservation request" ON public.reservations;
CREATE POLICY "public can submit reservation request"
ON public.reservations FOR INSERT TO anon
WITH CHECK (
  status = 'pending'
  AND source = 'widget'
  AND created_by IS NULL
  AND party_size > 0
  AND party_size <= 50
  AND EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = reservations.restaurant_id AND r.is_published = true AND r.status = 'approved'
  )
);

DROP POLICY IF EXISTS "auth users can submit reservation" ON public.reservations;
CREATE POLICY "auth users can submit reservation"
ON public.reservations FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND status = 'pending'::reservation_status
  AND source = 'widget'::reservation_source
  AND created_by IS NULL
  AND party_size > 0 AND party_size <= 50
  AND EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = reservations.restaurant_id AND r.is_published = true AND r.status = 'approved'
  )
);

-- ============ 2. Reviews ============
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reservation_id)
);
CREATE INDEX IF NOT EXISTS reviews_restaurant_idx ON public.reviews(restaurant_id);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews public read" ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (true);

-- A review tied to a reservation must be the reviewer's own COMPLETED reservation at
-- that restaurant — this is what makes reviews "verified" (a real trust differentiator
-- vs. competitors' fake/drive-by review problems). Untied reviews (reservation_id
-- null) are still allowed for flexibility but the UI only offers the verified path.
CREATE POLICY "customers write own review" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      reservation_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.reservations r
        WHERE r.id = reviews.reservation_id
          AND r.user_id = auth.uid()
          AND r.restaurant_id = reviews.restaurant_id
          AND r.status = 'completed'
      )
    )
  );

CREATE POLICY "customers update own review" ON public.reviews
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "customers delete own review" ON public.reviews
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "platform admin full reviews" ON public.reviews
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

DROP TRIGGER IF EXISTS trg_reviews_touch ON public.reviews;
CREATE TRIGGER trg_reviews_touch BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ 3. restaurants_public: require approval + surface rating summary ============
CREATE OR REPLACE VIEW public.restaurants_public
WITH (security_invoker = true) AS
SELECT
  r.id, r.name, r.slug, r.description, r.cuisine, r.price_range,
  r.address, r.city, r.phone, r.whatsapp_phone, r.email, r.website,
  r.cover_image_url, r.photos, r.hours,
  COALESCE(rv.avg_rating, 0)::numeric(3,2) AS avg_rating,
  COALESCE(rv.review_count, 0)::int AS review_count
FROM public.restaurants r
LEFT JOIN (
  SELECT restaurant_id, AVG(rating)::numeric AS avg_rating, COUNT(*)::int AS review_count
  FROM public.reviews
  GROUP BY restaurant_id
) rv ON rv.restaurant_id = r.id
WHERE r.is_published = true AND r.status = 'approved';

GRANT SELECT ON public.restaurants_public TO anon, authenticated;
