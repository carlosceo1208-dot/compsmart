
-- Índices em root_company_id (filtro multi-tenant — 18 tabelas)
CREATE INDEX IF NOT EXISTS idx_budget_deadline_settings_root_company ON public.budget_deadline_settings(root_company_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_root_company ON public.conversation_sessions(root_company_id);
CREATE INDEX IF NOT EXISTS idx_cycle_decision_snapshots_root_company ON public.cycle_decision_snapshots(root_company_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_potential_dimensions_root_company ON public.evaluation_potential_dimensions(root_company_id);
CREATE INDEX IF NOT EXISTS idx_job_families_root_company ON public.job_families(root_company_id);
CREATE INDEX IF NOT EXISTS idx_ltip_scenario_comparisons_root_company ON public.ltip_scenario_comparisons(root_company_id);
CREATE INDEX IF NOT EXISTS idx_pay_equity_regression_results_root_company ON public.pay_equity_regression_results(root_company_id);
CREATE INDEX IF NOT EXISTS idx_performance_evaluations_root_company ON public.performance_evaluations(root_company_id);
CREATE INDEX IF NOT EXISTS idx_performance_glossary_terms_root_company ON public.performance_glossary_terms(root_company_id);
CREATE INDEX IF NOT EXISTS idx_performance_goals_root_company ON public.performance_goals(root_company_id);
CREATE INDEX IF NOT EXISTS idx_performance_kudos_root_company ON public.performance_kudos(root_company_id);
CREATE INDEX IF NOT EXISTS idx_performance_merit_rules_root_company ON public.performance_merit_rules(root_company_id);
CREATE INDEX IF NOT EXISTS idx_performance_one_on_ones_root_company ON public.performance_one_on_ones(root_company_id);
CREATE INDEX IF NOT EXISTS idx_performance_pdi_root_company ON public.performance_pdi(root_company_id);
CREATE INDEX IF NOT EXISTS idx_performance_succession_root_company ON public.performance_succession(root_company_id);
CREATE INDEX IF NOT EXISTS idx_performance_templates_root_company ON public.performance_templates(root_company_id);
CREATE INDEX IF NOT EXISTS idx_succession_decisions_root_company ON public.succession_decisions(root_company_id);
CREATE INDEX IF NOT EXISTS idx_survey_tables_root_company ON public.survey_tables(root_company_id);

-- FKs frequentemente filtradas em performance/budget/checkout
CREATE INDEX IF NOT EXISTS idx_performance_evaluations_evaluator ON public.performance_evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_performance_evaluations_template ON public.performance_evaluations(template_id);
CREATE INDEX IF NOT EXISTS idx_performance_one_on_ones_employee ON public.performance_one_on_ones(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_one_on_ones_manager ON public.performance_one_on_ones(manager_id);
CREATE INDEX IF NOT EXISTS idx_performance_merit_recommendations_employee ON public.performance_merit_recommendations(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_merit_recommendations_evaluation ON public.performance_merit_recommendations(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_performance_kudos_from_employee ON public.performance_kudos(from_employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_competency_scores_competency ON public.performance_competency_scores(competency_id);
CREATE INDEX IF NOT EXISTS idx_performance_pdi_competency ON public.performance_pdi(competency_id);
CREATE INDEX IF NOT EXISTS idx_performance_goals_unit ON public.performance_goals(unit_id);
CREATE INDEX IF NOT EXISTS idx_performance_goals_job_title ON public.performance_goals(job_title_id);
CREATE INDEX IF NOT EXISTS idx_performance_goals_parent ON public.performance_goals(parent_goal_id);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_cycle ON public.engagement_metrics(cycle_id);
CREATE INDEX IF NOT EXISTS idx_budget_unit ON public.budget(unit_id);
CREATE INDEX IF NOT EXISTS idx_budget_submission ON public.budget(submission_id);
CREATE INDEX IF NOT EXISTS idx_budget_employee_projections_job_title ON public.budget_employee_projections(projected_job_title_id);
CREATE INDEX IF NOT EXISTS idx_budget_employee_projections_unit ON public.budget_employee_projections(projected_unit_id);
CREATE INDEX IF NOT EXISTS idx_employee_benefits_benefit ON public.employee_benefits(benefit_id);
CREATE INDEX IF NOT EXISTS idx_employee_incentive_assignments_program ON public.employee_incentive_assignments(program_id);
CREATE INDEX IF NOT EXISTS idx_benefit_eligibility_benefit ON public.benefit_eligibility(benefit_id);
CREATE INDEX IF NOT EXISTS idx_incentive_eligibility_program ON public.incentive_eligibility(program_id);
CREATE INDEX IF NOT EXISTS idx_job_titles_salary_range ON public.job_titles(salary_range_id);
CREATE INDEX IF NOT EXISTS idx_profiles_job_title ON public.profiles(job_title_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_company ON public.checkout_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_plan ON public.checkout_sessions(plan_id);
CREATE INDEX IF NOT EXISTS idx_auth_attempt_logs_company ON public.auth_attempt_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_company ON public.security_alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_legal_assistant_conversations_user ON public.legal_assistant_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_external_feedback_requests_requested_by ON public.external_feedback_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_nr1_diagnostico_respostas_questao ON public.nr1_diagnostico_respostas(questao_id);

-- Atualiza estatísticas para o planner usar os novos índices
ANALYZE;
