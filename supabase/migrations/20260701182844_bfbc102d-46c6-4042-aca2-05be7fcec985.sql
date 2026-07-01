
-- 1) profiles: remove root_company_id IS NULL loophole in admin/HR SELECT
DROP POLICY IF EXISTS "Admin/HR view all company profiles" ON public.profiles;
CREATE POLICY "Admin/HR view all company profiles"
ON public.profiles FOR SELECT
USING (
  root_company_id IS NOT NULL
  AND root_company_id = public.get_user_company_id()
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
);

-- 2) executive_dashboard_indicators: restrict SELECT to super_admin only (no company scoping column exists)
DROP POLICY IF EXISTS "Privileged roles can view economic indicators" ON public.executive_dashboard_indicators;
CREATE POLICY "Super admins can view indicators"
ON public.executive_dashboard_indicators FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 3) NR-1 company admin/HR read access for compliance oversight, scoped to same company
CREATE POLICY "Company admins view company jornadas"
ON public.nr1_jornadas FOR SELECT
USING (
  company_id = public.get_user_company_id()
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
);

CREATE POLICY "Company admins view company checkins"
ON public.nr1_checkins_semanais FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.nr1_jornadas j
    WHERE j.id = nr1_checkins_semanais.jornada_id
      AND j.company_id = public.get_user_company_id()
      AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
  )
);

CREATE POLICY "Company admins view company jornada msgs"
ON public.nr1_jornada_mensagens FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.nr1_jornadas j
    WHERE j.id = nr1_jornada_mensagens.jornada_id
      AND j.company_id = public.get_user_company_id()
      AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
  )
);

-- 4) Revoke anon EXECUTE on SECURITY DEFINER functions not intended for public use
DO $$
DECLARE
  r record;
  keep text[] := ARRAY[
    'get_clima_externo_publico',
    'get_clima_pesquisa_publica',
    'submit_clima_externo_resposta',
    'submit_external_feedback',
    'get_feedback_request_by_token',
    'company_has_plan_tier',
    'validate_coupon_code'
  ];
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    IF NOT (r.proname = ANY(keep)) THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM anon', r.proname, r.args);
    END IF;
  END LOOP;
END $$;

-- 5) Revoke authenticated EXECUTE on trigger/internal SECURITY DEFINER functions
--    (these should never be called directly via the Data API)
DO $$
DECLARE
  r record;
  internal_only text[] := ARRAY[
    'audit_budget_submissions','audit_logs_set_root_company_id','audit_rls_tenant_isolation',
    'audit_sensitive_data_access','auto_debit_merit_approval_budget','auto_debit_talent_budget',
    'create_default_alert_configs','create_merit_approval_assignment','create_talent_approval_assignment',
    'delete_email','detect_after_hours_usage','detect_inactive_users','detect_query_spikes',
    'detect_recurring_errors','detect_token_overconsumption','detect_user_concentration',
    'email_queue_dispatch','email_queue_wake','enqueue_email','ensure_single_active_survey',
    'ensure_single_active_table','escalate_overdue_approvals','handle_new_user',
    'handle_termination_date','log_merit_approval_change','log_talent_recommendation_change',
    'manage_user_roles','move_to_dlq','nullify_checkout_sensitive_data','read_email_batch',
    'recalculate_all_employees_on_table_activation','recalculate_benefits_after_change',
    'recalculate_salary_range_percentages','snapshot_cycle_decision','sync_profiles_directory_from_profiles',
    'test_audit_rollback_on_insert_failure','update_job_title_salary_range','update_root_company_id',
    'update_session_on_message','validate_org_hierarchy','validate_profile_update',
    'validate_single_company_per_user','validate_super_admin_override','validate_unit_type',
    'cleanup_expired_unsubscribe_tokens','cleanup_old_telemetry','cleanup_rate_limit_logs',
    'registrar_envio_convites_clima','calculate_profile_salary_range_percentage'
  ];
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true AND p.proname = ANY(internal_only)
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM anon, authenticated, PUBLIC', r.proname, r.args);
  END LOOP;
END $$;
