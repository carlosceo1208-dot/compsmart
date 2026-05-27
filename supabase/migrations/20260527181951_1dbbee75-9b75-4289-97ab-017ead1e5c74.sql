DROP POLICY IF EXISTS "Authenticated users can view economic indicators" ON public.executive_dashboard_indicators;

CREATE POLICY "Privileged roles can view economic indicators"
ON public.executive_dashboard_indicators
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'hr_manager'::app_role)
);