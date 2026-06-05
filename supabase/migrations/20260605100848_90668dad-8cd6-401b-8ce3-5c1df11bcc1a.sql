
-- 1) Restrict public exposure of restaurants: replace permissive anon policy with a curated view
DROP POLICY IF EXISTS "public read published restaurants" ON public.restaurants;
REVOKE SELECT ON public.restaurants FROM anon;

CREATE OR REPLACE VIEW public.restaurants_public
WITH (security_invoker = true) AS
SELECT id, name, slug, description, cuisine, price_range,
       address, city, phone, whatsapp_phone, email, website,
       cover_image_url, photos, hours
FROM public.restaurants
WHERE is_published = true;

GRANT SELECT ON public.restaurants_public TO anon, authenticated;
-- Re-add an anon RLS policy on the base table so the view returns rows for anon
CREATE POLICY "public read published restaurants via view"
ON public.restaurants FOR SELECT TO anon
USING (is_published = true);
-- Note: view exposes only safe columns; default_deposit/currency/timezone/created_by are no longer reachable via anon.

-- 2) Privilege escalation fix on restaurant_members self-insert
DROP POLICY IF EXISTS "self insert as owner of own restaurant" ON public.restaurant_members;
CREATE POLICY "self insert as owner of own restaurant"
ON public.restaurant_members FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'owner'::app_role
  AND EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = restaurant_members.restaurant_id
      AND r.created_by = auth.uid()
  )
);

-- 3) Public reservation insert restricted to published restaurants + sane party_size
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
    WHERE r.id = reservations.restaurant_id AND r.is_published = true
  )
);

-- 4) Tables: split staff vs manager updates with column-level enforcement via trigger
DROP POLICY IF EXISTS "staff update table status" ON public.tables;

CREATE POLICY "manager update tables"
ON public.tables FOR UPDATE TO authenticated
USING (is_manager_or_owner(auth.uid(), restaurant_id))
WITH CHECK (is_manager_or_owner(auth.uid(), restaurant_id));

CREATE POLICY "member update tables"
ON public.tables FOR UPDATE TO authenticated
USING (is_member(auth.uid(), restaurant_id))
WITH CHECK (is_member(auth.uid(), restaurant_id));

CREATE OR REPLACE FUNCTION public.enforce_tables_column_perms()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF is_manager_or_owner(auth.uid(), NEW.restaurant_id) OR is_platform_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  -- Non-managers may only change status and dwell_minutes
  IF NEW.label       IS DISTINCT FROM OLD.label
  OR NEW.seats       IS DISTINCT FROM OLD.seats
  OR NEW.shape       IS DISTINCT FROM OLD.shape
  OR NEW.room_id     IS DISTINCT FROM OLD.room_id
  OR NEW.pos_x       IS DISTINCT FROM OLD.pos_x
  OR NEW.pos_y       IS DISTINCT FROM OLD.pos_y
  OR NEW.restaurant_id IS DISTINCT FROM OLD.restaurant_id THEN
    RAISE EXCEPTION 'Only managers/owners may modify structural table attributes';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_tables_column_perms ON public.tables;
CREATE TRIGGER enforce_tables_column_perms
BEFORE UPDATE ON public.tables
FOR EACH ROW EXECUTE FUNCTION public.enforce_tables_column_perms();

-- 5) Lock down SECURITY DEFINER helper functions: only authenticated needs them for RLS
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_manager_or_owner(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager_or_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated;
