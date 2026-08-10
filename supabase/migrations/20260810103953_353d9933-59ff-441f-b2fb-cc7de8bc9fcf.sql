-- 1) Reservation insert hardening (public widget bookings)
DROP POLICY IF EXISTS "public can submit reservation request" ON public.reservations;
CREATE POLICY "public can submit reservation request"
ON public.reservations FOR INSERT TO anon
WITH CHECK (
  status = 'pending'::reservation_status
  AND source = 'widget'::reservation_source
  AND created_by IS NULL
  AND user_id IS NULL
  AND customer_id IS NULL
  AND table_id IS NULL
  AND deposit_amount = 0
  AND party_size > 0 AND party_size <= 50
  AND EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.is_published = true)
);

DROP POLICY IF EXISTS "auth users can submit reservation" ON public.reservations;
CREATE POLICY "auth users can submit reservation"
ON public.reservations FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND status = 'pending'::reservation_status
  AND source = 'widget'::reservation_source
  AND created_by IS NULL
  AND customer_id IS NULL
  AND table_id IS NULL
  AND deposit_amount = 0
  AND party_size > 0 AND party_size <= 50
  AND EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.is_published = true)
);

-- 2) Customers may only cancel their own reservations
DROP POLICY IF EXISTS "customers update own reservations" ON public.reservations;
CREATE POLICY "customers cancel own reservations"
ON public.reservations FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND status = 'cancelled'::reservation_status);

-- 3) Lock down SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.customer_reliability_score(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.expire_stale_waitlist_offers(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.promote_next_waitlist(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.seed_message_templates(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.verify_operator_pin(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_manager_or_owner(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_platform_admin(uuid) FROM PUBLIC, anon;

-- trigger-only functions: nobody should call them directly
REVOKE ALL ON FUNCTION public.enforce_tables_column_perms() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_reservation_messages() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_waitlist_offer() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_seed_message_templates() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recalc_check_totals() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.customer_reliability_score(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.expire_stale_waitlist_offers(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.promote_next_waitlist(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_operator_pin(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_manager_or_owner(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.seed_message_templates(uuid) TO service_role;