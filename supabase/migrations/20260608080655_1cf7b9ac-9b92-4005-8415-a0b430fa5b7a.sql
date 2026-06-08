
-- ============= restaurants additions =============
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS whatsapp_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_from text;

-- ============= enums =============
DO $$ BEGIN
  CREATE TYPE public.message_kind AS ENUM ('confirmation','reminder_24h','reminder_2h','waitlist_offer','reply_confirmed','reply_cancelled','test');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.message_direction AS ENUM ('out','in');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.message_status AS ENUM ('queued','sent','delivered','failed','received');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============= message_templates =============
CREATE TABLE IF NOT EXISTS public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  kind public.message_kind NOT NULL,
  body text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, kind)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_templates TO authenticated;
GRANT ALL ON public.message_templates TO service_role;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members rw templates" ON public.message_templates
  FOR ALL TO authenticated
  USING (public.is_member(auth.uid(), restaurant_id))
  WITH CHECK (public.is_member(auth.uid(), restaurant_id));

CREATE POLICY "platform admin full templates" ON public.message_templates
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE TRIGGER trg_templates_touch BEFORE UPDATE ON public.message_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============= message_queue =============
CREATE TABLE IF NOT EXISTS public.message_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE CASCADE,
  waitlist_id uuid REFERENCES public.waitlist(id) ON DELETE CASCADE,
  kind public.message_kind NOT NULL,
  to_phone text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS message_queue_due_idx
  ON public.message_queue (scheduled_for) WHERE processed_at IS NULL;

GRANT SELECT ON public.message_queue TO authenticated;
GRANT ALL ON public.message_queue TO service_role;
ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read queue" ON public.message_queue
  FOR SELECT TO authenticated
  USING (public.is_member(auth.uid(), restaurant_id) OR public.is_platform_admin(auth.uid()));

-- ============= message_log =============
CREATE TABLE IF NOT EXISTS public.message_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  waitlist_id uuid REFERENCES public.waitlist(id) ON DELETE SET NULL,
  direction public.message_direction NOT NULL,
  kind public.message_kind,
  to_phone text,
  from_phone text,
  body text,
  status public.message_status NOT NULL DEFAULT 'queued',
  provider_sid text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS message_log_restaurant_created_idx
  ON public.message_log (restaurant_id, created_at DESC);

GRANT SELECT ON public.message_log TO authenticated;
GRANT ALL ON public.message_log TO service_role;
ALTER TABLE public.message_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read log" ON public.message_log
  FOR SELECT TO authenticated
  USING (public.is_member(auth.uid(), restaurant_id) OR public.is_platform_admin(auth.uid()));

-- ============= seed defaults function =============
CREATE OR REPLACE FUNCTION public.seed_message_templates(_restaurant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.message_templates (restaurant_id, kind, body) VALUES
    (_restaurant_id, 'confirmation',  'Olá {{guest}}! Sua reserva em {{restaurant}} para {{party}} pessoas em {{time}} foi recebida. Responda CONFIRMAR ou CANCELAR.'),
    (_restaurant_id, 'reminder_24h',  'Lembrete: {{guest}}, sua reserva em {{restaurant}} é amanhã às {{time}} para {{party}} pessoas. Responda CONFIRMAR ou CANCELAR.'),
    (_restaurant_id, 'reminder_2h',   '{{guest}}, sua mesa em {{restaurant}} é hoje às {{time}} para {{party}} pessoas. Até já!'),
    (_restaurant_id, 'waitlist_offer','{{guest}}, sua mesa em {{restaurant}} ficou pronta! Responda CONFIRMAR em até {{minutes}} min para garantir.'),
    (_restaurant_id, 'reply_confirmed','Obrigado! Sua reserva está confirmada.'),
    (_restaurant_id, 'reply_cancelled','Sua reserva foi cancelada. Esperamos você em outra ocasião.')
  ON CONFLICT (restaurant_id, kind) DO NOTHING;
END $$;

-- backfill existing restaurants
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT id FROM public.restaurants LOOP
    PERFORM public.seed_message_templates(r.id);
  END LOOP;
END $$;

-- seed on new restaurant
CREATE OR REPLACE FUNCTION public.trg_seed_message_templates()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.seed_message_templates(NEW.id); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_restaurants_seed_templates ON public.restaurants;
CREATE TRIGGER trg_restaurants_seed_templates
  AFTER INSERT ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.trg_seed_message_templates();

-- ============= enqueue helpers + triggers =============
CREATE OR REPLACE FUNCTION public.enqueue_reservation_messages()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _wa boolean;
BEGIN
  IF NEW.guest_phone IS NULL OR length(trim(NEW.guest_phone)) = 0 THEN
    RETURN NEW;
  END IF;
  SELECT whatsapp_enabled INTO _wa FROM public.restaurants WHERE id = NEW.restaurant_id;
  IF NOT COALESCE(_wa, false) THEN RETURN NEW; END IF;

  -- confirmation immediate
  INSERT INTO public.message_queue (restaurant_id, reservation_id, kind, to_phone, scheduled_for)
    VALUES (NEW.restaurant_id, NEW.id, 'confirmation', NEW.guest_phone, now());

  -- 24h reminder (only if reservation is > 25h away)
  IF NEW.reserved_at > now() + interval '25 hours' THEN
    INSERT INTO public.message_queue (restaurant_id, reservation_id, kind, to_phone, scheduled_for)
      VALUES (NEW.restaurant_id, NEW.id, 'reminder_24h', NEW.guest_phone, NEW.reserved_at - interval '24 hours');
  END IF;

  -- 2h reminder
  IF NEW.reserved_at > now() + interval '2 hours 15 minutes' THEN
    INSERT INTO public.message_queue (restaurant_id, reservation_id, kind, to_phone, scheduled_for)
      VALUES (NEW.restaurant_id, NEW.id, 'reminder_2h', NEW.guest_phone, NEW.reserved_at - interval '2 hours');
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_reservations_enqueue_wa ON public.reservations;
CREATE TRIGGER trg_reservations_enqueue_wa
  AFTER INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_reservation_messages();

CREATE OR REPLACE FUNCTION public.enqueue_waitlist_offer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _wa boolean;
BEGIN
  IF NEW.status <> 'offered' OR OLD.status = 'offered' THEN RETURN NEW; END IF;
  IF NEW.guest_phone IS NULL OR length(trim(NEW.guest_phone)) = 0 THEN RETURN NEW; END IF;
  SELECT whatsapp_enabled INTO _wa FROM public.restaurants WHERE id = NEW.restaurant_id;
  IF NOT COALESCE(_wa, false) THEN RETURN NEW; END IF;

  INSERT INTO public.message_queue (restaurant_id, waitlist_id, kind, to_phone, scheduled_for)
    VALUES (NEW.restaurant_id, NEW.id, 'waitlist_offer', NEW.guest_phone, now());
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_waitlist_enqueue_offer ON public.waitlist;
CREATE TRIGGER trg_waitlist_enqueue_offer
  AFTER UPDATE ON public.waitlist
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_waitlist_offer();
