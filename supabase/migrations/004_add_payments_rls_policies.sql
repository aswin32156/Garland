-- ============================================================
-- Fix Supabase Security Advisor Suggestion: RLS Enabled No Policy on public.payments
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/lhtvbvlkddekfkgnhnla/sql/new
-- ============================================================

DROP POLICY IF EXISTS "payments_customer_read" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_manage" ON public.payments;

-- Customers can view payments for their own orders; Admins and Owners can view all
CREATE POLICY "payments_customer_read" ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = public.payments.order_id
        AND (o.customer_id = (SELECT auth.uid()) OR get_user_role() IN ('OWNER', 'ADMIN'))
    )
  );

-- Admins and Owners can manage payment records
CREATE POLICY "payments_admin_manage" ON public.payments
  FOR ALL
  USING (get_user_role() IN ('ADMIN', 'OWNER'))
  WITH CHECK (get_user_role() IN ('ADMIN', 'OWNER'));
