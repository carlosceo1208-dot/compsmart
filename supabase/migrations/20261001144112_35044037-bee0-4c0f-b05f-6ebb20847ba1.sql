CREATE OR REPLACE FUNCTION public.nr1_segpsi_ciclos()
RETURNS TABLE(id uuid, ciclo_nome text, periodo_inicio date, status public.nr1_diagnostico_status)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.id, d.ciclo_nome, d.periodo_inicio, d.status
  FROM public.nr1_diagnosticos d
  WHERE d.company_id = public.get_user_company_id()
    AND (public.nr1_pode_gerir(d.company_id)
         OR (public.has_role(auth.uid(), 'manager') AND public.has_module('nr1')
             AND EXISTS (SELECT 1 FROM public.nr1_grupo_gestores g WHERE g.company_id = d.company_id AND g.gestor_id = auth.uid())))
  ORDER BY d.periodo_inicio DESC, d.created_at DESC
$$;
REVOKE ALL ON FUNCTION public.nr1_segpsi_ciclos() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nr1_segpsi_ciclos() TO authenticated, service_role;