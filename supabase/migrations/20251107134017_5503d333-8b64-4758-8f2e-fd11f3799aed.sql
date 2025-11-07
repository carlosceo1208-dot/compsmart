-- ============================================================================
-- SISTEMA DE ORÇAMENTO BOTTOM-UP (FUNCIONÁRIO POR FUNCIONÁRIO)
-- ============================================================================

-- 1. Criar tabela de projeções de orçamento por funcionário
CREATE TABLE budget_employee_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Funcionário existente OU planejado
  employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_planned_hire BOOLEAN DEFAULT FALSE,
  planned_employee_name TEXT,
  
  fiscal_year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  
  -- Valores projetados
  projected_fixed_salary NUMERIC NOT NULL DEFAULT 0,
  projected_variable_salary NUMERIC NOT NULL DEFAULT 0,
  projected_benefits NUMERIC NOT NULL DEFAULT 0,
  
  -- Tipo de mudança
  change_type TEXT CHECK (change_type IN (
    'merit_increase',
    'collective_bargaining',
    'promotion',
    'planned_termination',
    'planned_hire',
    'transfer_out',
    'transfer_in',
    'adjustment'
  )),
  
  -- Justificativa da mudança
  justification TEXT,
  
  -- Cargo projetado (para promoção ou contratação)
  projected_job_title_id UUID REFERENCES job_titles(id),
  projected_grade TEXT,
  
  -- Unidade projetada (para transferência)
  projected_unit_id UUID REFERENCES organizational_structure(id),
  
  -- Status da projeção
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Índice único: um funcionário pode ter apenas uma projeção por mês/ano
  CONSTRAINT unique_employee_projection UNIQUE (employee_id, fiscal_year, month)
);

-- Índices para performance
CREATE INDEX idx_projections_employee_year ON budget_employee_projections(employee_id, fiscal_year);
CREATE INDEX idx_projections_year_month ON budget_employee_projections(fiscal_year, month);
CREATE INDEX idx_projections_created_by ON budget_employee_projections(created_by);
CREATE INDEX idx_projections_planned_hires ON budget_employee_projections(is_planned_hire) WHERE is_planned_hire = TRUE;

-- Trigger para updated_at
CREATE TRIGGER update_budget_projections_updated_at
  BEFORE UPDATE ON budget_employee_projections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. Criar tabela de submissões de orçamento
CREATE TABLE budget_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES organizational_structure(id),
  fiscal_year INTEGER NOT NULL,
  
  -- Status do orçamento
  status TEXT NOT NULL CHECK (status IN (
    'draft',
    'submitted',
    'approved',
    'rejected'
  )) DEFAULT 'draft',
  
  -- Datas do fluxo
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Responsáveis
  submitted_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  
  -- Comentários
  submission_notes TEXT,
  review_notes TEXT,
  
  -- Justificativa de desbloqueio (Admin)
  unlock_justification TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  unlocked_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Índice único: uma submissão por unidade/ano
  CONSTRAINT unique_unit_submission UNIQUE (unit_id, fiscal_year)
);

-- Índices
CREATE INDEX idx_submissions_status ON budget_submissions(status);
CREATE INDEX idx_submissions_unit_year ON budget_submissions(unit_id, fiscal_year);

-- Trigger para updated_at
CREATE TRIGGER update_budget_submissions_updated_at
  BEFORE UPDATE ON budget_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. Atualizar tabela budget para referenciar submissão
ALTER TABLE budget
  ADD COLUMN IF NOT EXISTS submission_id UUID REFERENCES budget_submissions(id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Habilitar RLS
ALTER TABLE budget_employee_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES PARA budget_employee_projections
-- ============================================================================

-- SELECT: Admin/HR veem tudo, Managers veem suas unidades
CREATE POLICY "View projections policy"
  ON budget_employee_projections FOR SELECT
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    OR (
      has_role(auth.uid(), 'manager'::app_role)
      AND (
        employee_id IN (
          SELECT id FROM profiles 
          WHERE unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
        )
        OR projected_unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
      )
    )
  );

-- INSERT: Admin/HR podem tudo, Managers apenas suas unidades
CREATE POLICY "Insert projections policy"
  ON budget_employee_projections FOR INSERT
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    OR (
      has_role(auth.uid(), 'manager'::app_role)
      AND (
        employee_id IN (
          SELECT id FROM profiles 
          WHERE unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
        )
        OR projected_unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
      )
    )
  );

-- UPDATE: Admin/HR podem tudo, Managers apenas suas unidades
CREATE POLICY "Update projections policy"
  ON budget_employee_projections FOR UPDATE
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    OR (
      has_role(auth.uid(), 'manager'::app_role)
      AND employee_id IN (
        SELECT id FROM profiles 
        WHERE unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
      )
    )
  );

-- DELETE: Apenas Administradores
CREATE POLICY "Delete projections policy"
  ON budget_employee_projections FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- POLICIES PARA budget_submissions
-- ============================================================================

-- SELECT: Managers veem sua unidade, HR/Admin veem tudo
CREATE POLICY "View submissions policy"
  ON budget_submissions FOR SELECT
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    OR (
      has_role(auth.uid(), 'manager'::app_role)
      AND unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
    )
  );

-- INSERT: Managers podem criar para sua unidade, HR/Admin para qualquer
CREATE POLICY "Insert submissions policy"
  ON budget_submissions FOR INSERT
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    OR (
      has_role(auth.uid(), 'manager'::app_role)
      AND unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
    )
  );

-- UPDATE: Managers podem atualizar sua unidade, HR/Admin qualquer
CREATE POLICY "Update submissions policy"
  ON budget_submissions FOR UPDATE
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    OR (
      has_role(auth.uid(), 'manager'::app_role)
      AND unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
    )
  );

-- DELETE: Apenas Admin
CREATE POLICY "Delete submissions policy"
  ON budget_submissions FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));