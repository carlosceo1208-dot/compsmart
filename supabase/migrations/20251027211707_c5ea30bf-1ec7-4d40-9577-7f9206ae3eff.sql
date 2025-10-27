-- Migration: comprehensive_hr_system_refactoring
-- Sistema de Labels Configuráveis
CREATE TABLE system_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  default_label TEXT NOT NULL,
  custom_label TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_system_labels_updated_at
  BEFORE UPDATE ON system_labels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE system_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view labels"
ON system_labels FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage labels"
ON system_labels FOR ALL
USING (has_role(auth.uid(), 'admin'));

INSERT INTO system_labels (key, default_label, description) VALUES
('grade', 'Grade', 'Nomenclatura para níveis hierárquicos (Grade ou Nível)'),
('salary', 'Salário', 'Nomenclatura para remuneração'),
('unit', 'Unidade', 'Nomenclatura para unidades organizacionais'),
('job_title', 'Cargo', 'Nomenclatura para cargos/funções'),
('employee', 'Funcionário', 'Nomenclatura para colaboradores'),
('manager', 'Gestor', 'Nomenclatura para gestores'),
('salary_range', 'Faixa Salarial', 'Nomenclatura para faixas de remuneração');

-- Tabela Salarial com Dual Mode
CREATE TYPE calculation_mode AS ENUM ('manual', 'automatic');

CREATE TABLE salary_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade TEXT NOT NULL UNIQUE,
  calculation_mode calculation_mode NOT NULL DEFAULT 'manual',
  min_value NUMERIC(12,2) NOT NULL,
  q1_value NUMERIC(12,2) NOT NULL,
  median_value NUMERIC(12,2) NOT NULL,
  q3_value NUMERIC(12,2) NOT NULL,
  max_value NUMERIC(12,2) NOT NULL,
  input_median NUMERIC(12,2),
  input_amplitude NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_range_order CHECK (
    min_value <= q1_value 
    AND q1_value <= median_value 
    AND median_value <= q3_value 
    AND q3_value <= max_value
  ),
  CONSTRAINT valid_amplitude CHECK (
    input_amplitude IS NULL OR (input_amplitude > 0 AND input_amplitude <= 100)
  )
);

CREATE INDEX idx_salary_ranges_grade ON salary_ranges(grade);

CREATE TRIGGER update_salary_ranges_updated_at
  BEFORE UPDATE ON salary_ranges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE salary_ranges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view salary ranges"
ON salary_ranges FOR SELECT
USING (true);

CREATE POLICY "Admins and HR managers can manage salary ranges"
ON salary_ranges FOR ALL
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- Função para calcular faixa salarial automaticamente
CREATE OR REPLACE FUNCTION calculate_salary_range(
  p_median NUMERIC,
  p_amplitude NUMERIC
)
RETURNS TABLE(
  min_value NUMERIC,
  q1_value NUMERIC,
  median_value NUMERIC,
  q3_value NUMERIC,
  max_value NUMERIC
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_spread NUMERIC;
  v_range NUMERIC;
BEGIN
  v_spread := p_amplitude / 2;
  min_value := p_median * (1 - v_spread/100);
  max_value := p_median * (1 + v_spread/100);
  median_value := p_median;
  v_range := max_value - min_value;
  q1_value := min_value + (v_range * 0.25);
  q3_value := min_value + (v_range * 0.75);
  RETURN NEXT;
END;
$$;

-- Sistema de Competências
CREATE TABLE competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('hard_skill', 'soft_skill')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_competencies_type ON competencies(type);
CREATE INDEX idx_competencies_name ON competencies(name);

CREATE TRIGGER update_competencies_updated_at
  BEFORE UPDATE ON competencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TYPE proficiency_level AS ENUM ('basic', 'intermediate', 'advanced', 'expert');

CREATE TABLE job_title_competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title_id UUID NOT NULL REFERENCES job_titles(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
  required_level proficiency_level NOT NULL DEFAULT 'intermediate',
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_title_id, competency_id)
);

CREATE INDEX idx_job_title_competencies_job_title ON job_title_competencies(job_title_id);
CREATE INDEX idx_job_title_competencies_competency ON job_title_competencies(competency_id);

CREATE TRIGGER update_job_title_competencies_updated_at
  BEFORE UPDATE ON job_title_competencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_title_competencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all competencies"
ON competencies FOR SELECT
USING (true);

CREATE POLICY "Admins and HR managers can manage competencies"
ON competencies FOR ALL
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Users can view job title competencies"
ON job_title_competencies FOR SELECT
USING (true);

CREATE POLICY "Admins and HR managers can manage job competencies"
ON job_title_competencies FOR ALL
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- Separação Employees vs Access Control
ALTER TABLE profiles ADD COLUMN has_system_access BOOLEAN DEFAULT false;

UPDATE profiles 
SET has_system_access = true
WHERE id IN (SELECT DISTINCT user_id FROM user_roles);

-- Criar trigger para validar que usuários não podem modificar campos sensíveis
CREATE OR REPLACE FUNCTION validate_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se é admin ou HR, permite tudo
  IF has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]) THEN
    RETURN NEW;
  END IF;
  
  -- Se não é o próprio usuário, bloqueia
  IF auth.uid() != NEW.id THEN
    RAISE EXCEPTION 'Você não tem permissão para modificar este perfil';
  END IF;
  
  -- Se é o próprio usuário, verifica se está tentando modificar campos sensíveis
  IF OLD.salary IS DISTINCT FROM NEW.salary OR
     OLD.variable_salary IS DISTINCT FROM NEW.variable_salary OR
     OLD.salary_range_percentage IS DISTINCT FROM NEW.salary_range_percentage OR
     OLD.grade IS DISTINCT FROM NEW.grade OR
     OLD.job_title_id IS DISTINCT FROM NEW.job_title_id OR
     OLD.unit_id IS DISTINCT FROM NEW.unit_id OR
     OLD.manager_id IS DISTINCT FROM NEW.manager_id OR
     OLD.has_system_access IS DISTINCT FROM NEW.has_system_access THEN
    RAISE EXCEPTION 'Você não pode modificar campos sensíveis como salário, cargo ou unidade';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_profile_update_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_profile_update();