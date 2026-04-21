
-- ============================================
-- 1. TALENT INTELLIGENCE: Mérito com guardrails
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_smart_merit(
  p_box_position INTEGER,
  p_compa_ratio NUMERIC DEFAULT 1.0,
  p_months_since_last_raise INTEGER DEFAULT 12,
  p_budget_available_pct NUMERIC DEFAULT 100.0
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_pct NUMERIC;
  v_adjusted_pct NUMERIC;
  v_compa_factor NUMERIC := 1.0;
  v_time_factor NUMERIC := 1.0;
  v_budget_factor NUMERIC := 1.0;
  v_warnings TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Base por 9Box
  v_base_pct := CASE p_box_position
    WHEN 9 THEN 15.0
    WHEN 8 THEN 12.0
    WHEN 7 THEN 10.0
    WHEN 6 THEN 8.0
    WHEN 5 THEN 5.0
    WHEN 4 THEN 4.0
    WHEN 3 THEN 2.0
    WHEN 2 THEN 1.0
    WHEN 1 THEN 0.0
    ELSE 3.0
  END;

  -- Compa-ratio: se já está acima do teto da faixa, reduz drasticamente
  IF p_compa_ratio >= 1.20 THEN
    v_compa_factor := 0.30;
    v_warnings := array_append(v_warnings, 'Colaborador acima do teto da faixa (compa-ratio ≥ 1.20)');
  ELSIF p_compa_ratio >= 1.10 THEN
    v_compa_factor := 0.60;
    v_warnings := array_append(v_warnings, 'Colaborador no terço superior da faixa');
  ELSIF p_compa_ratio < 0.85 THEN
    v_compa_factor := 1.20;
    v_warnings := array_append(v_warnings, 'Colaborador abaixo do mínimo da faixa - prioridade alta');
  END IF;

  -- Tempo desde último aumento
  IF p_months_since_last_raise < 6 THEN
    v_time_factor := 0.0;
    v_warnings := array_append(v_warnings, 'Aumento recente (< 6 meses) - bloqueado');
  ELSIF p_months_since_last_raise < 12 THEN
    v_time_factor := 0.5;
  END IF;

  -- Budget disponível
  IF p_budget_available_pct < 50 THEN
    v_budget_factor := 0.7;
    v_warnings := array_append(v_warnings, 'Orçamento da unidade < 50% disponível');
  ELSIF p_budget_available_pct < 25 THEN
    v_budget_factor := 0.4;
    v_warnings := array_append(v_warnings, 'Orçamento crítico (< 25%) - revisão recomendada');
  END IF;

  v_adjusted_pct := ROUND((v_base_pct * v_compa_factor * v_time_factor * v_budget_factor)::NUMERIC, 2);

  RETURN jsonb_build_object(
    'base_pct', v_base_pct,
    'adjusted_pct', v_adjusted_pct,
    'compa_factor', v_compa_factor,
    'time_factor', v_time_factor,
    'budget_factor', v_budget_factor,
    'warnings', v_warnings,
    'is_blocked', v_adjusted_pct = 0
  );
END;
$$;

-- ============================================
-- 2. PAY EQUITY: Análise de regressão multivariada
-- ============================================
CREATE TABLE IF NOT EXISTS public.pay_equity_regression_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_company_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  analysis_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  protected_attribute TEXT NOT NULL CHECK (protected_attribute IN ('gender', 'race', 'age_group')),
  group_a_label TEXT NOT NULL,
  group_b_label TEXT NOT NULL,
  raw_gap_pct NUMERIC NOT NULL,
  explained_gap_pct NUMERIC NOT NULL,
  unexplained_gap_pct NUMERIC NOT NULL,
  controls_used JSONB NOT NULL DEFAULT '{}'::jsonb,
  sample_size INTEGER NOT NULL,
  statistical_significance NUMERIC,
  severity TEXT NOT NULL CHECK (severity IN ('none', 'low', 'medium', 'high', 'critical')),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pay_equity_regression_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and Admin can view regression results"
ON public.pay_equity_regression_results FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'hr_manager'::app_role)
);

CREATE POLICY "HR and Admin can create regression results"
ON public.pay_equity_regression_results FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'hr_manager'::app_role)
);

-- ============================================
-- 3. EXECUTIVE COMPENSATION: Cenários de stress
-- ============================================
ALTER TABLE public.executive_ltip_simulations
  ADD COLUMN IF NOT EXISTS bear_growth_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS bull_growth_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS bear_value_at_vest NUMERIC,
  ADD COLUMN IF NOT EXISTS bull_value_at_vest NUMERIC,
  ADD COLUMN IF NOT EXISTS clawback_clause TEXT,
  ADD COLUMN IF NOT EXISTS forfeiture_rules JSONB,
  ADD COLUMN IF NOT EXISTS leaver_treatment JSONB,
  ADD COLUMN IF NOT EXISTS liquidity_event_assumption TEXT;

CREATE TABLE IF NOT EXISTS public.ltip_scenario_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_company_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  comparison_name TEXT NOT NULL,
  employee_id UUID,
  grant_value NUMERIC NOT NULL,
  vesting_years INTEGER NOT NULL DEFAULT 4,
  cliff_months INTEGER NOT NULL DEFAULT 12,
  growth_rate NUMERIC NOT NULL DEFAULT 0.10,
  instruments_compared JSONB NOT NULL,
  results JSONB NOT NULL,
  recommendation TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ltip_scenario_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and HR can view scenario comparisons"
ON public.ltip_scenario_comparisons FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'hr_manager'::app_role)
);

CREATE POLICY "Admin and HR can manage scenario comparisons"
ON public.ltip_scenario_comparisons FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'hr_manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'hr_manager'::app_role)
);

-- ============================================
-- 4. DASHBOARD EXECUTIVO: Indicadores macro
-- ============================================
CREATE TABLE IF NOT EXISTS public.executive_dashboard_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_key TEXT NOT NULL,
  indicator_value NUMERIC NOT NULL,
  reference_date DATE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  source TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(indicator_key, reference_date)
);

ALTER TABLE public.executive_dashboard_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view indicators"
ON public.executive_dashboard_indicators FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage indicators"
ON public.executive_dashboard_indicators FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE INDEX IF NOT EXISTS idx_indicators_key_date 
  ON public.executive_dashboard_indicators(indicator_key, reference_date DESC);

-- Trigger update_at
CREATE TRIGGER update_ltip_scenario_comparisons_updated_at
  BEFORE UPDATE ON public.ltip_scenario_comparisons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
