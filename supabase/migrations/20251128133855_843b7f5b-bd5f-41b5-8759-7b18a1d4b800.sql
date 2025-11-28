-- Fix remaining functions without explicit search_path

-- Fix get_agent_audit_logs
CREATE OR REPLACE FUNCTION public.get_agent_audit_logs(
  p_start_date timestamp without time zone DEFAULT NULL::timestamp without time zone,
  p_end_date timestamp without time zone DEFAULT NULL::timestamp without time zone,
  p_root_company_id uuid DEFAULT NULL::uuid,
  p_agent_type text DEFAULT NULL::text,
  p_user_id uuid DEFAULT NULL::uuid,
  p_operation_mode text DEFAULT NULL::text,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  agent_type text,
  id uuid,
  user_id uuid,
  question text,
  answer text,
  document_name text,
  operation_mode text,
  tokens_used integer,
  response_time_ms integer,
  created_at timestamp without time zone,
  user_name text,
  user_email text,
  root_company_id uuid,
  company_name text,
  user_roles text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Fix get_agent_usage_kpis
CREATE OR REPLACE FUNCTION public.get_agent_usage_kpis(
  p_start_date timestamp without time zone,
  p_end_date timestamp without time zone,
  p_root_company_id uuid DEFAULT NULL::uuid,
  p_agent_type text DEFAULT NULL::text,
  p_user_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  total_queries bigint,
  total_tokens bigint,
  avg_response_time numeric,
  unique_users bigint,
  legal_queries bigint,
  incentive_queries bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
    COALESCE(SUM(v.tokens_used), 0)::BIGINT as total_tokens,
    ROUND(AVG(v.response_time_ms)::NUMERIC, 2) as avg_response_time,
    COUNT(DISTINCT v.user_id)::BIGINT as unique_users,
    COUNT(*) FILTER (WHERE v.agent_type = 'legal')::BIGINT as legal_queries,
    COUNT(*) FILTER (WHERE v.agent_type = 'incentive')::BIGINT as incentive_queries
  FROM v_agent_conversations v
  WHERE v.created_at BETWEEN p_start_date AND p_end_date
    AND v.root_company_id = v_user_company_id
    AND (p_agent_type IS NULL OR v.agent_type = p_agent_type)
    AND (p_user_id IS NULL OR v.user_id = p_user_id);
END;
$function$;

-- Fix count_agent_audit_logs
CREATE OR REPLACE FUNCTION public.count_agent_audit_logs(
  p_start_date timestamp without time zone DEFAULT NULL::timestamp without time zone,
  p_end_date timestamp without time zone DEFAULT NULL::timestamp without time zone,
  p_agent_type text DEFAULT NULL::text,
  p_user_id uuid DEFAULT NULL::uuid,
  p_operation_mode text DEFAULT NULL::text
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;