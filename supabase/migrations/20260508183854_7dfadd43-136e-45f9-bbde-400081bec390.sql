
-- Restrict role_permissions writes to super_admin only (global permission model)
DROP POLICY IF EXISTS role_permissions_admin_or_super_admin_all ON public.role_permissions;

CREATE POLICY role_permissions_super_admin_all
ON public.role_permissions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Tighten engagement_metrics policies to authenticated only (remove public role applicability)
DROP POLICY IF EXISTS "Users can view metrics from their company" ON public.engagement_metrics;
DROP POLICY IF EXISTS "System can insert metrics" ON public.engagement_metrics;

CREATE POLICY "Users can view metrics from their company"
ON public.engagement_metrics
FOR SELECT
TO authenticated
USING ((root_company_id = get_user_company_id()) OR is_super_admin(auth.uid()));

CREATE POLICY "System can insert metrics"
ON public.engagement_metrics
FOR INSERT
TO authenticated
WITH CHECK ((root_company_id = get_user_company_id()) AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));
