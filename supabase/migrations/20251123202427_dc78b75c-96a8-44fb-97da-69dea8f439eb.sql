-- View consolidada para unificar logs dos agentes (sem RLS direto)
CREATE OR REPLACE VIEW v_agent_conversations AS
SELECT 
  'legal' as agent_type,
  lac.id,
  lac.user_id,
  lac.question,
  lac.answer,
  lac.document_name,
  lac.operation_mode,
  lac.tokens_used,
  lac.response_time_ms,
  lac.created_at,
  p.full_name as user_name,
  p.email as user_email,
  p.root_company_id,
  os.name as company_name,
  COALESCE(
    (SELECT STRING_AGG(role::text, ', ') FROM user_roles WHERE user_id = lac.user_id),
    'employee'
  ) as user_roles
FROM legal_assistant_conversations lac
LEFT JOIN profiles p ON lac.user_id = p.id
LEFT JOIN organizational_structure os ON p.root_company_id = os.id

UNION ALL

SELECT 
  'incentive' as agent_type,
  iac.id,
  iac.user_id,
  iac.question,
  iac.answer,
  iac.document_name,
  iac.operation_mode,
  iac.tokens_used,
  iac.response_time_ms,
  iac.created_at,
  p.full_name as user_name,
  p.email as user_email,
  p.root_company_id,
  os.name as company_name,
  COALESCE(
    (SELECT STRING_AGG(role::text, ', ') FROM user_roles WHERE user_id = iac.user_id),
    'employee'
  ) as user_roles
FROM incentive_assistant_conversations iac
LEFT JOIN profiles p ON iac.user_id = p.id
LEFT JOIN organizational_structure os ON p.root_company_id = os.id;

-- Função segura para buscar logs de auditoria (com validação de permissão embutida)
CREATE OR REPLACE FUNCTION get_agent_audit_logs(
  p_start_date TIMESTAMP DEFAULT NULL,
  p_end_date TIMESTAMP DEFAULT NULL,
  p_root_company_id UUID DEFAULT NULL,
  p_agent_type TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_operation_mode TEXT DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  agent_type TEXT,
  id UUID,
  user_id UUID,
  question TEXT,
  answer TEXT,
  document_name TEXT,
  operation_mode TEXT,
  tokens_used INT,
  response_time_ms INT,
  created_at TIMESTAMP,
  user_name TEXT,
  user_email TEXT,
  root_company_id UUID,
  company_name TEXT,
  user_roles TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_company_id UUID;
BEGIN
  -- Verificar se o usuário tem permissão (Admin ou HR)
  IF NOT has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores e RH podem visualizar logs de auditoria.';
  END IF;
  
  -- Pegar a empresa do usuário atual
  SELECT profiles.root_company_id INTO v_user_company_id
  FROM profiles
  WHERE profiles.id = auth.uid();
  
  -- Retornar logs filtrados
  RETURN QUERY
  SELECT 
    v.agent_type,
    v.id,
    v.user_id,
    v.question,
    v.answer,
    v.document_name,
    v.operation_mode,
    v.tokens_used,
    v.response_time_ms,
    v.created_at,
    v.user_name,
    v.user_email,
    v.root_company_id,
    v.company_name,
    v.user_roles
  FROM v_agent_conversations v
  WHERE v.root_company_id = v_user_company_id
    AND (p_start_date IS NULL OR v.created_at >= p_start_date)
    AND (p_end_date IS NULL OR v.created_at <= p_end_date)
    AND (p_agent_type IS NULL OR v.agent_type = p_agent_type)
    AND (p_user_id IS NULL OR v.user_id = p_user_id)
    AND (p_operation_mode IS NULL OR v.operation_mode = p_operation_mode)
  ORDER BY v.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Função para calcular KPIs de uso dos agentes
CREATE OR REPLACE FUNCTION get_agent_usage_kpis(
  p_start_date TIMESTAMP,
  p_end_date TIMESTAMP,
  p_root_company_id UUID DEFAULT NULL,
  p_agent_type TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_queries BIGINT,
  total_tokens BIGINT,
  avg_response_time NUMERIC,
  unique_users BIGINT,
  legal_queries BIGINT,
  incentive_queries BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_company_id UUID;
BEGIN
  -- Verificar se o usuário tem permissão
  IF NOT has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores e RH podem visualizar KPIs de auditoria.';
  END IF;
  
  -- Pegar a empresa do usuário atual
  SELECT profiles.root_company_id INTO v_user_company_id
  FROM profiles
  WHERE profiles.id = auth.uid();
  
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_queries,
    COALESCE(SUM(tokens_used), 0)::BIGINT as total_tokens,
    ROUND(AVG(response_time_ms)::NUMERIC, 2) as avg_response_time,
    COUNT(DISTINCT user_id)::BIGINT as unique_users,
    COUNT(*) FILTER (WHERE agent_type = 'legal')::BIGINT as legal_queries,
    COUNT(*) FILTER (WHERE agent_type = 'incentive')::BIGINT as incentive_queries
  FROM v_agent_conversations
  WHERE created_at BETWEEN p_start_date AND p_end_date
    AND root_company_id = v_user_company_id
    AND (p_agent_type IS NULL OR agent_type = p_agent_type)
    AND (p_user_id IS NULL OR user_id = p_user_id);
END;
$$;

-- Função para contar total de logs (para paginação)
CREATE OR REPLACE FUNCTION count_agent_audit_logs(
  p_start_date TIMESTAMP DEFAULT NULL,
  p_end_date TIMESTAMP DEFAULT NULL,
  p_agent_type TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_operation_mode TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_company_id UUID;
  v_count BIGINT;
BEGIN
  -- Verificar se o usuário tem permissão
  IF NOT has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]) THEN
    RAISE EXCEPTION 'Acesso negado.';
  END IF;
  
  -- Pegar a empresa do usuário atual
  SELECT profiles.root_company_id INTO v_user_company_id
  FROM profiles
  WHERE profiles.id = auth.uid();
  
  SELECT COUNT(*) INTO v_count
  FROM v_agent_conversations
  WHERE root_company_id = v_user_company_id
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date)
    AND (p_agent_type IS NULL OR agent_type = p_agent_type)
    AND (p_user_id IS NULL OR user_id = p_user_id)
    AND (p_operation_mode IS NULL OR operation_mode = p_operation_mode);
  
  RETURN v_count;
END;
$$;