
-- ========== ENUMS ==========
CREATE TYPE public.app_role AS ENUM ('owner','manager','host','staff');
CREATE TYPE public.table_shape AS ENUM ('round','square','rect');
CREATE TYPE public.table_status AS ENUM ('available','reserved','occupied','cleaning','vip','delayed');
CREATE TYPE public.reservation_status AS ENUM ('pending','confirmed','seated','completed','no_show','cancelled');
CREATE TYPE public.reservation_source AS ENUM ('widget','phone','walk_in','google','instagram','staff');

-- ========== profiles ==========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  current_restaurant_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ========== restaurants ==========
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  currency TEXT NOT NULL DEFAULT 'USD',
  default_deposit NUMERIC(10,2) NOT NULL DEFAULT 0,
  cover_image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurants TO authenticated;
GRANT ALL ON public.restaurants TO service_role;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- ========== restaurant_members ==========
CREATE TABLE public.restaurant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_members TO authenticated;
GRANT ALL ON public.restaurant_members TO service_role;
ALTER TABLE public.restaurant_members ENABLE ROW LEVEL SECURITY;

-- ========== security definer helpers ==========
CREATE OR REPLACE FUNCTION public.is_member(_user_id UUID, _restaurant_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurant_members
    WHERE user_id = _user_id AND restaurant_id = _restaurant_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _restaurant_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurant_members
    WHERE user_id = _user_id AND restaurant_id = _restaurant_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_manager_or_owner(_user_id UUID, _restaurant_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurant_members
    WHERE user_id = _user_id AND restaurant_id = _restaurant_id AND role IN ('owner','manager')
  );
$$;

-- restaurants policies
CREATE POLICY "members read restaurant" ON public.restaurants FOR SELECT TO authenticated
  USING (public.is_member(auth.uid(), id));
CREATE POLICY "any authenticated create restaurant" ON public.restaurants FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "owner/manager update restaurant" ON public.restaurants FOR UPDATE TO authenticated
  USING (public.is_manager_or_owner(auth.uid(), id));
CREATE POLICY "owner delete restaurant" ON public.restaurants FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), id, 'owner'));

-- restaurant_members policies
CREATE POLICY "members see members" ON public.restaurant_members FOR SELECT TO authenticated
  USING (public.is_member(auth.uid(), restaurant_id));
CREATE POLICY "owner manage members" ON public.restaurant_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), restaurant_id, 'owner'))
  WITH CHECK (public.has_role(auth.uid(), restaurant_id, 'owner'));
-- allow first owner insert (when restaurant just created)
CREATE POLICY "self insert as owner of own restaurant" ON public.restaurant_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.created_by = auth.uid()
  ));

-- ========== rooms ==========
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read rooms" ON public.rooms FOR SELECT TO authenticated
  USING (public.is_member(auth.uid(), restaurant_id));
CREATE POLICY "manager write rooms" ON public.rooms FOR ALL TO authenticated
  USING (public.is_manager_or_owner(auth.uid(), restaurant_id))
  WITH CHECK (public.is_manager_or_owner(auth.uid(), restaurant_id));

-- ========== tables ==========
CREATE TABLE public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  seats INT NOT NULL DEFAULT 2,
  shape public.table_shape NOT NULL DEFAULT 'square',
  pos_x INT NOT NULL DEFAULT 0,
  pos_y INT NOT NULL DEFAULT 0,
  dwell_minutes INT NOT NULL DEFAULT 90,
  status public.table_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tables TO authenticated;
GRANT ALL ON public.tables TO service_role;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read tables" ON public.tables FOR SELECT TO authenticated
  USING (public.is_member(auth.uid(), restaurant_id));
CREATE POLICY "staff update table status" ON public.tables FOR UPDATE TO authenticated
  USING (public.is_member(auth.uid(), restaurant_id));
CREATE POLICY "manager write tables" ON public.tables FOR INSERT TO authenticated
  WITH CHECK (public.is_manager_or_owner(auth.uid(), restaurant_id));
CREATE POLICY "manager delete tables" ON public.tables FOR DELETE TO authenticated
  USING (public.is_manager_or_owner(auth.uid(), restaurant_id));

-- ========== customers ==========
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  allergies TEXT,
  is_vip BOOLEAN NOT NULL DEFAULT FALSE,
  visits_count INT NOT NULL DEFAULT 0,
  lifetime_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  last_visit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX customers_restaurant_idx ON public.customers (restaurant_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members rw customers" ON public.customers FOR ALL TO authenticated
  USING (public.is_member(auth.uid(), restaurant_id))
  WITH CHECK (public.is_member(auth.uid(), restaurant_id));

-- ========== reservations ==========
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  guest_phone TEXT,
  guest_email TEXT,
  party_size INT NOT NULL,
  reserved_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 90,
  status public.reservation_status NOT NULL DEFAULT 'pending',
  source public.reservation_source NOT NULL DEFAULT 'widget',
  deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX reservations_restaurant_time_idx ON public.reservations (restaurant_id, reserved_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members rw reservations" ON public.reservations FOR ALL TO authenticated
  USING (public.is_member(auth.uid(), restaurant_id))
  WITH CHECK (public.is_member(auth.uid(), restaurant_id));

-- Public booking insert (anonymous via widget) — allow anon to create reservation
GRANT INSERT ON public.reservations TO anon;
CREATE POLICY "public can submit reservation request" ON public.reservations FOR INSERT TO anon
  WITH CHECK (status = 'pending' AND source = 'widget' AND created_by IS NULL);

-- ========== waitlist ==========
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_phone TEXT,
  party_size INT NOT NULL,
  estimated_minutes INT NOT NULL DEFAULT 15,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waitlist TO authenticated;
GRANT ALL ON public.waitlist TO service_role;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members rw waitlist" ON public.waitlist FOR ALL TO authenticated
  USING (public.is_member(auth.uid(), restaurant_id))
  WITH CHECK (public.is_member(auth.uid(), restaurant_id));

-- ========== activity_log ==========
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  message TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX activity_log_restaurant_time_idx ON public.activity_log (restaurant_id, created_at DESC);
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read activity" ON public.activity_log FOR SELECT TO authenticated
  USING (public.is_member(auth.uid(), restaurant_id));
CREATE POLICY "members insert activity" ON public.activity_log FOR INSERT TO authenticated
  WITH CHECK (public.is_member(auth.uid(), restaurant_id) AND actor_id = auth.uid());

-- ========== profile auto-create trigger ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_restaurants_touch BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_reservations_touch BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
