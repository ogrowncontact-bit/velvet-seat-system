
-- 1) Remove anon SELECT on base restaurants table; public view stays in place.
DROP POLICY IF EXISTS "public read published restaurants via view" ON public.restaurants;
REVOKE SELECT ON public.restaurants FROM anon;

-- 2) Hide staff PIN credentials from clients. Verification via SECURITY DEFINER RPC.
REVOKE SELECT ON public.staff_operators FROM authenticated, anon;
GRANT SELECT (id, restaurant_id, name, role, active, created_at, updated_at)
  ON public.staff_operators TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.staff_operators TO authenticated;
GRANT ALL ON public.staff_operators TO service_role;

CREATE OR REPLACE FUNCTION public.verify_operator_pin(
  _restaurant_id uuid,
  _operator_id uuid,
  _pin_hash text
)
RETURNS TABLE(id uuid, name text, role text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_member(auth.uid(), _restaurant_id) THEN
    RAISE EXCEPTION 'Not a member of this restaurant';
  END IF;
  RETURN QUERY
    SELECT o.id, o.name, o.role
    FROM public.staff_operators o
    WHERE o.id = _operator_id
      AND o.restaurant_id = _restaurant_id
      AND o.active = true
      AND o.pin_hash = _pin_hash;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_operator_pin(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_operator_pin(uuid, uuid, text) TO authenticated;
