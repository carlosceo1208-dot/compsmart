-- Tabela para ajustes coletivos de salário
CREATE TABLE public.collective_salary_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year INTEGER NOT NULL,
  effective_month INTEGER NOT NULL CHECK (effective_month >= 1 AND effective_month <= 12),
  adjustment_name TEXT NOT NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('fixed_percentage', 'scaled')),
  
  -- Para percentual fixo
  fixed_percentage NUMERIC,
  
  -- Para escalonado (JSON com faixas)
  scaled_rules JSONB DEFAULT '[]'::jsonb,
  
  -- Filtros aplicados
  filter_unit_id UUID REFERENCES organizational_structure(id),
  filter_grades TEXT[],
  filter_salary_min NUMERIC,
  filter_salary_max NUMERIC,
  
  -- Resultados calculados
  total_employees_affected INTEGER DEFAULT 0,
  total_monthly_cost NUMERIC DEFAULT 0,
  total_annual_cost NUMERIC DEFAULT 0,
  
  -- Status do ajuste
  status TEXT NOT NULL DEFAULT 'simulation' CHECK (status IN ('simulation', 'approved_budget', 'effectuated')),
  effectuated_at TIMESTAMPTZ,
  effectuated_by UUID REFERENCES profiles(id),
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,
  root_company_id UUID NOT NULL REFERENCES organizational_structure(id),
  
  CONSTRAINT valid_fixed_percentage CHECK (
    adjustment_type != 'fixed_percentage' OR fixed_percentage IS NOT NULL
  ),
  CONSTRAINT valid_scaled_rules CHECK (
    adjustment_type != 'scaled' OR jsonb_array_length(scaled_rules) > 0
  )
);

-- Índices
CREATE INDEX idx_collective_adjustments_company ON collective_salary_adjustments(root_company_id);
CREATE INDEX idx_collective_adjustments_status ON collective_salary_adjustments(status);
CREATE INDEX idx_collective_adjustments_fiscal_year ON collective_salary_adjustments(fiscal_year);

-- RLS
ALTER TABLE collective_salary_adjustments ENABLE ROW LEVEL SECURITY;

-- Política de visualização
CREATE POLICY "Users can view own company adjustments"
ON collective_salary_adjustments FOR SELECT
USING (root_company_id = get_user_company_id());

-- Política de gerenciamento (apenas Admin e HR)
CREATE POLICY "Admins and HR can manage adjustments"
ON collective_salary_adjustments FOR ALL
USING (
  root_company_id = get_user_company_id() 
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
);

-- Trigger para updated_at
CREATE TRIGGER update_collective_adjustments_updated_at
BEFORE UPDATE ON collective_salary_adjustments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();