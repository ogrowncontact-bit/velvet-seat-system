
-- ============ 1. Novos campos ============
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS default_duration_minutes integer NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS slot_interval_minutes integer NOT NULL DEFAULT 30;

ALTER TABLE public.tables
  ADD COLUMN IF NOT EXISTS min_seats integer NOT NULL DEFAULT 1;

-- ============ 2. restaurant_hours ============
CREATE TABLE IF NOT EXISTS public.restaurant_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  shift_name text NOT NULL DEFAULT 'Serviço',
  opens_at time NOT NULL,
  closes_at time NOT NULL,
  last_seating_offset_minutes integer NOT NULL DEFAULT 60,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_restaurant_hours_rest_day ON public.restaurant_hours(restaurant_id, weekday);

GRANT SELECT ON public.restaurant_hours TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_hours TO authenticated;
GRANT ALL ON public.restaurant_hours TO service_role;
ALTER TABLE public.restaurant_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hours public read published" ON public.restaurant_hours
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.is_published));

CREATE POLICY "hours members read" ON public.restaurant_hours
  FOR SELECT TO authenticated
  USING (public.is_member(auth.uid(), restaurant_id) OR public.is_platform_admin(auth.uid()));

CREATE POLICY "hours managers write" ON public.restaurant_hours
  FOR ALL TO authenticated
  USING (public.is_manager_or_owner(auth.uid(), restaurant_id) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_manager_or_owner(auth.uid(), restaurant_id) OR public.is_platform_admin(auth.uid()));

CREATE TRIGGER trg_restaurant_hours_touch BEFORE UPDATE ON public.restaurant_hours
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ 3. restaurant_closures ============
CREATE TABLE IF NOT EXISTS public.restaurant_closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  closed_on date NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, closed_on)
);

GRANT SELECT ON public.restaurant_closures TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_closures TO authenticated;
GRANT ALL ON public.restaurant_closures TO service_role;
ALTER TABLE public.restaurant_closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "closures public read published" ON public.restaurant_closures
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.is_published));

CREATE POLICY "closures members read" ON public.restaurant_closures
  FOR SELECT TO authenticated
  USING (public.is_member(auth.uid(), restaurant_id) OR public.is_platform_admin(auth.uid()));

CREATE POLICY "closures managers write" ON public.restaurant_closures
  FOR ALL TO authenticated
  USING (public.is_manager_or_owner(auth.uid(), restaurant_id) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_manager_or_owner(auth.uid(), restaurant_id) OR public.is_platform_admin(auth.uid()));

-- ============ 4. Helper: dentro do horário? ============
CREATE OR REPLACE FUNCTION public.is_within_service_hours(_restaurant_id uuid, _at timestamptz)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _tz text;
  _local timestamp;
  _d date;
  _t time;
  _wd smallint;
  _has_hours boolean;
BEGIN
  SELECT COALESCE(timezone, 'UTC') INTO _tz FROM public.restaurants WHERE id = _restaurant_id;
  IF _tz IS NULL THEN RETURN true; END IF;

  _local := _at AT TIME ZONE _tz;
  _d := _local::date;
  _t := _local::time;
  _wd := EXTRACT(DOW FROM _local)::smallint;

  IF EXISTS (SELECT 1 FROM public.restaurant_closures WHERE restaurant_id = _restaurant_id AND closed_on = _d) THEN
    RETURN false;
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.restaurant_hours WHERE restaurant_id = _restaurant_id AND active) INTO _has_hours;
  IF NOT _has_hours THEN RETURN true; END IF; -- sem horários configurados: não bloqueia

  RETURN EXISTS (
    SELECT 1 FROM public.restaurant_hours h
    WHERE h.restaurant_id = _restaurant_id AND h.active AND h.weekday = _wd
      AND _t >= h.opens_at
      AND _t <= (h.closes_at - make_interval(mins => h.last_seating_offset_minutes))
      AND h.closes_at > h.opens_at
  );
END $$;

REVOKE EXECUTE ON FUNCTION public.is_within_service_hours(uuid, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_within_service_hours(uuid, timestamptz) TO authenticated, service_role;

-- ============ 5. Trigger de validação de reservas ============
CREATE OR REPLACE FUNCTION public.validate_reservation()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _default_dur integer;
  _seats integer;
  _min_seats integer;
  _dwell integer;
BEGIN
  IF NEW.status IN ('cancelled', 'no_show') THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(default_duration_minutes, 90) INTO _default_dur
    FROM public.restaurants WHERE id = NEW.restaurant_id;

  IF NEW.party_size IS NULL OR NEW.party_size < 1 THEN
    RAISE EXCEPTION 'Número de pessoas inválido';
  END IF;

  -- duração
  IF NEW.table_id IS NOT NULL THEN
    SELECT seats, min_seats, dwell_minutes INTO _seats, _min_seats, _dwell
      FROM public.tables WHERE id = NEW.table_id;
    IF _seats IS NULL THEN
      RAISE EXCEPTION 'Mesa não encontrada';
    END IF;
    IF NEW.party_size > _seats THEN
      RAISE EXCEPTION 'A mesa comporta no máximo % pessoas', _seats;
    END IF;
    IF _min_seats IS NOT NULL AND NEW.party_size < _min_seats THEN
      RAISE EXCEPTION 'Esta mesa exige no mínimo % pessoas', _min_seats;
    END IF;
    IF NEW.duration_minutes IS NULL OR NEW.duration_minutes <= 0 THEN
      NEW.duration_minutes := COALESCE(NULLIF(_dwell, 0), _default_dur);
    END IF;
  ELSE
    IF NEW.duration_minutes IS NULL OR NEW.duration_minutes <= 0 THEN
      NEW.duration_minutes := _default_dur;
    END IF;
    -- precisa caber em pelo menos uma mesa do restaurante
    IF EXISTS (SELECT 1 FROM public.tables WHERE restaurant_id = NEW.restaurant_id)
       AND NOT EXISTS (
         SELECT 1 FROM public.tables
         WHERE restaurant_id = NEW.restaurant_id AND seats >= NEW.party_size
       ) THEN
      RAISE EXCEPTION 'Não há mesa com capacidade para % pessoas', NEW.party_size;
    END IF;
  END IF;

  -- horário de funcionamento
  IF NOT public.is_within_service_hours(NEW.restaurant_id, NEW.reserved_at) THEN
    RAISE EXCEPTION 'O restaurante não aceita reservas neste dia/horário';
  END IF;

  -- conflito na mesma mesa
  IF NEW.table_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.table_id = NEW.table_id
        AND r.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND r.status NOT IN ('cancelled', 'no_show', 'completed')
        AND tstzrange(r.reserved_at, r.reserved_at + make_interval(mins => GREATEST(COALESCE(r.duration_minutes, 90), 1)))
            && tstzrange(NEW.reserved_at, NEW.reserved_at + make_interval(mins => GREATEST(NEW.duration_minutes, 1)))
    ) THEN
      RAISE EXCEPTION 'Já existe uma reserva nesta mesa neste horário';
    END IF;
  END IF;

  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.validate_reservation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_reservations_validate ON public.reservations;
CREATE TRIGGER trg_reservations_validate
  BEFORE INSERT OR UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.validate_reservation();

-- ============ 6. Mesas livres ============
CREATE OR REPLACE FUNCTION public.available_tables(_restaurant_id uuid, _at timestamptz, _party_size integer)
RETURNS TABLE(id uuid, label text, seats integer, room_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH dur AS (
    SELECT COALESCE(default_duration_minutes, 90) AS d FROM public.restaurants WHERE id = _restaurant_id
  )
  SELECT t.id, t.label, t.seats, t.room_id
  FROM public.tables t, dur
  WHERE t.restaurant_id = _restaurant_id
    AND t.seats >= _party_size
    AND COALESCE(t.min_seats, 1) <= _party_size
    AND NOT EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.table_id = t.id
        AND r.status NOT IN ('cancelled', 'no_show', 'completed')
        AND tstzrange(r.reserved_at, r.reserved_at + make_interval(mins => GREATEST(COALESCE(r.duration_minutes, dur.d), 1)))
            && tstzrange(_at, _at + make_interval(mins => GREATEST(COALESCE(NULLIF(t.dwell_minutes,0), dur.d), 1)))
    )
  ORDER BY t.seats ASC, t.label ASC;
$$;

REVOKE EXECUTE ON FUNCTION public.available_tables(uuid, timestamptz, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.available_tables(uuid, timestamptz, integer) TO anon, authenticated, service_role;

-- ============ 7. Horários disponíveis do dia ============
CREATE OR REPLACE FUNCTION public.available_slots(_restaurant_id uuid, _date date, _party_size integer)
RETURNS TABLE(slot timestamptz, local_time text, tables_free integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _tz text;
  _interval integer;
  _wd smallint;
  _h record;
  _t time;
  _ts timestamptz;
  _free integer;
  _has_tables boolean;
BEGIN
  SELECT COALESCE(timezone,'UTC'), GREATEST(COALESCE(slot_interval_minutes,30),5)
    INTO _tz, _interval FROM public.restaurants WHERE id = _restaurant_id;
  IF _tz IS NULL THEN RETURN; END IF;

  IF EXISTS (SELECT 1 FROM public.restaurant_closures WHERE restaurant_id = _restaurant_id AND closed_on = _date) THEN
    RETURN;
  END IF;

  _wd := EXTRACT(DOW FROM _date)::smallint;
  SELECT EXISTS (SELECT 1 FROM public.tables WHERE restaurant_id = _restaurant_id) INTO _has_tables;

  FOR _h IN
    SELECT opens_at, closes_at, last_seating_offset_minutes
    FROM public.restaurant_hours
    WHERE restaurant_id = _restaurant_id AND active AND weekday = _wd AND closes_at > opens_at
    ORDER BY opens_at
  LOOP
    _t := _h.opens_at;
    WHILE _t <= (_h.closes_at - make_interval(mins => _h.last_seating_offset_minutes)) LOOP
      _ts := (_date + _t) AT TIME ZONE _tz;
      IF _has_tables THEN
        SELECT COUNT(*)::int INTO _free FROM public.available_tables(_restaurant_id, _ts, _party_size);
      ELSE
        _free := 1;
      END IF;
      slot := _ts;
      local_time := to_char(_t, 'HH24:MI');
      tables_free := _free;
      RETURN NEXT;
      _t := _t + make_interval(mins => _interval);
    END LOOP;
  END LOOP;
END $$;

REVOKE EXECUTE ON FUNCTION public.available_slots(uuid, date, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.available_slots(uuid, date, integer) TO anon, authenticated, service_role;
