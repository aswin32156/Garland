-- ============================================================
-- Fix Supabase Security Advisor Warnings
-- 1. Revoke public/authenticated execution from trigger functions
-- 2. Make get_user_role() SECURITY INVOKER so it doesn't elevate privileges
-- ============================================================

-- 1. Secure handle_new_user() trigger function
-- (Triggers are executed internally by Postgres; roles do not need direct EXECUTE rights)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- 2. Convert get_user_role() to SECURITY INVOKER
-- A user can already read their own profile via RLS (id = auth.uid()),
-- so elevating privileges with SECURITY DEFINER is unnecessary.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Revoke execution from unauthenticated visitors
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- 3. Ensure profiles policy allows users to read their own profile cleanly without recursion
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
CREATE POLICY "profiles_self_read" ON public.profiles
  FOR SELECT USING (id = auth.uid());
