-- Fix: anon cannot read public.restaurants_public (and thus /restaurants, /r/:slug, /book
-- all appear empty to logged-out visitors).
--
-- Root cause: migration 20260605100848 revoked full-table SELECT from anon on
-- public.restaurants and relied on an RLS policy ("public read published restaurants
-- via view") to let restaurants_public serve rows to anon. But restaurants_public was
-- created WITH (security_invoker = true), which means Postgres checks the QUERYING
-- role's own table-level privileges on the underlying base table before RLS is even
-- evaluated. Without a GRANT SELECT on public.restaurants for anon, every anon query
-- against the view fails with "permission denied for table restaurants" regardless of
-- the RLS policy. The reservations INSERT policy has the same issue: its WITH CHECK
-- clause runs a subquery against public.restaurants as the invoking role (anon), which
-- also silently requires SELECT on the referenced columns.
--
-- Fix: grant SELECT to anon on exactly the columns restaurants_public exposes (plus
-- is_published, which is referenced in the view's WHERE clause and in the reservations
-- policy's EXISTS check, but is not itself selected). This keeps default_deposit,
-- currency, timezone and created_by unreachable by anon, preserving the intent of the
-- original hardening migration.

GRANT SELECT (
  id, name, slug, description, cuisine, price_range,
  address, city, phone, whatsapp_phone, email, website,
  cover_image_url, photos, hours, is_published
) ON public.restaurants TO anon;
