-- Drop old permissive policies that allow data leakage
DROP POLICY IF EXISTS "Users can view all job titles" ON public.job_titles;
DROP POLICY IF EXISTS "Admins and HR managers can manage job titles" ON public.job_titles;
DROP POLICY IF EXISTS "Users view own company job titles" ON public.job_titles;
DROP POLICY IF EXISTS "Admins and HR manage own company job titles" ON public.job_titles;

-- Create correct RLS policies with proper tenant isolation
CREATE POLICY "Users view own company job titles" 
ON public.job_titles 
FOR SELECT 
USING (root_company_id = get_user_company_id());

CREATE POLICY "Admins and HR manage own company job titles" 
ON public.job_titles 
FOR ALL 
USING (
  root_company_id = get_user_company_id() 
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
)
WITH CHECK (
  root_company_id = get_user_company_id() 
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
);