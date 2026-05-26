
DROP POLICY IF EXISTS nr1_access_log_select_admins ON public.nr1_access_log;
CREATE POLICY nr1_access_log_select_admins ON public.nr1_access_log
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    company_id = get_user_company_id()
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'hr_manager'::app_role)
      OR has_role(auth.uid(), 'occupational_health'::app_role)
    )
  )
);

CREATE POLICY clima_externo_respostas_insert_public ON public.clima_externo_respostas
FOR INSERT TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clima_pesquisas p
    WHERE p.id = pesquisa_id
      AND p.company_id = clima_externo_respostas.company_id
      AND p.status = 'aberta'
  )
);
