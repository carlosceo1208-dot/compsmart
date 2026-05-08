
-- Add optional company scoping (NULL = global library)
ALTER TABLE public.competencies
  ADD COLUMN IF NOT EXISTS root_company_id uuid REFERENCES public.organizational_structure(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_competencies_root_company ON public.competencies(root_company_id);

-- Drop the unique constraint on name (must be unique per company, not globally)
ALTER TABLE public.competencies DROP CONSTRAINT IF EXISTS competencies_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS competencies_name_company_unique
  ON public.competencies (name, COALESCE(root_company_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Replace policies
DROP POLICY IF EXISTS "Authenticated users can view competencies" ON public.competencies;
DROP POLICY IF EXISTS "Admins and HR managers can manage competencies" ON public.competencies;

CREATE POLICY "View global or own-company competencies"
ON public.competencies
FOR SELECT
TO authenticated
USING (
  root_company_id IS NULL
  OR root_company_id = public.get_user_company_id()
);

CREATE POLICY "Admin/HR manage own-company competencies"
ON public.competencies
FOR ALL
TO authenticated
USING (
  root_company_id = public.get_user_company_id()
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
)
WITH CHECK (
  root_company_id = public.get_user_company_id()
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
);

-- Super admins can manage global competencies
CREATE POLICY "Super admins manage global competencies"
ON public.competencies
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin'::app_role)
);
