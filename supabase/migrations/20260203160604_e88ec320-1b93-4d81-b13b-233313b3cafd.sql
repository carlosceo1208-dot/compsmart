-- Recriar a view com security_invoker para respeitar RLS do usuário que consulta
DROP VIEW IF EXISTS public.v_performance_employees;

CREATE VIEW public.v_performance_employees
WITH (security_invoker=on) AS
SELECT 
  p.id,
  p.full_name,
  p.job_title,
  p.grade,
  p.avatar_url,
  p.unit_id,
  p.manager_id,
  p.root_company_id,
  p.status,
  p.hire_date,
  os.description as unit_name,
  os.type as unit_type,
  get_org_breadcrumb_friendly(p.unit_id) as unit_breadcrumb,
  mgr.full_name as manager_name,
  -- Contagem de metas ativas (pending ou in_progress)
  (SELECT COUNT(*) FROM performance_goals pg 
   WHERE pg.employee_id = p.id 
   AND pg.status IN ('pending', 'in_progress')) as active_goals_count,
  -- Contagem de PDIs ativos (pending ou in_progress)
  (SELECT COUNT(*) FROM performance_pdi pdi 
   WHERE pdi.employee_id = p.id 
   AND pdi.status IN ('in_progress', 'pending')) as active_pdi_count,
  -- Contagem de feedbacks 360 pendentes
  (SELECT COUNT(*) FROM external_feedback_requests efr
   WHERE efr.employee_id = p.id
   AND efr.status = 'sent') as pending_feedback_count,
  -- Última nota de avaliação (final_score)
  (SELECT pe.final_score FROM performance_evaluations pe
   WHERE pe.employee_id = p.id
   ORDER BY pe.created_at DESC
   LIMIT 1) as last_evaluation_score,
  -- Status da última avaliação
  (SELECT pe.status FROM performance_evaluations pe
   WHERE pe.employee_id = p.id
   ORDER BY pe.created_at DESC
   LIMIT 1) as last_evaluation_status
FROM profiles p
LEFT JOIN organizational_structure os ON p.unit_id = os.id
LEFT JOIN profiles mgr ON p.manager_id = mgr.id
WHERE p.employee_number IS NOT NULL
  AND p.status = 'active';