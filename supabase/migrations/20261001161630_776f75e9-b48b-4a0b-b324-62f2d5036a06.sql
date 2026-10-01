CREATE OR REPLACE FUNCTION public.nr1_segpsi_questoes_listar()
RETURNS TABLE(id uuid, codigo text, dimensao text, enunciado text, ordem int, reverso boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF NOT (public.has_module('nr1') OR public.has_role(auth.uid(), 'super_admin'::public.app_role)) THEN
    v_company := public.get_user_company_id();
    IF v_company IS NOT NULL THEN
      INSERT INTO public.nr1_access_log (company_id, actor_user_id, actor_role, action, resource, blocked, reason)
      VALUES (v_company, auth.uid(), 'authenticated', 'listar', 'nr1_segpsi_questoes', true, 'sem_modulo_nr1');
    END IF;
    RAISE EXCEPTION 'Acesso negado: módulo NR-1 não contratado';
  END IF;
  RETURN QUERY SELECT q.id, q.codigo::text, q.dimensao::text, q.enunciado::text, q.ordem::int, q.reverso
    FROM public.nr1_segpsi_questoes q WHERE q.ativo ORDER BY q.ordem;
END $$;