
-- Link reservations to authenticated customer accounts
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);

-- Customers table: read own bookings
CREATE POLICY "customers read own reservations"
  ON public.reservations FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Customers may cancel own reservations (update status only via app; we allow updates on their own rows)
CREATE POLICY "customers update own reservations"
  ON public.reservations FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to insert reservations for themselves via widget
CREATE POLICY "auth users can submit reservation"
  ON public.reservations FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'::reservation_status
    AND source = 'widget'::reservation_source
    AND created_by IS NULL
    AND party_size > 0 AND party_size <= 50
    AND EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = reservations.restaurant_id AND r.is_published = true)
  );

-- Role resolver: 'admin' | 'staff' | 'customer'
CREATE OR REPLACE FUNCTION public.get_user_role(_uid uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _uid IS NULL THEN NULL
    WHEN EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = _uid) THEN 'admin'
    WHEN EXISTS (SELECT 1 FROM public.restaurant_members WHERE user_id = _uid) THEN 'staff'
    ELSE 'customer'
  END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, anon;
