
ALTER TABLE public.budget_employee_projections
  ADD CONSTRAINT budget_employee_projections_tenant_anchor_check
  CHECK (employee_id IS NOT NULL OR projected_unit_id IS NOT NULL) NOT VALID;

ALTER TABLE public.budget_employee_projections
  VALIDATE CONSTRAINT budget_employee_projections_tenant_anchor_check;
