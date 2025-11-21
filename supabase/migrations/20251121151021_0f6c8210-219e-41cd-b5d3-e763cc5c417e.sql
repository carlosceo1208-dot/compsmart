-- FASE 1: Sistema de Elegibilidade de Benefícios por Grade e Faixa Salarial

-- 1.1 Adicionar colunas de elegibilidade à tabela benefits
ALTER TABLE benefits 
ADD COLUMN IF NOT EXISTS eligibility_type TEXT CHECK (eligibility_type IN ('grade', 'salary_range', 'none')) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS template_type TEXT CHECK (template_type IN ('transportation', 'private_pension', 'custom')) DEFAULT 'custom';

-- 1.2 Criar tabela de regras de elegibilidade (substitui benefit_eligibility)
CREATE TABLE IF NOT EXISTS benefit_eligibility_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benefit_id UUID NOT NULL REFERENCES benefits(id) ON DELETE CASCADE,
  
  -- Para elegibilidade por GRADE
  grade_min TEXT,
  grade_max TEXT,
  
  -- Para elegibilidade por SALÁRIO
  salary_min NUMERIC,
  salary_max NUMERIC,
  
  -- Valores específicos desta regra
  company_contribution_value NUMERIC NOT NULL,
  employee_contribution_type TEXT CHECK (employee_contribution_type IN ('none', 'fixed', 'percentage')) DEFAULT 'none',
  employee_contribution_value NUMERIC DEFAULT 0,
  
  -- Metadados
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validação: deve ter OU grade OU salary, não ambos vazios
  CONSTRAINT must_have_eligibility CHECK (
    (grade_min IS NOT NULL AND grade_max IS NOT NULL) OR 
    (salary_min IS NOT NULL AND salary_max IS NOT NULL)
  )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_eligibility_benefit ON benefit_eligibility_rules(benefit_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_grade ON benefit_eligibility_rules(grade_min, grade_max);
CREATE INDEX IF NOT EXISTS idx_eligibility_salary ON benefit_eligibility_rules(salary_min, salary_max);

-- RLS para benefit_eligibility_rules
ALTER TABLE benefit_eligibility_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and HR can manage eligibility rules" ON benefit_eligibility_rules
  FOR ALL USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Users can view eligibility rules" ON benefit_eligibility_rules
  FOR SELECT USING (true);

-- 1.3 Adicionar referência à regra de elegibilidade em employee_benefits
ALTER TABLE employee_benefits
ADD COLUMN IF NOT EXISTS eligibility_rule_id UUID REFERENCES benefit_eligibility_rules(id);

-- 1.4 Função para verificar elegibilidade de um funcionário
CREATE OR REPLACE FUNCTION check_employee_eligibility(
  p_employee_id UUID,
  p_benefit_id UUID
)
RETURNS TABLE(
  rule_id UUID,
  is_eligible BOOLEAN,
  company_value NUMERIC,
  employee_contribution_type TEXT,
  employee_contribution_value NUMERIC,
  description TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_grade TEXT;
  v_employee_salary NUMERIC;
  v_eligibility_type TEXT;
BEGIN
  -- Buscar dados do funcionário
  SELECT grade, salary 
  INTO v_employee_grade, v_employee_salary
  FROM profiles
  WHERE id = p_employee_id;
  
  -- Buscar tipo de elegibilidade do benefício
  SELECT eligibility_type
  INTO v_eligibility_type
  FROM benefits
  WHERE id = p_benefit_id;
  
  -- Se não tem elegibilidade definida, todos são elegíveis
  IF v_eligibility_type = 'none' THEN
    RETURN QUERY
    SELECT 
      NULL::UUID,
      TRUE,
      b.value_per_employee,
      b.default_employee_contribution_type,
      b.default_employee_contribution_value,
      'Sem restrição de elegibilidade'::TEXT
    FROM benefits b
    WHERE b.id = p_benefit_id;
    RETURN;
  END IF;
  
  -- Elegibilidade por GRADE
  IF v_eligibility_type = 'grade' THEN
    RETURN QUERY
    SELECT 
      ber.id,
      TRUE,
      ber.company_contribution_value,
      ber.employee_contribution_type,
      ber.employee_contribution_value,
      ber.description
    FROM benefit_eligibility_rules ber
    WHERE ber.benefit_id = p_benefit_id
      AND ber.is_active = TRUE
      AND v_employee_grade BETWEEN ber.grade_min AND ber.grade_max
    LIMIT 1;
  END IF;
  
  -- Elegibilidade por SALÁRIO
  IF v_eligibility_type = 'salary_range' THEN
    RETURN QUERY
    SELECT 
      ber.id,
      TRUE,
      ber.company_contribution_value,
      ber.employee_contribution_type,
      ber.employee_contribution_value,
      ber.description
    FROM benefit_eligibility_rules ber
    WHERE ber.benefit_id = p_benefit_id
      AND ber.is_active = TRUE
      AND v_employee_salary BETWEEN ber.salary_min AND ber.salary_max
    LIMIT 1;
  END IF;
  
  -- Se chegou aqui, não é elegível
  RETURN;
END;
$$;

-- 1.5 Função para calcular Vale Transporte com limite de 6%
CREATE OR REPLACE FUNCTION calculate_transportation_benefit(
  p_employee_id UUID,
  p_monthly_cost NUMERIC
)
RETURNS TABLE(
  employee_discount NUMERIC,
  company_subsidy NUMERIC,
  total_cost NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_salary NUMERIC;
  v_max_discount NUMERIC;
BEGIN
  -- Buscar salário do funcionário
  SELECT salary INTO v_salary
  FROM profiles
  WHERE id = p_employee_id;
  
  -- Calcular desconto máximo (6% do salário)
  v_max_discount := v_salary * 0.06;
  
  -- Se custo é menor que 6%, funcionário paga tudo
  IF p_monthly_cost <= v_max_discount THEN
    RETURN QUERY SELECT p_monthly_cost, 0::NUMERIC, p_monthly_cost;
  -- Se custo é maior, funcionário paga 6% e empresa subsidia diferença
  ELSE
    RETURN QUERY SELECT v_max_discount, p_monthly_cost - v_max_discount, p_monthly_cost;
  END IF;
END;
$$;

-- 1.6 View de relatório consolidado de elegibilidade
CREATE OR REPLACE VIEW v_benefit_eligibility_report AS
SELECT 
  b.id as benefit_id,
  b.name as benefit_name,
  b.eligibility_type,
  ber.id as rule_id,
  ber.grade_min,
  ber.grade_max,
  ber.salary_min,
  ber.salary_max,
  ber.company_contribution_value,
  ber.employee_contribution_type,
  ber.employee_contribution_value,
  ber.description,
  COUNT(DISTINCT CASE 
    WHEN b.eligibility_type = 'grade' AND p.grade BETWEEN ber.grade_min AND ber.grade_max THEN p.id
    WHEN b.eligibility_type = 'salary_range' AND p.salary BETWEEN ber.salary_min AND ber.salary_max THEN p.id
    WHEN b.eligibility_type = 'none' THEN p.id
  END) as eligible_employees_count,
  SUM(CASE 
    WHEN b.eligibility_type = 'grade' AND p.grade BETWEEN ber.grade_min AND ber.grade_max THEN ber.company_contribution_value
    WHEN b.eligibility_type = 'salary_range' AND p.salary BETWEEN ber.salary_min AND ber.salary_max THEN ber.company_contribution_value
    WHEN b.eligibility_type = 'none' THEN b.value_per_employee
  END) as total_projected_cost
FROM benefits b
LEFT JOIN benefit_eligibility_rules ber ON b.id = ber.benefit_id
CROSS JOIN profiles p
WHERE p.status = 'active' AND b.is_active = true
GROUP BY b.id, b.name, b.eligibility_type, ber.id, ber.grade_min, ber.grade_max, 
         ber.salary_min, ber.salary_max, ber.company_contribution_value, 
         ber.employee_contribution_type, ber.employee_contribution_value, ber.description;

-- 1.7 Inserir benefícios template
INSERT INTO benefits (
  name,
  description,
  benefit_type,
  value_per_employee,
  default_employee_contribution_type,
  default_employee_contribution_value,
  eligibility_type,
  is_template,
  template_type,
  is_active
) VALUES 
(
  'Vale Transporte',
  'Benefício de vale transporte com desconto limitado a 6% do salário fixo conforme legislação CLT. Empresa subsidia o excedente.',
  'transportation',
  0,
  'percentage',
  6.0,
  'none',
  TRUE,
  'transportation',
  TRUE
),
(
  'Previdência Privada',
  'Plano de previdência complementar com regras especiais de elegibilidade e contrapartida da empresa.',
  'other',
  0,
  'percentage',
  0,
  'grade',
  TRUE,
  'private_pension',
  TRUE
)
ON CONFLICT DO NOTHING;