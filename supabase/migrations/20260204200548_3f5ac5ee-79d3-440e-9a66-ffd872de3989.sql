-- =====================================================
-- Fix: Restrict salary_ranges access to Admin/HR/Manager only
-- Issue: salary_ranges_unrestricted_view (warn level)
-- =====================================================

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users view own company salary ranges" ON public.salary_ranges;

-- Create a more restrictive policy - only Admin, HR, and Managers can view salary ranges
-- Regular employees should not see the company's salary structure
CREATE POLICY "Admin, HR, and Managers can view salary ranges"
ON public.salary_ranges
FOR SELECT
TO authenticated
USING (
  -- Must have Admin, HR Manager, or Manager role
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'manager'::app_role])
  AND (
    -- View own company's salary ranges
    salary_table_id IN (
      SELECT id FROM salary_tables WHERE root_company_id = get_user_company_id()
    )
    OR
    -- Or view template/global salary ranges (if any exist)
    salary_table_id IN (
      SELECT id FROM salary_tables WHERE root_company_id IS NULL
    )
  )
);