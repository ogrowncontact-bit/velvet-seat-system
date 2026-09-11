-- Fix: anon cannot read public.restaurants_public
GRANT SELECT (
  id, name, slug, description, cuisine, price_range,
  address, city, phone, whatsapp_phone, email, website,
  cover_image_url, photos, hours, is_published
) ON public.restaurants TO anon;

-- ============ 1. Restaurant approval status ============
DO $$ BEGIN
  CREATE TYPE public.restaurant_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS status public.restaurant_status NOT NULL DEFAULT 'approved';

ALTER TABLE public.restaurants ALTER COLUMN status SET DEFAULT 'pending';

COMMENT ON COLUMN public.restaurants.status IS
  'Platform-admin approval gate. New self-service signups default to pending and are invisible to the public directory/booking widget until an admin approves them via app.admin.tsx.';

GRANT SELECT (status) ON public.restaurants TO anon;

DROP POLICY IF EXISTS "public read published restaurants via view" ON public.restaurants;
CREATE POLICY "public read published restaurants via view"
ON public.restaurants FOR SELECT TO anon
USING (is_published = true AND status = 'approved');

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

-- ============ 3. restaurants_public ============
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