-- Fix 1: Prevent admin privilege escalation to super_admin
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Only admins can manage user roles" ON public.user_roles;

-- Recreate with WITH CHECK that blocks super_admin insertion
CREATE POLICY "Only admins can manage user roles"
  ON public.user_roles
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    AND role <> 'super_admin'::app_role
  );

-- Fix 2: Recreate profiles_compensation_directory view with security_invoker
DROP VIEW IF EXISTS public.profiles_compensation_directory;
CREATE VIEW public.profiles_compensation_directory
  WITH (security_invoker = true)
AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.email,
  p.job_title_id,
  jt.title AS job_title,
  p.grade,
  p.unit_id,
  os.name AS unit_name,
  p.root_company_id,
  p.salary,
  p.variable_salary,
  p.benefits_value AS total_benefits_value,
  (COALESCE(p.short_term_incentive, 0::numeric) + COALESCE(p.long_term_incentive, 0::numeric)) AS total_incentives_value,
  p.hire_date,
  p.avatar_url,
  (p.status = 'active'::user_status) AS is_active
FROM profiles p
LEFT JOIN job_titles jt ON p.job_title_id = jt.id
LEFT JOIN organizational_structure os ON p.unit_id = os.id
WHERE p.status = 'active'::user_status;

-- Fix 3: Replace admin SELECT policies on AI conversation tables with company-scoped versions

-- salary_assistant_conversations
DROP POLICY IF EXISTS "Admins view all salary assistant conversations" ON public.salary_assistant_conversations;
CREATE POLICY "Admins view company salary conversations"
  ON public.salary_assistant_conversations FOR SELECT
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND user_id IN (
      SELECT id FROM profiles
      WHERE root_company_id = get_user_company_id()
    )
  );

-- incentive_assistant_conversations
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.incentive_assistant_conversations;
CREATE POLICY "Admins view company incentive conversations"
  ON public.incentive_assistant_conversations FOR SELECT
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND user_id IN (
      SELECT id FROM profiles
      WHERE root_company_id = get_user_company_id()
    )
  );

-- legal_assistant_conversations
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.legal_assistant_conversations;
CREATE POLICY "Admins view company legal conversations"
  ON public.legal_assistant_conversations FOR SELECT
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND user_id IN (
      SELECT id FROM profiles
      WHERE root_company_id = get_user_company_id()
    )
  );

-- performai_conversations
DROP POLICY IF EXISTS "Admins view all PerformAI conversations" ON public.performai_conversations;
CREATE POLICY "Admins view company PerformAI conversations"
  ON public.performai_conversations FOR SELECT
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND user_id IN (
      SELECT id FROM profiles
      WHERE root_company_id = get_user_company_id()
    )
  );