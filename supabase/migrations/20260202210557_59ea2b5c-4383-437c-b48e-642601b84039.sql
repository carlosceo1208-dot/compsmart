-- =====================================================
-- TABELA DE ALERTAS DE PERFORMANCE
-- =====================================================

CREATE TABLE public.performance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_company_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('attention', 'neutral', 'positive')),
  title TEXT NOT NULL,
  message TEXT,
  context JSONB DEFAULT '{}'::JSONB,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_performance_alerts_company ON public.performance_alerts(root_company_id);
CREATE INDEX idx_performance_alerts_employee ON public.performance_alerts(employee_id);
CREATE INDEX idx_performance_alerts_severity ON public.performance_alerts(severity);
CREATE INDEX idx_performance_alerts_resolved ON public.performance_alerts(is_resolved);
CREATE INDEX idx_performance_alerts_created ON public.performance_alerts(created_at DESC);

-- Enable RLS
ALTER TABLE public.performance_alerts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view alerts from their company"
ON public.performance_alerts
FOR SELECT
USING (
  root_company_id = public.get_user_company_id()
  OR public.is_super_admin(auth.uid())
);

CREATE POLICY "Admins and HR can insert alerts"
ON public.performance_alerts
FOR INSERT
WITH CHECK (
  root_company_id = public.get_user_company_id()
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
);

CREATE POLICY "Admins and HR can update alerts"
ON public.performance_alerts
FOR UPDATE
USING (
  root_company_id = public.get_user_company_id()
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
);

CREATE POLICY "Admins can delete alerts"
ON public.performance_alerts
FOR DELETE
USING (
  root_company_id = public.get_user_company_id()
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- =====================================================
-- TABELA DE MÉTRICAS DE ENGAJAMENTO
-- =====================================================

CREATE TABLE public.engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_company_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('enps', 'adherence', 'feedback_index', 'pdi_velocity')),
  metric_value NUMERIC NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  cycle_id UUID REFERENCES public.performance_cycles(id),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_engagement_metrics_company ON public.engagement_metrics(root_company_id);
CREATE INDEX idx_engagement_metrics_type ON public.engagement_metrics(metric_type);
CREATE INDEX idx_engagement_metrics_period ON public.engagement_metrics(period_start, period_end);

-- Enable RLS
ALTER TABLE public.engagement_metrics ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view metrics from their company"
ON public.engagement_metrics
FOR SELECT
USING (
  root_company_id = public.get_user_company_id()
  OR public.is_super_admin(auth.uid())
);

CREATE POLICY "System can insert metrics"
ON public.engagement_metrics
FOR INSERT
WITH CHECK (
  root_company_id = public.get_user_company_id()
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
);

-- =====================================================
-- TABELA DE CONVERSAS PERSISTENTES DO PERFORMAI
-- =====================================================

CREATE TABLE IF NOT EXISTS public.performai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.conversation_sessions(id),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  employee_context_id UUID REFERENCES public.profiles(id),
  action_type TEXT,
  response_time_ms INTEGER,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_performai_conversations_user ON public.performai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_performai_conversations_session ON public.performai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_performai_conversations_created ON public.performai_conversations(created_at DESC);

-- Enable RLS
ALTER TABLE public.performai_conversations ENABLE ROW LEVEL SECURITY;

-- Policies (drop if exists para recriar)
DROP POLICY IF EXISTS "Users can view own performai conversations" ON public.performai_conversations;
DROP POLICY IF EXISTS "Users can insert own performai conversations" ON public.performai_conversations;

CREATE POLICY "Users can view own performai conversations"
ON public.performai_conversations
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own performai conversations"
ON public.performai_conversations
FOR INSERT
WITH CHECK (user_id = auth.uid());