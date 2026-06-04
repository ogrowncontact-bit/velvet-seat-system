
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS cuisine text,
  ADD COLUMN IF NOT EXISTS price_range text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS whatsapp_phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS hours jsonb,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

-- unique slug (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS restaurants_slug_unique
  ON public.restaurants (lower(slug)) WHERE slug IS NOT NULL;

-- public read access for published restaurants
GRANT SELECT ON public.restaurants TO anon;

DROP POLICY IF EXISTS "public read published restaurants" ON public.restaurants;
CREATE POLICY "public read published restaurants"
  ON public.restaurants FOR SELECT
  TO anon, authenticated
  USING (is_published = true);
