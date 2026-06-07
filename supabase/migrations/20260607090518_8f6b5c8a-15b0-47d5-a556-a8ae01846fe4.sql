
-- 1) waitlist columns
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS response_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS seated_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_waitlist_touch ON public.waitlist;
CREATE TRIGGER trg_waitlist_touch BEFORE UPDATE ON public.waitlist
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS waitlist_restaurant_status_idx
  ON public.waitlist(restaurant_id, status, created_at);

-- 2) restaurant anti no-show policy
DO $$ BEGIN
  CREATE TYPE public.no_show_policy AS ENUM ('none','card','deposit','fine');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS no_show_policy public.no_show_policy NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS no_show_deposit numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS no_show_fine numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS offer_timeout_minutes integer NOT NULL DEFAULT 10;

-- 3) Reliability score 0..100
CREATE OR REPLACE FUNCTION public.customer_reliability_score(_customer_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH stats AS (
    SELECT
      COUNT(*) FILTER (WHERE status = 'completed')   AS completed,
      COUNT(*) FILTER (WHERE status = 'no_show')     AS no_shows,
      COUNT(*) FILTER (WHERE status = 'cancelled')   AS cancelled,
      COUNT(*)                                       AS total
    FROM public.reservations
    WHERE customer_id = _customer_id
  )
  SELECT CASE
    WHEN total = 0 THEN 75 -- neutral for new customers
    ELSE GREATEST(0, LEAST(100,
      ROUND( ( (completed::numeric) - (no_shows * 2) - (cancelled * 0.5) ) / NULLIF(total,0) * 100 )::int
      + 50
    ))
  END
  FROM stats;
$$;

GRANT EXECUTE ON FUNCTION public.customer_reliability_score(uuid) TO authenticated;

-- 4) Promote next in waitlist (offer slot with deadline)
CREATE OR REPLACE FUNCTION public.promote_next_waitlist(_restaurant_id uuid)
RETURNS public.waitlist
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _row public.waitlist;
  _timeout integer;
BEGIN
  IF NOT (public.is_member(auth.uid(), _restaurant_id) OR public.is_platform_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Not a member of this restaurant';
  END IF;

  SELECT offer_timeout_minutes INTO _timeout FROM public.restaurants WHERE id = _restaurant_id;
  IF _timeout IS NULL THEN _timeout := 10; END IF;

  UPDATE public.waitlist w
     SET status = 'offered',
         notified_at = now(),
         response_deadline = now() + (_timeout || ' minutes')::interval
   WHERE w.id = (
     SELECT id FROM public.waitlist
      WHERE restaurant_id = _restaurant_id AND status = 'waiting'
      ORDER BY created_at ASC
      LIMIT 1
   )
   RETURNING * INTO _row;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.promote_next_waitlist(uuid) TO authenticated;

-- 5) Expire stale offers
CREATE OR REPLACE FUNCTION public.expire_stale_waitlist_offers(_restaurant_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _n integer;
BEGIN
  IF NOT (public.is_member(auth.uid(), _restaurant_id) OR public.is_platform_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Not a member of this restaurant';
  END IF;

  WITH upd AS (
    UPDATE public.waitlist
       SET status = 'expired'
     WHERE restaurant_id = _restaurant_id
       AND status = 'offered'
       AND response_deadline < now()
     RETURNING 1
  )
  SELECT COUNT(*) INTO _n FROM upd;
  RETURN COALESCE(_n, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_stale_waitlist_offers(uuid) TO authenticated;
