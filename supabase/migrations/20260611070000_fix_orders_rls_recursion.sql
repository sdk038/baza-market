-- Break infinite recursion between orders <-> order_items RLS policies.
-- Each policy referenced the other table, causing Postgres error 42P17 on
-- insert/select even when auth.uid() = buyer_id.

CREATE OR REPLACE FUNCTION public.is_order_buyer(_order_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = _order_id AND o.buyer_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_order_supplier(_order_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = _order_id AND p.supplier_id = _user_id
  );
$$;

DROP POLICY IF EXISTS "orders_select" ON public.orders;
CREATE POLICY "orders_select" ON public.orders
  FOR SELECT TO authenticated
  USING (
    auth.uid() = buyer_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_order_supplier(orders.id, auth.uid())
  );

DROP POLICY IF EXISTS "orders_status_update" ON public.orders;
CREATE POLICY "orders_status_update" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_order_supplier(orders.id, auth.uid())
  );

DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    public.is_order_buyer(order_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.supplier_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_insert" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (public.is_order_buyer(order_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.place_order(
  p_customer_name text,
  p_phone text,
  p_address text,
  p_payment_method text,
  p_total numeric,
  p_delivery_days integer,
  p_estimated_delivery date,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  INSERT INTO public.orders (
    buyer_id,
    customer_name,
    phone,
    address,
    payment_method,
    total,
    delivery_days,
    estimated_delivery
  ) VALUES (
    auth.uid(),
    p_customer_name,
    p_phone,
    p_address,
    p_payment_method,
    p_total,
    p_delivery_days,
    p_estimated_delivery
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (order_id, product_id, product_title, price, qty)
    VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      v_item->>'product_title',
      (v_item->>'price')::numeric,
      (v_item->>'qty')::integer
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_order_buyer(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_order_supplier(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_order(text, text, text, text, numeric, integer, date, jsonb) TO authenticated;
