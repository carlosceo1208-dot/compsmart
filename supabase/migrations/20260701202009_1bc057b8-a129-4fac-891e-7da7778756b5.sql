
-- Revoke EXECUTE from anon/authenticated on all SECURITY DEFINER functions in public,
-- then re-grant EXECUTE only to the functions genuinely called from client / public pages.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND (has_function_privilege('authenticated', p.oid, 'EXECUTE')
        OR has_function_privilege('anon', p.oid, 'EXECUTE')
        OR has_function_privilege('public', p.oid, 'EXECUTE'))
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END $$;

-- Re-grant EXECUTE to authenticated for client-invoked RPCs
GRANT EXECUTE ON FUNCTION public.apply_merit_to_budget(uuid,integer,numeric,text,uuid,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.build_scenario_from_9box(uuid,integer,text,text,numeric,integer,integer,uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_smart_merit(integer,numeric,integer,numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_transportation_benefit(uuid,numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_budget_capacity(uuid,integer,numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_budget_ceiling(uuid,integer,numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_employee_eligibility(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compare_scenarios(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_agent_audit_logs(timestamp,timestamp,text,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.evaluate_merit_governance(uuid,numeric,numeric,numeric,integer,numeric,numeric,numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agent_audit_logs(timestamp,timestamp,uuid,text,uuid,text,integer,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agent_usage_kpis(timestamp,timestamp,uuid,text,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_companies_billing_info(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_billing_info(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_compensation_mismatch_kpi() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_equity_alerts(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_manager_direct_reports() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_market_alerts(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_market_benchmark_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_market_competitiveness() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_merit_suggestion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_approval_inbox() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_org_breadcrumb(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_org_breadcrumb_friendly(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pay_gap_by_gender() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pay_gap_by_grade() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_salary_gini_index() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_compensation_mismatches(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unit_budget_status(uuid,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_root_company_id_strict() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_visible_employees(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid,app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.company_has_plan_tier(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_plan(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nr1_plano_transicao(uuid,nr1_aprovacao_status,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nr1_recompute_scores(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nr1_template_marcar_uso(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.simulate_9box_budget(uuid,integer,numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.simulate_budget_scenarios(uuid,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon_code(text,uuid,text) TO authenticated;

-- Public survey / feedback flows (anon)
GRANT EXECUTE ON FUNCTION public.get_clima_externo_publico(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_clima_pesquisa_publica(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_feedback_request_by_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_clima_externo_resposta(text,text,text,text,jsonb,numeric,integer,text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_clima_resposta_anonima(uuid,text,text,text,text,text,text,numeric,jsonb,jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_external_feedback(uuid,jsonb,numeric,text,text,text) TO anon, authenticated;
