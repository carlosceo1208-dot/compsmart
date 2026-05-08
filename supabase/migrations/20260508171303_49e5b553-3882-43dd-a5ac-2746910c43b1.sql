DROP POLICY IF EXISTS "View projections policy" ON public.budget_employee_projections;

CREATE POLICY "View projections policy"
ON public.budget_employee_projections
FOR SELECT
TO authenticated
USING (
  (
    public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
    AND (
      (
        employee_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = budget_employee_projections.employee_id
            AND p.root_company_id = public.get_user_company_id()
        )
      )
      OR (
        projected_unit_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.organizational_structure o
          WHERE o.id = budget_employee_projections.projected_unit_id
            AND o.root_company_id = public.get_user_company_id()
        )
      )
    )
  )
  OR (
    public.has_role(auth.uid(), 'manager'::app_role)
    AND EXISTS (
      SELECT 1
      FROM public.profiles me
      WHERE me.id = auth.uid()
        AND me.root_company_id = public.get_user_company_id()
        AND (
          budget_employee_projections.projected_unit_id = me.unit_id
          OR EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = budget_employee_projections.employee_id
              AND p.unit_id = me.unit_id
              AND p.root_company_id = public.get_user_company_id()
          )
        )
    )
  )
);

DROP POLICY IF EXISTS "Approvers see their own assignments" ON public.approval_assignments;

CREATE POLICY "Approvers see their own assignments"
ON public.approval_assignments
FOR SELECT
TO authenticated
USING (
  approver_id = auth.uid()
  OR escalated_to = auth.uid()
  OR (
    public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
    AND root_company_id = public.get_user_company_id()
  )
);

DROP POLICY IF EXISTS "Admin and Super Admin view auth logs" ON public.auth_attempt_logs;
DROP POLICY IF EXISTS "Only admins can view auth logs" ON public.auth_attempt_logs;