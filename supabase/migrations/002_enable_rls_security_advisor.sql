-- ============================================================
-- Fix Supabase Security Advisor: Enable Row Level Security (RLS)
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/lhtvbvlkddekfkgnhnla/sql/new
-- ============================================================

-- 1. Secure get_user_role() function search path (Fixes mutable search_path warning)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
  DECLARE role_val user_role;
  BEGIN
    SELECT role INTO role_val FROM profiles WHERE id = auth.uid();
    RETURN role_val;
  END;
$$;

-- 2. Enable RLS on all 5 flagged public tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occasions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_slot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- ── CATEGORIES POLICIES ──────────────────────────────────────
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;

-- Anyone can browse active categories
CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT USING (TRUE);

-- Only Admins and Owners can insert, update, or delete categories
CREATE POLICY "categories_admin_all" ON public.categories
  FOR ALL
  USING (get_user_role() IN ('ADMIN', 'OWNER'))
  WITH CHECK (get_user_role() IN ('ADMIN', 'OWNER'));

-- ── OCCASIONS POLICIES ───────────────────────────────────────
DROP POLICY IF EXISTS "occasions_public_read" ON public.occasions;
DROP POLICY IF EXISTS "occasions_admin_all" ON public.occasions;

-- Anyone can browse occasions
CREATE POLICY "occasions_public_read" ON public.occasions
  FOR SELECT USING (TRUE);

-- Only Admins and Owners can insert, update, or delete occasions
CREATE POLICY "occasions_admin_all" ON public.occasions
  FOR ALL
  USING (get_user_role() IN ('ADMIN', 'OWNER'))
  WITH CHECK (get_user_role() IN ('ADMIN', 'OWNER'));

-- ── PICKUP SLOT CONFIGS POLICIES ─────────────────────────────
DROP POLICY IF EXISTS "pickup_slot_configs_public_read" ON public.pickup_slot_configs;
DROP POLICY IF EXISTS "pickup_slot_configs_admin_all" ON public.pickup_slot_configs;

-- Anyone can view slot configurations to see operating hours
CREATE POLICY "pickup_slot_configs_public_read" ON public.pickup_slot_configs
  FOR SELECT USING (TRUE);

-- Only Admins and Owners can configure slot schedules
CREATE POLICY "pickup_slot_configs_admin_all" ON public.pickup_slot_configs
  FOR ALL
  USING (get_user_role() IN ('ADMIN', 'OWNER'))
  WITH CHECK (get_user_role() IN ('ADMIN', 'OWNER'));

-- ── WISHLISTS POLICIES ───────────────────────────────────────
DROP POLICY IF EXISTS "wishlists_customer_manage" ON public.wishlists;

-- Customers can view and manage their own wishlists; Admins/Owners can view all
CREATE POLICY "wishlists_customer_manage" ON public.wishlists
  FOR ALL
  USING (customer_id = (SELECT auth.uid()) OR get_user_role() IN ('ADMIN', 'OWNER'))
  WITH CHECK (customer_id = (SELECT auth.uid()) OR get_user_role() IN ('ADMIN', 'OWNER'));

-- ── LOYALTY TRANSACTIONS POLICIES ────────────────────────────
DROP POLICY IF EXISTS "loyalty_transactions_customer_read" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "loyalty_transactions_admin_all" ON public.loyalty_transactions;

-- Customers can view their own loyalty history
CREATE POLICY "loyalty_transactions_customer_read" ON public.loyalty_transactions
  FOR SELECT
  USING (customer_id = (SELECT auth.uid()) OR get_user_role() IN ('ADMIN', 'OWNER'));

-- Admins and Owners can view and manage all loyalty transactions
CREATE POLICY "loyalty_transactions_admin_all" ON public.loyalty_transactions
  FOR ALL
  USING (get_user_role() IN ('ADMIN', 'OWNER'))
  WITH CHECK (get_user_role() IN ('ADMIN', 'OWNER'));
