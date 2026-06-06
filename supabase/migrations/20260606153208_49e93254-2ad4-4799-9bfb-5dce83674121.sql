
REVOKE EXECUTE ON FUNCTION public.recalc_check_totals() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalc_check_totals() FROM anon;
GRANT EXECUTE ON FUNCTION public.recalc_check_totals() TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalc_check_totals() TO service_role;
