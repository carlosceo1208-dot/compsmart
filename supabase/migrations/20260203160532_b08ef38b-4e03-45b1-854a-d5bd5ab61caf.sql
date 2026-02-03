-- Função SECURITY DEFINER que retorna IDs de colaboradores visíveis para o usuário atual
-- Aplica regras de visibilidade: employee vê só próprio, manager vê subordinados, HR/Admin vê todos da empresa
CREATE OR REPLACE FUNCTION public.get_visible_employees(p_user_id UUID, p_company_id UUID)
RETURNS TABLE(employee_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se Admin ou HR, retorna todos da empresa
  IF has_any_role(p_user_id, ARRAY['admin'::app_role, 'hr_manager'::app_role]) THEN
    RETURN QUERY
    SELECT id FROM profiles 
    WHERE root_company_id = p_company_id
      AND status = 'active'
      AND employee_number IS NOT NULL;
  
  -- Se Manager, retorna subordinados diretos + próprio perfil
  ELSIF has_role(p_user_id, 'manager'::app_role) THEN
    RETURN QUERY
    SELECT id FROM profiles 
    WHERE (manager_id = p_user_id OR id = p_user_id)
      AND root_company_id = p_company_id
      AND status = 'active'
      AND employee_number IS NOT NULL;
  
  -- Senão, apenas próprio perfil
  ELSE
    RETURN QUERY
    SELECT id FROM profiles 
    WHERE id = p_user_id
      AND root_company_id = p_company_id;
  END IF;
END;
$$;

-- View segura para listar colaboradores com dados de performance (sem PII sensível)
CREATE OR REPLACE VIEW public.v_performance_employees AS
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