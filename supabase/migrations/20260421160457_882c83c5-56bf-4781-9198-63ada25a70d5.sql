
-- ============================================================
-- CENÁRIOS WHAT-IF DE DECISÃO INTEGRADA
-- ============================================================

CREATE TABLE IF NOT EXISTS public.decision_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_company_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  scenario_name TEXT NOT NULL,
  description TEXT,
  strategy TEXT NOT NULL DEFAULT 'balanced' CHECK (strategy IN ('conservative','balanced','aggressive','top_performers_only','custom')),
  multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  filter_box_min INTEGER,
  filter_box_max INTEGER,
  filter_unit_ids UUID[],
  total_headcount INTEGER DEFAULT 0,
  total_annual_impact NUMERIC(14,2) DEFAULT 0,
  high_performers_retained INTEGER DEFAULT 0,
  low_performers_included INTEGER DEFAULT 0,
  payroll_increase_pct NUMERIC(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decision_scenarios_company ON public.decision_scenarios(root_company_id, fiscal_year, is_active);

ALTER TABLE public.decision_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/HR manage scenarios"
ON public.decision_scenarios FOR ALL
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role]))
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role]));

CREATE POLICY "Authenticated view scenarios in their company"
ON public.decision_scenarios FOR SELECT
USING (root_company_id = (SELECT root_company_id FROM profiles WHERE id = auth.uid()));

CREATE TRIGGER trg_decision_scenarios_updated
BEFORE UPDATE ON public.decision_scenarios
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Items por colaborador no cenário
CREATE TABLE IF NOT EXISTS public.decision_scenario_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES public.decision_scenarios(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  unit_id UUID,
  box_position INTEGER,
  current_salary NUMERIC(12,2),
  suggested_merit_pct NUMERIC(5,2),
  scenario_merit_pct NUMERIC(5,2),
  monthly_impact NUMERIC(12,2),
  annual_impact NUMERIC(14,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scenario_items_scenario ON public.decision_scenario_items(scenario_id);

ALTER TABLE public.decision_scenario_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View items via scenario access"
ON public.decision_scenario_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.decision_scenarios s
  WHERE s.id = decision_scenario_items.scenario_id
    AND s.root_company_id = (SELECT root_company_id FROM profiles WHERE id = auth.uid())
));

CREATE POLICY "Admin/HR manage items"
ON public.decision_scenario_items FOR ALL
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role]))
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role]));

-- Snapshots finais de ciclo (auditoria)
CREATE TABLE IF NOT EXISTS public.cycle_decision_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_company_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  cycle_name TEXT NOT NULL,
  chosen_scenario_id UUID REFERENCES public.decision_scenarios(id),
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_by UUID REFERENCES auth.users(id),
  snapshot_data JSONB NOT NULL,
  executive_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cycle_decision_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view snapshots in their company"
ON public.cycle_decision_snapshots FOR SELECT
USING (root_company_id = (SELECT root_company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admin lock snapshots"
ON public.cycle_decision_snapshots FOR INSERT
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role]));

-- RPC: constrói cenário a partir de recomendações 9Box vigentes
CREATE OR REPLACE FUNCTION public.build_scenario_from_9box(
  p_root_company_id UUID,
  p_fiscal_year INTEGER,
  p_scenario_name TEXT,
  p_strategy TEXT DEFAULT 'balanced',
  p_multiplier NUMERIC DEFAULT 1.0,
  p_filter_box_min INTEGER DEFAULT NULL,
  p_filter_box_max INTEGER DEFAULT NULL,
  p_filter_unit_ids UUID[] DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_payroll NUMERIC;
BEGIN
  IF NOT has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role]) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  INSERT INTO public.decision_scenarios(
    root_company_id, fiscal_year, scenario_name, strategy, multiplier,
    filter_box_min, filter_box_max, filter_unit_ids, created_by
  ) VALUES (
    p_root_company_id, p_fiscal_year, p_scenario_name, p_strategy, p_multiplier,
    p_filter_box_min, p_filter_box_max, p_filter_unit_ids, auth.uid()
  ) RETURNING id INTO v_id;

  INSERT INTO public.decision_scenario_items(
    scenario_id, employee_id, unit_id, box_position, current_salary,
    suggested_merit_pct, scenario_merit_pct, monthly_impact, annual_impact
  )
  SELECT
    v_id, r.employee_id, p.unit_id, r.box_position, r.current_salary,
    r.recommended_merit_pct,
    ROUND((r.recommended_merit_pct * p_multiplier)::NUMERIC, 2),
    ROUND((r.current_salary * (r.recommended_merit_pct * p_multiplier) / 100)::NUMERIC, 2),
    ROUND((r.current_salary * (r.recommended_merit_pct * p_multiplier) / 100 * 13.33)::NUMERIC, 2)
  FROM public.talent_intelligence_recommendations r
  JOIN public.profiles p ON p.id = r.employee_id
  WHERE r.root_company_id = p_root_company_id
    AND r.status IN ('draft','submitted','pending','approved')
    AND (p_filter_box_min IS NULL OR r.box_position >= p_filter_box_min)
    AND (p_filter_box_max IS NULL OR r.box_position <= p_filter_box_max)
    AND (p_filter_unit_ids IS NULL OR p.unit_id = ANY(p_filter_unit_ids));

  SELECT COALESCE(SUM(current_salary), 0) * 12 INTO v_payroll FROM public.profiles
  WHERE root_company_id = p_root_company_id AND status = 'active';

  UPDATE public.decision_scenarios SET
    total_headcount = (SELECT COUNT(*) FROM public.decision_scenario_items WHERE scenario_id = v_id),
    total_annual_impact = (SELECT COALESCE(SUM(annual_impact),0) FROM public.decision_scenario_items WHERE scenario_id = v_id),
    high_performers_retained = (SELECT COUNT(*) FROM public.decision_scenario_items WHERE scenario_id = v_id AND box_position >= 7),
    low_performers_included = (SELECT COUNT(*) FROM public.decision_scenario_items WHERE scenario_id = v_id AND box_position <= 3),
    payroll_increase_pct = CASE WHEN v_payroll > 0
      THEN ROUND(((SELECT COALESCE(SUM(annual_impact),0) FROM public.decision_scenario_items WHERE scenario_id = v_id) / v_payroll) * 100, 2)
      ELSE 0 END
  WHERE id = v_id;

  RETURN v_id;
END;
$$;

-- RPC: comparação lado-a-lado de cenários
CREATE OR REPLACE FUNCTION public.compare_scenarios(p_scenario_ids UUID[])
RETURNS TABLE(
  scenario_id UUID,
  scenario_name TEXT,
  strategy TEXT,
  multiplier NUMERIC,
  total_headcount INTEGER,
  total_annual_impact NUMERIC,
  high_performers_retained INTEGER,
  low_performers_included INTEGER,
  payroll_increase_pct NUMERIC,
  avg_merit_pct NUMERIC
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.scenario_name,
    s.strategy,
    s.multiplier,
    s.total_headcount,
    s.total_annual_impact,
    s.high_performers_retained,
    s.low_performers_included,
    s.payroll_increase_pct,
    ROUND(AVG(i.scenario_merit_pct)::NUMERIC, 2)
  FROM public.decision_scenarios s
  LEFT JOIN public.decision_scenario_items i ON i.scenario_id = s.id
  WHERE s.id = ANY(p_scenario_ids)
  GROUP BY s.id, s.scenario_name, s.strategy, s.multiplier, s.total_headcount,
           s.total_annual_impact, s.high_performers_retained, s.low_performers_included, s.payroll_increase_pct
  ORDER BY s.total_annual_impact ASC;
END;
$$;

-- RPC: congelar decisão do ciclo
CREATE OR REPLACE FUNCTION public.snapshot_cycle_decision(
  p_root_company_id UUID,
  p_fiscal_year INTEGER,
  p_cycle_name TEXT,
  p_scenario_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_data JSONB;
BEGIN
  IF NOT has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role]) THEN
    RAISE EXCEPTION 'Somente admin pode congelar decisão de ciclo';
  END IF;

  SELECT jsonb_build_object(
    'scenario', to_jsonb(s),
    'items', (SELECT jsonb_agg(to_jsonb(i)) FROM public.decision_scenario_items i WHERE i.scenario_id = s.id)
  ) INTO v_data
  FROM public.decision_scenarios s WHERE s.id = p_scenario_id;

  INSERT INTO public.cycle_decision_snapshots(
    root_company_id, fiscal_year, cycle_name, chosen_scenario_id,
    locked_by, snapshot_data, executive_notes
  ) VALUES (
    p_root_company_id, p_fiscal_year, p_cycle_name, p_scenario_id,
    auth.uid(), v_data, p_notes
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
