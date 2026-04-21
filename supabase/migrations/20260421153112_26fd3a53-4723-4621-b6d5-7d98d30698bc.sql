
-- ============= FASE 2.9: PAY EQUITY =============

-- Adiciona campos demográficos opcionais (LGPD: voluntários)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('feminino','masculino','nao_binario','prefere_nao_informar')),
  ADD COLUMN IF NOT EXISTS race_ethnicity TEXT CHECK (race_ethnicity IN ('branca','preta','parda','amarela','indigena','prefere_nao_informar')),
  ADD COLUMN IF NOT EXISTS age_range TEXT CHECK (age_range IN ('18-25','26-35','36-45','46-55','56+'));

-- Tabela de alertas de inequidade
CREATE TABLE IF NOT EXISTS public.pay_equity_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_company_id UUID NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('gender_gap','race_gap','age_gap','dispersion','outlier')),
  job_title TEXT,
  grade TEXT,
  group_a_label TEXT NOT NULL,
  group_b_label TEXT NOT NULL,
  group_a_avg_salary NUMERIC(12,2),
  group_b_avg_salary NUMERIC(12,2),
  gap_percentage NUMERIC(6,2),
  affected_count INTEGER,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','justified','remediated','dismissed')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pay_equity_alerts_company ON public.pay_equity_alerts(root_company_id);
CREATE INDEX IF NOT EXISTS idx_pay_equity_alerts_status ON public.pay_equity_alerts(status);

ALTER TABLE public.pay_equity_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/HR view pay equity alerts"
  ON public.pay_equity_alerts FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'hr_manager'::app_role)
  );

CREATE POLICY "Admin/HR insert pay equity alerts"
  ON public.pay_equity_alerts FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'hr_manager'::app_role)
  );

CREATE POLICY "Admin/HR update pay equity alerts"
  ON public.pay_equity_alerts FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'hr_manager'::app_role)
  );

CREATE POLICY "Admin delete pay equity alerts"
  ON public.pay_equity_alerts FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE TRIGGER trg_pay_equity_alerts_updated_at
  BEFORE UPDATE ON public.pay_equity_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- View: análise de equidade por gênero
CREATE OR REPLACE VIEW public.v_pay_equity_by_gender AS
SELECT 
  root_company_id,
  job_title,
  grade,
  gender,
  COUNT(*) AS employee_count,
  AVG(salary) AS avg_salary,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) AS median_salary,
  MIN(salary) AS min_salary,
  MAX(salary) AS max_salary
FROM public.profiles
WHERE status = 'active' 
  AND employee_number IS NOT NULL
  AND salary IS NOT NULL
  AND gender IS NOT NULL
  AND gender != 'prefere_nao_informar'
GROUP BY root_company_id, job_title, grade, gender;

ALTER VIEW public.v_pay_equity_by_gender SET (security_invoker = true);

-- View: análise de equidade por raça
CREATE OR REPLACE VIEW public.v_pay_equity_by_race AS
SELECT 
  root_company_id,
  job_title,
  grade,
  race_ethnicity,
  COUNT(*) AS employee_count,
  AVG(salary) AS avg_salary,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) AS median_salary
FROM public.profiles
WHERE status = 'active' 
  AND employee_number IS NOT NULL
  AND salary IS NOT NULL
  AND race_ethnicity IS NOT NULL
  AND race_ethnicity != 'prefere_nao_informar'
GROUP BY root_company_id, job_title, grade, race_ethnicity;

ALTER VIEW public.v_pay_equity_by_race SET (security_invoker = true);

-- ============= FASE 3.0: EXECUTIVE COMPENSATION =============

CREATE TABLE IF NOT EXISTS public.executive_ltip_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_company_id UUID NOT NULL,
  created_by UUID NOT NULL,
  
  -- Parâmetros do funcionário (opcional)
  employee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  scenario_name TEXT NOT NULL,
  
  -- Tipo de instrumento
  instrument_type TEXT NOT NULL CHECK (instrument_type IN (
    'stock_options','rsu','phantom_shares','partnership','performance_share','phantom','previdencia','bonus_diferido'
  )),
  
  -- Parâmetros base
  grant_value NUMERIC(14,2) NOT NULL,
  current_share_price NUMERIC(12,4),
  exercise_price NUMERIC(12,4),
  num_shares INTEGER,
  
  -- Vesting / cliff / matching
  vesting_years INTEGER NOT NULL DEFAULT 4,
  cliff_months INTEGER NOT NULL DEFAULT 12,
  vesting_type TEXT DEFAULT 'linear' CHECK (vesting_type IN ('linear','progressivo','cliff_only')),
  matching_percentage NUMERIC(5,2) DEFAULT 0,
  employee_contribution_pct NUMERIC(5,2) DEFAULT 0,
  
  -- Projeções
  projected_growth_rate NUMERIC(5,2) DEFAULT 10,
  total_value_at_vest NUMERIC(14,2),
  dilution_percentage NUMERIC(8,4),
  tax_impact_estimated NUMERIC(14,2),
  
  -- Tributação
  tax_treatment TEXT CHECK (tax_treatment IN ('mercantil','remuneratorio','previdenciario')),
  
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exec_ltip_company ON public.executive_ltip_simulations(root_company_id);
CREATE INDEX IF NOT EXISTS idx_exec_ltip_employee ON public.executive_ltip_simulations(employee_id);
CREATE INDEX IF NOT EXISTS idx_exec_ltip_type ON public.executive_ltip_simulations(instrument_type);

ALTER TABLE public.executive_ltip_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin view executive simulations"
  ON public.executive_ltip_simulations FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Admin insert executive simulations"
  ON public.executive_ltip_simulations FOR INSERT
  WITH CHECK (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
    AND created_by = auth.uid()
  );

CREATE POLICY "Admin update executive simulations"
  ON public.executive_ltip_simulations FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Admin delete executive simulations"
  ON public.executive_ltip_simulations FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE TRIGGER trg_exec_ltip_updated_at
  BEFORE UPDATE ON public.executive_ltip_simulations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
