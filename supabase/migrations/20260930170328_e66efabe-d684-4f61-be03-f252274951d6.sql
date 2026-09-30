CREATE OR REPLACE FUNCTION public.has_module(_slug text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT _slug = 'core'
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.tenant_subscriptions ts
      JOIN public.modules m ON m.id = ts.module_id
      WHERE ts.tenant_id = public.get_user_company_id()
        AND m.slug = _slug
        AND ts.status IN ('active','trial')
        AND (ts.expires_at IS NULL OR ts.expires_at > now()));
$$;

ALTER POLICY clima_pesq_select ON public.clima_pesquisas USING ((company_id = get_user_company_id()) AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role]) AND has_module('clima'));
ALTER POLICY clima_resp_select ON public.clima_respostas USING ((company_id = get_user_company_id()) AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role]) AND has_module('clima'));
ALTER POLICY clima_resp_itens_select ON public.clima_respostas_itens USING (EXISTS (SELECT 1 FROM clima_respostas r WHERE r.id = clima_respostas_itens.resposta_id AND r.company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role])) AND has_module('clima'));
ALTER POLICY clima_externo_select ON public.clima_externo_respostas USING ((company_id = get_user_company_id()) AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role]) AND has_module('clima'));

CREATE OR REPLACE VIEW public.v_talent_intelligence_dashboard WITH (security_invoker=true) AS
 SELECT p.id AS employee_id, p.full_name, p.job_title, p.grade, p.salary AS current_salary, p.unit_id, p.root_company_id,
    pe.id AS evaluation_id, pe.cycle_id, pe.final_score AS performance_score, pe.potential_score,
    calculate_9box_position(pe.final_score, pe.potential_score) AS box_position,
    calculate_merit_by_9box(calculate_9box_position(pe.final_score, pe.potential_score)) AS suggested_merit_pct,
    tir.id AS recommendation_id, tir.status AS recommendation_status, tir.recommended_merit_pct, tir.recommended_new_salary, tir.financial_impact_annual
   FROM profiles p
     LEFT JOIN performance_evaluations pe ON pe.employee_id = p.id
     LEFT JOIN talent_intelligence_recommendations tir ON tir.employee_id = p.id AND tir.cycle_id = pe.cycle_id
  WHERE p.status = 'active'::user_status AND p.employee_number IS NOT NULL AND public.has_module('potencial-sucessao');