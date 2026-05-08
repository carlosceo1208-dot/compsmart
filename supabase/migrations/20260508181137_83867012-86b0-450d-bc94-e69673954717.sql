
-- 1. Harden manage_user_roles to prevent privilege escalation to super_admin
CREATE OR REPLACE FUNCTION public.manage_user_roles(p_user_id uuid, p_roles app_role[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Bootstrap: if no admin exists, allow first caller to manage roles
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    NULL; -- allow without further checks
  ELSIF NOT has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  -- Block super_admin assignment unless caller is already super_admin
  IF 'super_admin'::app_role = ANY(p_roles) AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'permission denied: cannot assign super_admin role';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  INSERT INTO public.user_roles (user_id, role)
  SELECT p_user_id, r
  FROM unnest(p_roles) AS r
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- 2. Tighten performance_variable_link SELECT
DROP POLICY IF EXISTS "View variable links" ON public.performance_variable_link;
CREATE POLICY "View variable links"
ON public.performance_variable_link
FOR SELECT
TO authenticated
USING (
  evaluation_id IN (
    SELECT pe.id FROM public.performance_evaluations pe
    WHERE pe.employee_id = auth.uid()
       OR (
         pe.root_company_id = get_user_company_id()
         AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'manager'::app_role])
       )
  )
);

-- 3. Tighten succession_decisions SELECT
DROP POLICY IF EXISTS "Users can view succession decisions in their company" ON public.succession_decisions;
CREATE POLICY "View succession decisions (HR/admin/manager only)"
ON public.succession_decisions
FOR SELECT
TO authenticated
USING (
  root_company_id = get_user_company_id()
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'manager'::app_role])
);

-- 4. Tighten evaluation_potential_dimensions SELECT
DROP POLICY IF EXISTS "Users can view potential dimensions of their company" ON public.evaluation_potential_dimensions;
CREATE POLICY "View potential dimensions (own or HR/admin/manager)"
ON public.evaluation_potential_dimensions
FOR SELECT
TO authenticated
USING (
  root_company_id = get_user_company_id()
  AND (
    has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'manager'::app_role])
    OR evaluation_id IN (
      SELECT pe.id FROM public.performance_evaluations pe WHERE pe.employee_id = auth.uid()
    )
  )
);
