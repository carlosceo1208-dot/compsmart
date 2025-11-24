-- Adicionar campos para ILP e subtypes na tabela incentive_programs
ALTER TABLE incentive_programs 
ADD COLUMN IF NOT EXISTS subtype TEXT CHECK (subtype IN ('plr', 'ppr', 'bonus', 'commission', 'sop', 'rsu', 'partnership', 'phantom', 'deferred', 'pension')),
ADD COLUMN IF NOT EXISTS vesting_months INTEGER,
ADD COLUMN IF NOT EXISTS cliff_months INTEGER,
ADD COLUMN IF NOT EXISTS matching_percentage NUMERIC(5,2);

-- Criar tabela de atribuições de incentivos a funcionários
CREATE TABLE IF NOT EXISTS employee_incentive_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  program_id UUID REFERENCES incentive_programs(id) ON DELETE CASCADE NOT NULL,
  target_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_value NUMERIC(12,2) DEFAULT 0,
  vesting_start_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, program_id)
);

-- Habilitar RLS
ALTER TABLE employee_incentive_assignments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para employee_incentive_assignments
CREATE POLICY "Admins and HR manage incentive assignments"
ON employee_incentive_assignments
FOR ALL
USING (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = employee_incentive_assignments.employee_id 
    AND profiles.root_company_id = get_user_company_id()
  )
);

CREATE POLICY "Users view own incentive assignments"
ON employee_incentive_assignments
FOR SELECT
USING (
  employee_id = auth.uid()
);

-- Trigger para updated_at
CREATE TRIGGER update_employee_incentive_assignments_updated_at
BEFORE UPDATE ON employee_incentive_assignments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();