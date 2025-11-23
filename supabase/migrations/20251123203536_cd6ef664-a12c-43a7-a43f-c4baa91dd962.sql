-- =====================================================
-- FASE 1 & 2: ESTRUTURA DE DADOS + FUNÇÕES DE DETECÇÃO
-- =====================================================

-- 1.1 Tabela de Configuração de Alertas
CREATE TABLE public.alert_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_company_id UUID NOT NULL REFERENCES organizational_structure(id),
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'spike_queries',
    'recurring_errors', 
    'inactive_users',
    'token_overconsumption',
    'after_hours_usage',
    'user_concentration'
  )),
  
  -- Thresholds personalizáveis
  threshold_value NUMERIC NOT NULL,
  threshold_unit TEXT, -- 'percentage', 'absolute', 'days'
  
  -- Configuração do alerta
  enabled BOOLEAN DEFAULT true,
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  
  -- Frequência de verificação
  check_frequency TEXT DEFAULT 'daily' CHECK (check_frequency IN ('hourly', 'daily', 'weekly')),
  
  -- Destinatários
  recipients TEXT[] NOT NULL,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  
  UNIQUE(root_company_id, alert_type)
);

-- RLS Policies
ALTER TABLE public.alert_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company alert configs"
  ON alert_configurations FOR SELECT
  USING (root_company_id = get_user_company_id());

CREATE POLICY "Admins can manage alert configs"
  ON alert_configurations FOR ALL
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND root_company_id = get_user_company_id()
  );

-- Trigger para updated_at
CREATE TRIGGER update_alert_configurations_updated_at
  BEFORE UPDATE ON alert_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 1.2 Tabela de Histórico de Alertas
CREATE TABLE public.alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_company_id UUID NOT NULL REFERENCES organizational_structure(id),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  
  -- Detalhes da anomalia
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  threshold_value NUMERIC NOT NULL,
  
  -- Dados contextuais (JSON)
  context JSONB,
  
  -- Status do alerta
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- Email enviado
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  email_recipients TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company alerts"
  ON alert_history FOR SELECT
  USING (root_company_id = get_user_company_id());

CREATE POLICY "Admins can manage alerts"
  ON alert_history FOR ALL
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND root_company_id = get_user_company_id()
  );

-- Índices para performance
CREATE INDEX idx_alert_history_company ON alert_history(root_company_id);
CREATE INDEX idx_alert_history_status ON alert_history(status);
CREATE INDEX idx_alert_history_created_at ON alert_history(created_at);

-- 1.3 Função para Criar Configurações Padrão
CREATE OR REPLACE FUNCTION create_default_alert_configs()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'company' THEN
    INSERT INTO alert_configurations (root_company_id, alert_type, threshold_value, threshold_unit, recipients)
    VALUES 
      (NEW.id, 'spike_queries', 150, 'percentage', ARRAY['admin@company.com']),
      (NEW.id, 'recurring_errors', 5, 'absolute', ARRAY['admin@company.com']),
      (NEW.id, 'inactive_users', 30, 'days', ARRAY['admin@company.com']),
      (NEW.id, 'token_overconsumption', 80, 'percentage', ARRAY['admin@company.com']),
      (NEW.id, 'after_hours_usage', 10, 'absolute', ARRAY['admin@company.com']),
      (NEW.id, 'user_concentration', 50, 'percentage', ARRAY['admin@company.com']);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_company_alert_configs
  AFTER INSERT ON organizational_structure
  FOR EACH ROW
  EXECUTE FUNCTION create_default_alert_configs();

-- =====================================================
-- FASE 2: FUNÇÕES DE DETECÇÃO
-- =====================================================

-- 2.1 Detectar Pico de Consultas
CREATE OR REPLACE FUNCTION detect_query_spikes(p_company_id UUID, p_threshold NUMERIC)
RETURNS TABLE (
  detected BOOLEAN,
  current_count BIGINT,
  avg_last_7_days NUMERIC,
  percentage_increase NUMERIC
) AS $$
DECLARE
  v_today_count BIGINT;
  v_avg_count NUMERIC;
BEGIN
  SELECT COUNT(*) INTO v_today_count
  FROM v_agent_conversations
  WHERE root_company_id = p_company_id
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day';
  
  SELECT AVG(daily_count) INTO v_avg_count
  FROM (
    SELECT DATE(created_at) as day, COUNT(*) as daily_count
    FROM v_agent_conversations
    WHERE root_company_id = p_company_id
      AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      AND created_at < CURRENT_DATE
    GROUP BY DATE(created_at)
  ) daily_stats;
  
  v_avg_count := COALESCE(v_avg_count, 0);
  
  RETURN QUERY SELECT 
    (v_today_count > (v_avg_count * (p_threshold / 100)))::BOOLEAN,
    v_today_count,
    v_avg_count,
    CASE WHEN v_avg_count > 0 
      THEN ((v_today_count - v_avg_count) / v_avg_count * 100)
      ELSE 0 
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.2 Detectar Erros Recorrentes
CREATE OR REPLACE FUNCTION detect_recurring_errors(p_company_id UUID, p_threshold INTEGER)
RETURNS TABLE (
  detected BOOLEAN,
  error_count BIGINT,
  slow_queries BIGINT,
  affected_users TEXT[]
) AS $$
DECLARE
  v_slow_count BIGINT;
  v_users TEXT[];
BEGIN
  SELECT 
    COUNT(*),
    ARRAY_AGG(DISTINCT user_name)
  INTO v_slow_count, v_users
  FROM v_agent_conversations
  WHERE root_company_id = p_company_id
    AND created_at >= CURRENT_DATE
    AND response_time_ms > 5000;
  
  RETURN QUERY SELECT 
    (v_slow_count >= p_threshold)::BOOLEAN,
    v_slow_count,
    v_slow_count,
    COALESCE(v_users, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.3 Detectar Usuários Inativos
CREATE OR REPLACE FUNCTION detect_inactive_users(p_company_id UUID, p_days_threshold INTEGER)
RETURNS TABLE (
  detected BOOLEAN,
  inactive_count BIGINT,
  inactive_users JSONB
) AS $$
DECLARE
  v_inactive JSONB;
  v_count BIGINT;
BEGIN
  SELECT 
    JSONB_AGG(user_data),
    COUNT(*)
  INTO v_inactive, v_count
  FROM (
    SELECT JSONB_BUILD_OBJECT(
      'user_id', p.id,
      'user_name', p.full_name,
      'user_email', p.email,
      'last_usage', COALESCE(MAX(vc.created_at)::TEXT, 'Nunca usou'),
      'days_inactive', COALESCE(EXTRACT(DAY FROM (NOW() - MAX(vc.created_at))), 999)
    ) as user_data
    FROM profiles p
    LEFT JOIN v_agent_conversations vc ON p.id = vc.user_id
    WHERE p.root_company_id = p_company_id
      AND p.has_system_access = true
      AND (vc.created_at IS NULL OR vc.created_at < NOW() - (p_days_threshold || ' days')::INTERVAL)
    GROUP BY p.id, p.full_name, p.email
  ) inactive_data;
  
  RETURN QUERY SELECT 
    (COALESCE(v_count, 0) > 0)::BOOLEAN,
    COALESCE(v_count, 0),
    COALESCE(v_inactive, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.4 Detectar Consumo Excessivo de Tokens
CREATE OR REPLACE FUNCTION detect_token_overconsumption(
  p_company_id UUID,
  p_monthly_limit BIGINT,
  p_threshold_percentage NUMERIC
)
RETURNS TABLE (
  detected BOOLEAN,
  tokens_used BIGINT,
  tokens_limit BIGINT,
  percentage_used NUMERIC,
  days_elapsed INTEGER,
  projected_total NUMERIC
) AS $$
DECLARE
  v_month_start DATE := DATE_TRUNC('month', CURRENT_DATE);
  v_days_in_month INTEGER := EXTRACT(DAY FROM DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') - INTERVAL '1 day');
  v_days_elapsed INTEGER := EXTRACT(DAY FROM CURRENT_DATE) - EXTRACT(DAY FROM v_month_start) + 1;
  v_tokens_used BIGINT;
  v_percentage NUMERIC;
  v_projection NUMERIC;
BEGIN
  SELECT COALESCE(SUM(tokens_used), 0)
  INTO v_tokens_used
  FROM v_agent_conversations
  WHERE root_company_id = p_company_id
    AND created_at >= v_month_start;
  
  v_percentage := (v_tokens_used::NUMERIC / p_monthly_limit) * 100;
  v_projection := (v_tokens_used::NUMERIC / v_days_elapsed) * v_days_in_month;
  
  RETURN QUERY SELECT 
    (v_percentage >= p_threshold_percentage)::BOOLEAN,
    v_tokens_used,
    p_monthly_limit,
    v_percentage,
    v_days_elapsed,
    v_projection;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.5 Detectar Uso Fora do Horário
CREATE OR REPLACE FUNCTION detect_after_hours_usage(p_company_id UUID, p_threshold INTEGER)
RETURNS TABLE (
  detected BOOLEAN,
  after_hours_count BIGINT,
  queries_detail JSONB
) AS $$
DECLARE
  v_count BIGINT;
  v_detail JSONB;
BEGIN
  SELECT 
    COUNT(*),
    JSONB_AGG(JSONB_BUILD_OBJECT(
      'user_name', user_name,
      'timestamp', created_at,
      'agent_type', agent_type,
      'hour', EXTRACT(HOUR FROM created_at)
    ))
  INTO v_count, v_detail
  FROM v_agent_conversations
  WHERE root_company_id = p_company_id
    AND created_at >= CURRENT_DATE
    AND (
      EXTRACT(HOUR FROM created_at) >= 22 OR 
      EXTRACT(HOUR FROM created_at) < 6 OR
      EXTRACT(DOW FROM created_at) IN (0, 6)
    );
  
  RETURN QUERY SELECT 
    (COALESCE(v_count, 0) >= p_threshold)::BOOLEAN,
    COALESCE(v_count, 0),
    COALESCE(v_detail, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.6 Detectar Concentração de Uso
CREATE OR REPLACE FUNCTION detect_user_concentration(p_company_id UUID, p_threshold NUMERIC)
RETURNS TABLE (
  detected BOOLEAN,
  top_user_name TEXT,
  top_user_count BIGINT,
  total_count BIGINT,
  concentration_percentage NUMERIC
) AS $$
DECLARE
  v_top_user_name TEXT;
  v_top_count BIGINT;
  v_total BIGINT;
  v_percentage NUMERIC;
BEGIN
  SELECT 
    user_name,
    COUNT(*) as user_count
  INTO v_top_user_name, v_top_count
  FROM v_agent_conversations
  WHERE root_company_id = p_company_id
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
  GROUP BY user_name
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  SELECT COUNT(*)
  INTO v_total
  FROM v_agent_conversations
  WHERE root_company_id = p_company_id
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE);
  
  v_percentage := (v_top_count::NUMERIC / NULLIF(v_total, 0)) * 100;
  
  RETURN QUERY SELECT 
    (COALESCE(v_percentage, 0) >= p_threshold)::BOOLEAN,
    COALESCE(v_top_user_name, 'N/A'),
    COALESCE(v_top_count, 0),
    COALESCE(v_total, 0),
    COALESCE(v_percentage, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;