
-- =====================================================
-- CORREÇÃO 1: evaluation_potential_dimensions
-- Substituir subquery por get_user_company_id() + roles authenticated
-- =====================================================

DROP POLICY IF EXISTS "Users can view potential dimensions of their company" ON public.evaluation_potential_dimensions;
DROP POLICY IF EXISTS "Admin/HR can manage potential dimensions" ON public.evaluation_potential_dimensions;
DROP POLICY IF EXISTS "Managers can manage potential dimensions for their reports" ON public.evaluation_potential_dimensions;

CREATE POLICY "Users can view potential dimensions of their company"
ON public.evaluation_potential_dimensions
FOR SELECT TO authenticated
USING (root_company_id = get_user_company_id());

CREATE POLICY "Admin/HR can manage potential dimensions"
ON public.evaluation_potential_dimensions
FOR ALL TO authenticated
USING (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]))
WITH CHECK (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Managers can manage potential dimensions for their reports"
ON public.evaluation_potential_dimensions
FOR ALL TO authenticated
USING (
  root_company_id = get_user_company_id()
  AND has_role(auth.uid(), 'manager'::app_role)
  AND evaluation_id IN (
    SELECT pe.id FROM performance_evaluations pe WHERE pe.evaluator_id = auth.uid()
  )
)
WITH CHECK (
  root_company_id = get_user_company_id()
  AND has_role(auth.uid(), 'manager'::app_role)
  AND evaluation_id IN (
    SELECT pe.id FROM performance_evaluations pe WHERE pe.evaluator_id = auth.uid()
  )
);

-- =====================================================
-- CORREÇÃO 2: performance_glossary_terms (Opção A)
-- Adicionar root_company_id + isolar por empresa
-- =====================================================

ALTER TABLE public.performance_glossary_terms
ADD COLUMN IF NOT EXISTS root_company_id UUID REFERENCES public.organizational_structure(id);

DROP POLICY IF EXISTS "Admins manage glossary terms" ON public.performance_glossary_terms;
DROP POLICY IF EXISTS "Everyone can view active glossary terms" ON public.performance_glossary_terms;

CREATE POLICY "View active glossary terms"
ON public.performance_glossary_terms
FOR SELECT TO authenticated
USING (
  is_active = true
  AND (root_company_id = get_user_company_id() OR root_company_id IS NULL)
);

CREATE POLICY "Admin/HR manage company glossary terms"
ON public.performance_glossary_terms
FOR ALL TO authenticated
USING (
  (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]))
  OR (root_company_id IS NULL AND is_super_admin(auth.uid()))
)
WITH CHECK (
  (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]))
  OR (root_company_id IS NULL AND is_super_admin(auth.uid()))
);

-- =====================================================
-- CORREÇÃO 3: Padronizar roles de {public} para {authenticated}
-- em todas as tabelas de desempenho afetadas
-- =====================================================

-- performance_competency_scores
DROP POLICY IF EXISTS "Manage competency scores via evaluation" ON public.performance_competency_scores;
DROP POLICY IF EXISTS "View competency scores via evaluation" ON public.performance_competency_scores;

CREATE POLICY "Manage competency scores via evaluation"
ON public.performance_competency_scores
FOR ALL TO authenticated
USING (evaluation_id IN (
  SELECT performance_evaluations.id FROM performance_evaluations
  WHERE performance_evaluations.evaluator_id = auth.uid()
    OR (performance_evaluations.root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]))
))
WITH CHECK (evaluation_id IN (
  SELECT performance_evaluations.id FROM performance_evaluations
  WHERE performance_evaluations.evaluator_id = auth.uid()
    OR (performance_evaluations.root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]))
));

CREATE POLICY "View competency scores via evaluation"
ON public.performance_competency_scores
FOR SELECT TO authenticated
USING (evaluation_id IN (
  SELECT performance_evaluations.id FROM performance_evaluations
  WHERE performance_evaluations.employee_id = auth.uid()
    OR performance_evaluations.evaluator_id = auth.uid()
    OR (performance_evaluations.root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]))
));

-- performance_cycles
DROP POLICY IF EXISTS "Admins and HR manage cycles" ON public.performance_cycles;
DROP POLICY IF EXISTS "Users view own company cycles" ON public.performance_cycles;

CREATE POLICY "Admins and HR manage cycles"
ON public.performance_cycles
FOR ALL TO authenticated
USING (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]))
WITH CHECK (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Users view own company cycles"
ON public.performance_cycles
FOR SELECT TO authenticated
USING (root_company_id = get_user_company_id());

-- performance_evaluations
DROP POLICY IF EXISTS "Admins HR and evaluators manage evaluations" ON public.performance_evaluations;
DROP POLICY IF EXISTS "Users view own evaluations" ON public.performance_evaluations;

CREATE POLICY "Admins HR and evaluators manage evaluations"
ON public.performance_evaluations
FOR ALL TO authenticated
USING (evaluator_id = auth.uid() OR (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])))
WITH CHECK (evaluator_id = auth.uid() OR (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])));

CREATE POLICY "Users view own evaluations"
ON public.performance_evaluations
FOR SELECT TO authenticated
USING (employee_id = auth.uid() OR evaluator_id = auth.uid() OR (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])));

-- performance_goals
DROP POLICY IF EXISTS "Admins HR and Managers manage goals" ON public.performance_goals;
DROP POLICY IF EXISTS "Users view own company goals" ON public.performance_goals;

CREATE POLICY "Admins HR and Managers manage goals"
ON public.performance_goals
FOR ALL TO authenticated
USING (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'manager'::app_role]))
WITH CHECK (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'manager'::app_role]));

CREATE POLICY "Users view own company goals"
ON public.performance_goals
FOR SELECT TO authenticated
USING (root_company_id = get_user_company_id());

-- performance_kudos
DROP POLICY IF EXISTS "Users can send kudos" ON public.performance_kudos;
DROP POLICY IF EXISTS "View public kudos or own" ON public.performance_kudos;

CREATE POLICY "Users can send kudos"
ON public.performance_kudos
FOR INSERT TO authenticated
WITH CHECK (from_employee_id = auth.uid() AND root_company_id = get_user_company_id());

CREATE POLICY "View public kudos or own"
ON public.performance_kudos
FOR SELECT TO authenticated
USING ((is_public = true AND root_company_id = get_user_company_id()) OR from_employee_id = auth.uid() OR to_employee_id = auth.uid());

-- performance_merit_recommendations
DROP POLICY IF EXISTS "Admins and HR manage merit recommendations" ON public.performance_merit_recommendations;
DROP POLICY IF EXISTS "View merit recommendations" ON public.performance_merit_recommendations;

CREATE POLICY "Admins and HR manage merit recommendations"
ON public.performance_merit_recommendations
FOR ALL TO authenticated
USING (evaluation_id IN (
  SELECT performance_evaluations.id FROM performance_evaluations
  WHERE performance_evaluations.root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
))
WITH CHECK (evaluation_id IN (
  SELECT performance_evaluations.id FROM performance_evaluations
  WHERE performance_evaluations.root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
));

CREATE POLICY "View merit recommendations"
ON public.performance_merit_recommendations
FOR SELECT TO authenticated
USING (employee_id = auth.uid() OR evaluation_id IN (
  SELECT performance_evaluations.id FROM performance_evaluations
  WHERE performance_evaluations.root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
));

-- performance_merit_rules
DROP POLICY IF EXISTS "Admins and HR manage merit rules" ON public.performance_merit_rules;
DROP POLICY IF EXISTS "View merit rules" ON public.performance_merit_rules;

CREATE POLICY "Admins and HR manage merit rules"
ON public.performance_merit_rules
FOR ALL TO authenticated
USING (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]))
WITH CHECK (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "View merit rules"
ON public.performance_merit_rules
FOR SELECT TO authenticated
USING (root_company_id = get_user_company_id());

-- performance_one_on_ones
DROP POLICY IF EXISTS "Managers and HR manage 1on1s" ON public.performance_one_on_ones;
DROP POLICY IF EXISTS "Users view own 1on1s" ON public.performance_one_on_ones;

CREATE POLICY "Managers and HR manage 1on1s"
ON public.performance_one_on_ones
FOR ALL TO authenticated
USING (manager_id = auth.uid() OR (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])))
WITH CHECK (manager_id = auth.uid() OR (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])));

CREATE POLICY "Users view own 1on1s"
ON public.performance_one_on_ones
FOR SELECT TO authenticated
USING (employee_id = auth.uid() OR manager_id = auth.uid() OR (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])));

-- performance_pdi
DROP POLICY IF EXISTS "Admins HR and Managers manage PDI" ON public.performance_pdi;
DROP POLICY IF EXISTS "Users view own PDI" ON public.performance_pdi;

CREATE POLICY "Admins HR and Managers manage PDI"
ON public.performance_pdi
FOR ALL TO authenticated
USING (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'manager'::app_role]))
WITH CHECK (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'manager'::app_role]));

CREATE POLICY "Users view own PDI"
ON public.performance_pdi
FOR SELECT TO authenticated
USING (employee_id = auth.uid() OR (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'manager'::app_role])));

-- performance_succession
DROP POLICY IF EXISTS "Admins and HR manage succession" ON public.performance_succession;
DROP POLICY IF EXISTS "Admins and HR view succession" ON public.performance_succession;

CREATE POLICY "Admins and HR manage succession"
ON public.performance_succession
FOR ALL TO authenticated
USING (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]))
WITH CHECK (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Admins and HR view succession"
ON public.performance_succession
FOR SELECT TO authenticated
USING (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- performance_templates (only the ALL policy needs fix, SELECT already uses authenticated)
DROP POLICY IF EXISTS "Admins and HR manage templates" ON public.performance_templates;

CREATE POLICY "Admins and HR manage templates"
ON public.performance_templates
FOR ALL TO authenticated
USING (((root_company_id = get_user_company_id()) OR (is_global = true)) AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]))
WITH CHECK (((root_company_id = get_user_company_id()) OR (is_global = true)) AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- performance_alerts
DROP POLICY IF EXISTS "Users can view alerts from their company" ON public.performance_alerts;
DROP POLICY IF EXISTS "Admins and HR can insert alerts" ON public.performance_alerts;
DROP POLICY IF EXISTS "Admins and HR can update alerts" ON public.performance_alerts;
DROP POLICY IF EXISTS "Admins can delete alerts" ON public.performance_alerts;

CREATE POLICY "Users can view alerts from their company"
ON public.performance_alerts
FOR SELECT TO authenticated
USING (root_company_id = get_user_company_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Admins and HR can insert alerts"
ON public.performance_alerts
FOR INSERT TO authenticated
WITH CHECK (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Admins and HR can update alerts"
ON public.performance_alerts
FOR UPDATE TO authenticated
USING (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Admins can delete alerts"
ON public.performance_alerts
FOR DELETE TO authenticated
USING (root_company_id = get_user_company_id() AND has_role(auth.uid(), 'admin'::app_role));

-- performance_variable_link
DROP POLICY IF EXISTS "Admins and HR manage variable links" ON public.performance_variable_link;
DROP POLICY IF EXISTS "View variable links" ON public.performance_variable_link;

CREATE POLICY "Admins and HR manage variable links"
ON public.performance_variable_link
FOR ALL TO authenticated
USING (evaluation_id IN (
  SELECT performance_evaluations.id FROM performance_evaluations
  WHERE performance_evaluations.root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
))
WITH CHECK (evaluation_id IN (
  SELECT performance_evaluations.id FROM performance_evaluations
  WHERE performance_evaluations.root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
));

CREATE POLICY "View variable links"
ON public.performance_variable_link
FOR SELECT TO authenticated
USING (evaluation_id IN (
  SELECT performance_evaluations.id FROM performance_evaluations
  WHERE performance_evaluations.employee_id = auth.uid() OR performance_evaluations.root_company_id = get_user_company_id()
));

-- external_feedback_requests (remaining {public} policies)
DROP POLICY IF EXISTS "Admin and HR can create feedback requests" ON public.external_feedback_requests;
DROP POLICY IF EXISTS "Admin and HR can update feedback requests" ON public.external_feedback_requests;
DROP POLICY IF EXISTS "Admin can delete feedback requests" ON public.external_feedback_requests;

CREATE POLICY "Admin and HR can create feedback requests"
ON public.external_feedback_requests
FOR INSERT TO authenticated
WITH CHECK (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'manager'::app_role]));

CREATE POLICY "Admin and HR can update feedback requests"
ON public.external_feedback_requests
FOR UPDATE TO authenticated
USING (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'manager'::app_role]));

CREATE POLICY "Admin can delete feedback requests"
ON public.external_feedback_requests
FOR DELETE TO authenticated
USING (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- external_feedback_responses
DROP POLICY IF EXISTS "Anyone can submit response to valid request" ON public.external_feedback_responses;
DROP POLICY IF EXISTS "Users can view feedback responses from their company" ON public.external_feedback_responses;

-- Keep anon access for external respondents (they don't have accounts)
CREATE POLICY "Anyone can submit response to valid request"
ON public.external_feedback_responses
FOR INSERT TO anon, authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM external_feedback_requests efr
  WHERE efr.id = external_feedback_responses.request_id
    AND efr.status = 'sent'::external_feedback_status
    AND efr.deadline > now()
));

CREATE POLICY "Users can view feedback responses from their company"
ON public.external_feedback_responses
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM external_feedback_requests efr
  WHERE efr.id = external_feedback_responses.request_id
    AND efr.root_company_id = get_user_company_id()
));

-- user_feedback
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON public.user_feedback;

CREATE POLICY "Users can insert own feedback"
ON public.user_feedback
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
ON public.user_feedback
FOR SELECT TO authenticated
USING (auth.uid() = user_id);
