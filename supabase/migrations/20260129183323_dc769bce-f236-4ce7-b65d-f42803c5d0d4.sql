-- ============================================================
-- SECURITY FIX: Require authentication for profiles access
-- and enforce security_invoker on compensation directory view
-- ============================================================

-- ===========================================
-- 1. FIX profiles table RLS policies
-- Require authentication (auth.uid() IS NOT NULL)
-- ===========================================

-- Drop existing permissive SELECT policies that allow anonymous access
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin/HR view all company profiles" ON public.profiles;

-- Recreate with explicit authentication requirement
CREATE POLICY "Users view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admin/HR view all company profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (root_company_id = get_user_company_id() OR root_company_id IS NULL)
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
);

-- ===========================================
-- 2. FIX profiles_compensation_directory VIEW
-- Add security_invoker to respect underlying table RLS
-- ===========================================

-- Drop and recreate view with security_invoker
DROP VIEW IF EXISTS public.profiles_compensation_directory;

CREATE VIEW public.profiles_compensation_directory
WITH (security_invoker = true)
AS
SELECT 
    id AS user_id,
    root_company_id,
    COALESCE(NULLIF(full_name, ''::text), 'Usuário'::text) AS full_name,
    status,
    unit_id,
    job_title,
    job_title_id,
    grade,
    avatar_url,
    salary,
    variable_salary,
    salary_range_percentage,
    benefits_value,
    short_term_incentive,
    long_term_incentive,
    updated_at
FROM public.profiles;

-- Grant access to authenticated users (RLS on profiles will filter)
GRANT SELECT ON public.profiles_compensation_directory TO authenticated;

-- ===========================================
-- 3. FIX profiles_directory table RLS
-- Require authentication for SELECT
-- ===========================================

DROP POLICY IF EXISTS "Users view own company profiles directory" ON public.profiles_directory;

CREATE POLICY "Users view own company profiles directory"
ON public.profiles_directory
FOR SELECT
TO authenticated
USING (root_company_id = get_user_company_id());

-- Ensure blocking policies also target authenticated only
DROP POLICY IF EXISTS "No direct insert to profiles_directory" ON public.profiles_directory;
DROP POLICY IF EXISTS "No direct update to profiles_directory" ON public.profiles_directory;
DROP POLICY IF EXISTS "No direct delete to profiles_directory" ON public.profiles_directory;

CREATE POLICY "No direct insert to profiles_directory"
ON public.profiles_directory
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "No direct update to profiles_directory"
ON public.profiles_directory
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "No direct delete to profiles_directory"
ON public.profiles_directory
FOR DELETE
TO authenticated
USING (false);