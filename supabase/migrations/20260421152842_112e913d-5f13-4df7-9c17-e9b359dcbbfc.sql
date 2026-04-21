
-- ============= FASE 2.8: TALENT INTELLIGENCE =============

-- Tabela de recomendações de mérito baseadas em 9Box
CREATE TABLE IF NOT EXISTS public.talent_intelligence_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES public.performance_cycles(id) ON DELETE SET NULL,
  root_company_id UUID NOT NULL,
  
  -- Posição 9Box (1-9: 1=baixo/baixo, 9=alto/alto)
  box_position INTEGER CHECK (box_position BETWEEN 1 AND 9),
  performance_score NUMERIC(4,2),
  potential_score NUMERIC(4,2),
  
  -- Recomendações financeiras
  current_salary NUMERIC(12,2),
  recommended_merit_pct NUMERIC(5,2) DEFAULT 0,
  recommended_new_salary NUMERIC(12,2),
  recommended_promotion BOOLEAN DEFAULT false,
  recommended_grade TEXT,
  
  -- Impacto financeiro
  financial_impact_monthly NUMERIC(12,2) DEFAULT 0,
  financial_impact_annual NUMERIC(12,2) DEFAULT 0,
  
  -- Justificativa
  ai_reasoning TEXT,
  manual_override_pct NUMERIC(5,2),
  override_justification TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','applied','rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_talent_intel_employee ON public.talent_intelligence_recommendations(employee_id);
CREATE INDEX IF NOT EXISTS idx_talent_intel_cycle ON public.talent_intelligence_recommendations(cycle_id);
CREATE INDEX IF NOT EXISTS idx_talent_intel_company ON public.talent_intelligence_recommendations(root_company_id);
CREATE INDEX IF NOT EXISTS idx_talent_intel_status ON public.talent_intelligence_recommendations(status);

ALTER TABLE public.talent_intelligence_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/HR view all talent recommendations in company"
  ON public.talent_intelligence_recommendations FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'hr_manager'::app_role) OR
    employee_id = auth.uid()
  );

CREATE POLICY "Admin/HR insert talent recommendations"
  ON public.talent_intelligence_recommendations FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'hr_manager'::app_role)
  );

CREATE POLICY "Admin/HR update talent recommendations"
  ON public.talent_intelligence_recommendations FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'hr_manager'::app_role)
  );

CREATE POLICY "Admin delete talent recommendations"
  ON public.talent_intelligence_recommendations FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE TRIGGER trg_talent_intel_updated_at
  BEFORE UPDATE ON public.talent_intelligence_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função: calcula % mérito recomendado por 9Box
CREATE OR REPLACE FUNCTION public.calculate_merit_by_9box(p_box_position INTEGER)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- 9Box matrix: 9=star, 7-8=high, 5-6=core, 3-4=develop, 1-2=action
  RETURN CASE p_box_position
    WHEN 9 THEN 15.0  -- Star talent
    WHEN 8 THEN 12.0  -- High potential
    WHEN 7 THEN 10.0  -- Strong contributor
    WHEN 6 THEN 7.0   -- Solid performer
    WHEN 5 THEN 5.0   -- Core
    WHEN 4 THEN 4.0   -- Inconsistent
    WHEN 3 THEN 2.0   -- Effective
    WHEN 2 THEN 1.0   -- Underperformer
    WHEN 1 THEN 0.0   -- Action needed
    ELSE 3.0          -- default
  END;
END;
$$;

-- Função: calcula posição 9Box (1-9) a partir de scores
CREATE OR REPLACE FUNCTION public.calculate_9box_position(
  p_performance NUMERIC,
  p_potential NUMERIC
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_perf_band INTEGER;
  v_pot_band INTEGER;
BEGIN
  -- Bands: 1=baixo (<3), 2=médio (3-4), 3=alto (>=4)
  v_perf_band := CASE 
    WHEN p_performance >= 4 THEN 3
    WHEN p_performance >= 3 THEN 2
    ELSE 1
  END;
  v_pot_band := CASE 
    WHEN p_potential >= 4 THEN 3
    WHEN p_potential >= 3 THEN 2
    ELSE 1
  END;
  -- Box position: (potential-1)*3 + performance
  RETURN (v_pot_band - 1) * 3 + v_perf_band;
END;
$$;

-- View dashboard Talent Intelligence
CREATE OR REPLACE VIEW public.v_talent_intelligence_dashboard AS
SELECT 
  p.id AS employee_id,
  p.full_name,
  p.job_title,
  p.grade,
  p.salary AS current_salary,
  p.unit_id,
  p.root_company_id,
  pe.id AS evaluation_id,
  pe.cycle_id,
  pe.final_score AS performance_score,
  pe.potential_score,
  public.calculate_9box_position(pe.final_score, pe.potential_score) AS box_position,
  public.calculate_merit_by_9box(
    public.calculate_9box_position(pe.final_score, pe.potential_score)
  ) AS suggested_merit_pct,
  tir.id AS recommendation_id,
  tir.status AS recommendation_status,
  tir.recommended_merit_pct,
  tir.recommended_new_salary,
  tir.financial_impact_annual
FROM public.profiles p
LEFT JOIN public.performance_evaluations pe ON pe.employee_id = p.id
LEFT JOIN public.talent_intelligence_recommendations tir 
  ON tir.employee_id = p.id AND tir.cycle_id = pe.cycle_id
WHERE p.status = 'active' AND p.employee_number IS NOT NULL;
