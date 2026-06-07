
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DROP FUNCTION IF EXISTS public.verify_operator_pin(uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.verify_operator_pin(
  _restaurant_id uuid,
  _pin text
)
RETURNS TABLE(id uuid, name text, role text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.is_member(auth.uid(), _restaurant_id) THEN
    RAISE EXCEPTION 'Not a member of this restaurant';
  END IF;
  IF _pin !~ '^\d{4}$' THEN
    RETURN;
  END IF;
  RETURN QUERY
    SELECT o.id, o.name, o.role
    FROM public.staff_operators o
    WHERE o.restaurant_id = _restaurant_id
      AND o.active = true
      AND o.pin_hash = encode(extensions.digest(o.pin_salt || ':' || _pin, 'sha256'), 'hex')
    LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_operator_pin(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_operator_pin(uuid, text) TO authenticated;
