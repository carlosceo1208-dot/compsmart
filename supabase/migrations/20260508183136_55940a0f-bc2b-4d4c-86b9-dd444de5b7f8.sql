
DROP POLICY IF EXISTS "Authenticated users can view job competencies" ON public.job_title_competencies;
DROP POLICY IF EXISTS "Admins and HR managers can manage job competencies" ON public.job_title_competencies;

CREATE POLICY "View job competencies in own company"
ON public.job_title_competencies
FOR SELECT
TO authenticated
USING (
  job_title_id IN (
    SELECT id FROM public.job_titles
    WHERE root_company_id = public.get_user_company_id()
  )
);

CREATE POLICY "Admins and HR manage job competencies in own company"
ON public.job_title_competencies
FOR ALL
TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['admin','hr_manager']::app_role[])
  AND job_title_id IN (
    SELECT id FROM public.job_titles
    WHERE root_company_id = public.get_user_company_id()
  )
)
WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['admin','hr_manager']::app_role[])
  AND job_title_id IN (
    SELECT id FROM public.job_titles
    WHERE root_company_id = public.get_user_company_id()
  )
);
