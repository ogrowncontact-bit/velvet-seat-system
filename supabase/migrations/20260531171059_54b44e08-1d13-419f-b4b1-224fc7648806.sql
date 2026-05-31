
-- 1) Platform admins table
CREATE TABLE public.platform_admins (
  user_id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.platform_admins TO authenticated;
GRANT ALL ON public.platform_admins TO service_role;

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Only platform admins can see the list (avoid leaking who is admin)
CREATE POLICY "platform admins read self list"
ON public.platform_admins FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));

-- 2) Helper function
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = _user_id);
$$;

-- 3) Update existing policies on every restaurant-scoped table to also allow platform admins

-- restaurants
CREATE POLICY "platform admin full restaurants"
ON public.restaurants FOR ALL
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

-- restaurant_members
CREATE POLICY "platform admin full members"
ON public.restaurant_members FOR ALL
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

-- rooms
CREATE POLICY "platform admin full rooms"
ON public.rooms FOR ALL
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

-- tables
CREATE POLICY "platform admin full tables"
ON public.tables FOR ALL
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

-- customers
CREATE POLICY "platform admin full customers"
ON public.customers FOR ALL
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

-- reservations
CREATE POLICY "platform admin full reservations"
ON public.reservations FOR ALL
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

-- waitlist
CREATE POLICY "platform admin full waitlist"
ON public.waitlist FOR ALL
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

-- activity_log
CREATE POLICY "platform admin full activity"
ON public.activity_log FOR ALL
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

-- profiles — admins can read all profiles to manage users
CREATE POLICY "platform admin read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_platform_admin(auth.uid()));

-- 4) Grant your account platform admin
INSERT INTO public.platform_admins (user_id)
SELECT id FROM auth.users WHERE email = 'euclides.pereirasilvaneto@gmail.com'
ON CONFLICT DO NOTHING;
