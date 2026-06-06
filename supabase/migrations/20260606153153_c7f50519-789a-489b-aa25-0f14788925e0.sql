
-- =========================
-- MENU CATEGORIES
-- =========================
CREATE TABLE public.menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_categories TO authenticated;
GRANT ALL ON public.menu_categories TO service_role;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read menu categories" ON public.menu_categories
  FOR SELECT TO authenticated USING (is_member(auth.uid(), restaurant_id));
CREATE POLICY "managers manage menu categories" ON public.menu_categories
  FOR ALL TO authenticated
  USING (is_manager_or_owner(auth.uid(), restaurant_id))
  WITH CHECK (is_manager_or_owner(auth.uid(), restaurant_id));

CREATE TRIGGER trg_menu_categories_updated
  BEFORE UPDATE ON public.menu_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================
-- MENU ITEMS
-- =========================
CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  available boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_menu_items_restaurant ON public.menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category ON public.menu_items(category_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read menu items" ON public.menu_items
  FOR SELECT TO authenticated USING (is_member(auth.uid(), restaurant_id));
CREATE POLICY "managers manage menu items" ON public.menu_items
  FOR ALL TO authenticated
  USING (is_manager_or_owner(auth.uid(), restaurant_id))
  WITH CHECK (is_manager_or_owner(auth.uid(), restaurant_id));

CREATE TRIGGER trg_menu_items_updated
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================
-- STAFF OPERATORS (PIN-based)
-- =========================
CREATE TABLE public.staff_operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  pin_hash text NOT NULL,        -- sha256 hex of 4-digit PIN + per-row salt
  pin_salt text NOT NULL,
  role text NOT NULL DEFAULT 'waiter' CHECK (role IN ('waiter','runner','bartender','cashier')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_staff_operators_restaurant ON public.staff_operators(restaurant_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_operators TO authenticated;
GRANT ALL ON public.staff_operators TO service_role;
ALTER TABLE public.staff_operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read operators" ON public.staff_operators
  FOR SELECT TO authenticated USING (is_member(auth.uid(), restaurant_id));
CREATE POLICY "managers manage operators" ON public.staff_operators
  FOR ALL TO authenticated
  USING (is_manager_or_owner(auth.uid(), restaurant_id))
  WITH CHECK (is_manager_or_owner(auth.uid(), restaurant_id));

CREATE TRIGGER trg_staff_operators_updated
  BEFORE UPDATE ON public.staff_operators
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================
-- CHECKS (tabs / comandas)
-- =========================
CREATE TABLE public.checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id uuid REFERENCES public.tables(id) ON DELETE SET NULL,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  opened_by_user uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  opened_by_operator uuid REFERENCES public.staff_operators(id) ON DELETE SET NULL,
  guest_name text,
  party_size int CHECK (party_size IS NULL OR (party_size >= 1 AND party_size <= 50)),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','voided')),
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  service_charge numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text CHECK (payment_method IS NULL OR payment_method IN ('cash','card','pix','transfer','other','split')),
  notes text,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_checks_restaurant ON public.checks(restaurant_id);
CREATE INDEX idx_checks_table ON public.checks(table_id);
CREATE INDEX idx_checks_status ON public.checks(restaurant_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checks TO authenticated;
GRANT ALL ON public.checks TO service_role;
ALTER TABLE public.checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read checks" ON public.checks
  FOR SELECT TO authenticated USING (is_member(auth.uid(), restaurant_id));
CREATE POLICY "members insert checks" ON public.checks
  FOR INSERT TO authenticated WITH CHECK (is_member(auth.uid(), restaurant_id));
CREATE POLICY "members update checks" ON public.checks
  FOR UPDATE TO authenticated USING (is_member(auth.uid(), restaurant_id));
CREATE POLICY "managers delete checks" ON public.checks
  FOR DELETE TO authenticated USING (is_manager_or_owner(auth.uid(), restaurant_id));

CREATE TRIGGER trg_checks_updated
  BEFORE UPDATE ON public.checks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================
-- CHECK ITEMS
-- =========================
CREATE TABLE public.check_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_id uuid NOT NULL REFERENCES public.checks(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  qty int NOT NULL DEFAULT 1 CHECK (qty >= 1 AND qty <= 999),
  notes text,
  voided boolean NOT NULL DEFAULT false,
  added_by_user uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  added_by_operator uuid REFERENCES public.staff_operators(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_check_items_check ON public.check_items(check_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.check_items TO authenticated;
GRANT ALL ON public.check_items TO service_role;
ALTER TABLE public.check_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read check items" ON public.check_items
  FOR SELECT TO authenticated USING (is_member(auth.uid(), restaurant_id));
CREATE POLICY "members insert check items" ON public.check_items
  FOR INSERT TO authenticated WITH CHECK (is_member(auth.uid(), restaurant_id));
CREATE POLICY "members update check items" ON public.check_items
  FOR UPDATE TO authenticated USING (is_member(auth.uid(), restaurant_id));
CREATE POLICY "managers delete check items" ON public.check_items
  FOR DELETE TO authenticated USING (is_manager_or_owner(auth.uid(), restaurant_id));

-- =========================
-- CHECK PAYMENTS
-- =========================
CREATE TABLE public.check_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_id uuid NOT NULL REFERENCES public.checks(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  method text NOT NULL CHECK (method IN ('cash','card','pix','transfer','other')),
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  received_by_user uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  received_by_operator uuid REFERENCES public.staff_operators(id) ON DELETE SET NULL,
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_check_payments_check ON public.check_payments(check_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.check_payments TO authenticated;
GRANT ALL ON public.check_payments TO service_role;
ALTER TABLE public.check_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read payments" ON public.check_payments
  FOR SELECT TO authenticated USING (is_member(auth.uid(), restaurant_id));
CREATE POLICY "members insert payments" ON public.check_payments
  FOR INSERT TO authenticated WITH CHECK (is_member(auth.uid(), restaurant_id));
CREATE POLICY "managers delete payments" ON public.check_payments
  FOR DELETE TO authenticated USING (is_manager_or_owner(auth.uid(), restaurant_id));

-- =========================
-- RECALC TOTALS on check_items / check_payments changes
-- =========================
CREATE OR REPLACE FUNCTION public.recalc_check_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _check_id uuid;
  _subtotal numeric(10,2);
BEGIN
  _check_id := COALESCE(NEW.check_id, OLD.check_id);
  SELECT COALESCE(SUM(unit_price * qty), 0) INTO _subtotal
    FROM public.check_items
    WHERE check_id = _check_id AND voided = false;
  UPDATE public.checks
    SET subtotal = _subtotal,
        total = GREATEST(0, _subtotal + service_charge - discount),
        updated_at = now()
    WHERE id = _check_id;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_check_items_recalc
  AFTER INSERT OR UPDATE OR DELETE ON public.check_items
  FOR EACH ROW EXECUTE FUNCTION public.recalc_check_totals();
