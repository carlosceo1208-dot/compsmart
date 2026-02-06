-- Ensure secure view only joins directory rows within the same company
CREATE OR REPLACE VIEW public.v_performance_evaluations_directory
WITH (security_invoker=on) AS
SELECT 
  pe.id,
  pe.root_company_id,
  pe.employee_id,
  pe.evaluator_id,
  pe.cycle_id,
  pe.template_id,
  pe.evaluator_type,
  pe.status,
  pe.goals_score,
  pe.competency_score,
  pe.final_score,
  pe.potential_score,
  pe.strengths,
  pe.improvement_areas,
  pe.manager_comments,
  pe.employee_comments,
  pe.ai_feedback,
  pe.is_probationary,
  pe.probationary_decision,
  pe.reviewed_by,
  pe.reviewed_at,
  pe.approved_by,
  pe.approved_at,
  pe.created_at,
  pe.updated_at,
  emp.full_name AS employee_full_name,
  emp.avatar_url AS employee_avatar_url,
  emp.job_title AS employee_job_title,
  emp.grade AS employee_grade,
  eval.full_name AS evaluator_full_name,
  eval.avatar_url AS evaluator_avatar_url,
  pc.name AS cycle_name,
  pc.fiscal_year AS cycle_fiscal_year,
  pt.name AS template_name,
  pt.template_type AS template_type
FROM public.performance_evaluations pe
LEFT JOIN public.profiles_directory emp
  ON pe.employee_id = emp.user_id
 AND pe.root_company_id = emp.root_company_id
LEFT JOIN public.profiles_directory eval
  ON pe.evaluator_id = eval.user_id
 AND pe.root_company_id = eval.root_company_id
LEFT JOIN public.performance_cycles pc ON pe.cycle_id = pc.id
LEFT JOIN public.performance_templates pt ON pe.template_id = pt.id;

-- Add trigger to keep profiles_directory synced with profiles changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sync_profiles_directory'
  ) THEN
    CREATE TRIGGER trg_sync_profiles_directory
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_profiles_directory_from_profiles();
  END IF;
END $$;