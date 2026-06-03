
-- checkout_sessions
DROP POLICY IF EXISTS "Users view own active checkout sessions" ON public.checkout_sessions;
CREATE POLICY "Users view own active checkout sessions" ON public.checkout_sessions
  FOR SELECT TO authenticated
  USING ((user_id = auth.uid()) AND (((status = 'pending') AND ((expires_at IS NULL) OR (expires_at > now()))) OR ((status = ANY (ARRAY['paid','failed','expired'])) AND (created_at > (now() - interval '24 hours')))));

-- company_billing
DROP POLICY IF EXISTS "Admins manage own company billing" ON public.company_billing;
DROP POLICY IF EXISTS "Admins view own company billing" ON public.company_billing;
CREATE POLICY "Admins manage own company billing" ON public.company_billing
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (SELECT 1 FROM organizational_structure os WHERE os.id = company_billing.company_id AND (os.root_company_id = get_user_company_id() OR os.id = get_user_company_id()))))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (SELECT 1 FROM organizational_structure os WHERE os.id = company_billing.company_id AND (os.root_company_id = get_user_company_id() OR os.id = get_user_company_id()))));
CREATE POLICY "Admins view own company billing" ON public.company_billing
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (SELECT 1 FROM organizational_structure os WHERE os.id = company_billing.company_id AND (os.root_company_id = get_user_company_id() OR os.id = get_user_company_id()))));

-- evaluation_potential_dimensions
DROP POLICY IF EXISTS "View potential dimensions (HR/admin/manager)" ON public.evaluation_potential_dimensions;
CREATE POLICY "View potential dimensions (HR/admin/manager)" ON public.evaluation_potential_dimensions
  FOR SELECT TO authenticated
  USING ((root_company_id = get_user_company_id()) AND (has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role]) OR (has_role(auth.uid(), 'manager'::app_role) AND evaluation_id IN (SELECT pe.id FROM performance_evaluations pe WHERE pe.evaluator_id = auth.uid()))));

-- merit_approval_requests
DROP POLICY IF EXISTS "Restricted view of merit approvals" ON public.merit_approval_requests;
CREATE POLICY "Restricted view of merit approvals" ON public.merit_approval_requests
  FOR SELECT TO authenticated
  USING ((root_company_id = get_user_company_id()) AND (has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role]) OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = merit_approval_requests.employee_id AND p.manager_id = auth.uid())));

-- nr1_checkins_semanais
DROP POLICY IF EXISTS "user manages own checkins" ON public.nr1_checkins_semanais;
CREATE POLICY "user manages own checkins" ON public.nr1_checkins_semanais
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM nr1_jornadas j WHERE j.id = nr1_checkins_semanais.jornada_id AND j.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM nr1_jornadas j WHERE j.id = nr1_checkins_semanais.jornada_id AND j.user_id = auth.uid()));

-- nr1_jornada_mensagens
DROP POLICY IF EXISTS "user manages own jornada msgs" ON public.nr1_jornada_mensagens;
CREATE POLICY "user manages own jornada msgs" ON public.nr1_jornada_mensagens
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM nr1_jornadas j WHERE j.id = nr1_jornada_mensagens.jornada_id AND j.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM nr1_jornadas j WHERE j.id = nr1_jornada_mensagens.jornada_id AND j.user_id = auth.uid()));

-- nr1_jornadas
DROP POLICY IF EXISTS "user manages own jornada" ON public.nr1_jornadas;
CREATE POLICY "user manages own jornada" ON public.nr1_jornadas
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- performance_competency_scores
DROP POLICY IF EXISTS "View competency scores via evaluation" ON public.performance_competency_scores;
CREATE POLICY "View competency scores via evaluation" ON public.performance_competency_scores
  FOR SELECT TO authenticated
  USING (evaluation_id IN (SELECT pe.id FROM performance_evaluations pe WHERE pe.evaluator_id = auth.uid() OR (pe.root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role]))));

-- performance_evaluations
DROP POLICY IF EXISTS "Privileged and evaluators view evaluations" ON public.performance_evaluations;
CREATE POLICY "Privileged and evaluators view evaluations" ON public.performance_evaluations
  FOR SELECT TO authenticated
  USING (evaluator_id = auth.uid() OR (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role])));

-- performance_merit_recommendations
DROP POLICY IF EXISTS "View merit recommendations" ON public.performance_merit_recommendations;
CREATE POLICY "View merit recommendations" ON public.performance_merit_recommendations
  FOR SELECT TO authenticated
  USING (evaluation_id IN (SELECT performance_evaluations.id FROM performance_evaluations WHERE performance_evaluations.root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role])));

-- talent_intelligence_recommendations
DROP POLICY IF EXISTS "Admin/HR view all talent recommendations in company" ON public.talent_intelligence_recommendations;
CREATE POLICY "Admin/HR view all talent recommendations in company" ON public.talent_intelligence_recommendations
  FOR SELECT TO authenticated
  USING (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role]));

-- talent_recommendation_history
DROP POLICY IF EXISTS "Restricted view of talent rec history" ON public.talent_recommendation_history;
CREATE POLICY "Restricted view of talent rec history" ON public.talent_recommendation_history
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM talent_intelligence_recommendations r WHERE r.id = talent_recommendation_history.recommendation_id AND r.root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role])));
