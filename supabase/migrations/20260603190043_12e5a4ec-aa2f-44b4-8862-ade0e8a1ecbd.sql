
-- Remove employee self-read from performance_evaluations
DROP POLICY IF EXISTS "Users view own evaluations" ON public.performance_evaluations;
CREATE POLICY "Privileged and evaluators view evaluations"
ON public.performance_evaluations
FOR SELECT
USING (
  (evaluator_id = auth.uid())
  OR (
    (root_company_id = get_user_company_id())
    AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  )
);

-- Remove employee self-read from performance_competency_scores
DROP POLICY IF EXISTS "View competency scores via evaluation" ON public.performance_competency_scores;
CREATE POLICY "View competency scores via evaluation"
ON public.performance_competency_scores
FOR SELECT
USING (
  evaluation_id IN (
    SELECT pe.id FROM public.performance_evaluations pe
    WHERE (pe.evaluator_id = auth.uid())
       OR ((pe.root_company_id = get_user_company_id())
           AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role]))
  )
);

-- Remove employee self-read from evaluation_potential_dimensions
DROP POLICY IF EXISTS "View potential dimensions (own or HR/admin/manager)" ON public.evaluation_potential_dimensions;
CREATE POLICY "View potential dimensions (HR/admin/manager)"
ON public.evaluation_potential_dimensions
FOR SELECT
USING (
  (root_company_id = get_user_company_id())
  AND (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
    OR (
      has_role(auth.uid(), 'manager'::app_role)
      AND evaluation_id IN (
        SELECT pe.id FROM public.performance_evaluations pe WHERE pe.evaluator_id = auth.uid()
      )
    )
  )
);

-- Remove employee self-read from merit_approval_history
DROP POLICY IF EXISTS "Privileged roles and actor view merit history" ON public.merit_approval_history;
CREATE POLICY "Privileged roles and actor view merit history"
ON public.merit_approval_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.merit_approval_requests r
    WHERE r.id = merit_approval_history.request_id
      AND r.root_company_id = get_user_company_id()
      AND (
        has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
        OR merit_approval_history.actor_id = auth.uid()
      )
  )
);

-- Remove employee self-read from talent_recommendation_history
DROP POLICY IF EXISTS "Restricted view of talent rec history" ON public.talent_recommendation_history;
CREATE POLICY "Restricted view of talent rec history"
ON public.talent_recommendation_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.talent_intelligence_recommendations r
    WHERE r.id = talent_recommendation_history.recommendation_id
      AND r.root_company_id = get_user_company_id()
      AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  )
);
