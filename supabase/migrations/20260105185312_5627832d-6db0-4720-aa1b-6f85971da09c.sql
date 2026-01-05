-- ===========================================
-- CORREÇÕES CRÍTICAS DE SEGURANÇA RLS
-- Isolamento Multi-Tenant por root_company_id
-- ===========================================

-- 1. ORGANIZATIONAL_STRUCTURE - Filtrar por empresa
DROP POLICY IF EXISTS "Users can view organizational structure" ON organizational_structure;

CREATE POLICY "Users view own company structure"
ON organizational_structure FOR SELECT
TO authenticated
USING (
  root_company_id = get_user_company_id() 
  OR root_company_id IS NULL 
  OR id = get_user_company_id()
);

-- 2. SALARY_RANGES - Filtrar via salary_tables
DROP POLICY IF EXISTS "Users can view salary ranges" ON salary_ranges;

CREATE POLICY "Users view own company salary ranges"
ON salary_ranges FOR SELECT
TO authenticated
USING (
  salary_table_id IN (
    SELECT id FROM salary_tables 
    WHERE root_company_id = get_user_company_id()
  )
  OR salary_table_id IN (
    SELECT id FROM salary_tables 
    WHERE root_company_id IS NULL
  )
);

-- 3. BUDGET - Filtrar via unit_id
DROP POLICY IF EXISTS "Users can view budget" ON budget;

CREATE POLICY "Users view own company budget"
ON budget FOR SELECT
TO authenticated
USING (
  unit_id IN (
    SELECT id FROM organizational_structure 
    WHERE root_company_id = get_user_company_id()
      OR id = get_user_company_id()
  )
);

-- 4. BUDGET_APPROVERS - Filtrar por usuarios da mesma empresa
DROP POLICY IF EXISTS "Users can view budget approvers" ON budget_approvers;

CREATE POLICY "Users view own company approvers"
ON budget_approvers FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM profiles 
    WHERE root_company_id = get_user_company_id()
  )
);

-- 5. BENEFIT_ELIGIBILITY - Filtrar via benefit_id
DROP POLICY IF EXISTS "Users can view benefit eligibility" ON benefit_eligibility;

CREATE POLICY "Users view own company benefit eligibility"
ON benefit_eligibility FOR SELECT
TO authenticated
USING (
  benefit_id IN (
    SELECT id FROM benefits 
    WHERE root_company_id = get_user_company_id()
  )
);

-- 6. BENEFIT_ELIGIBILITY_RULES - Filtrar via benefit_id
DROP POLICY IF EXISTS "Users can view eligibility rules" ON benefit_eligibility_rules;

CREATE POLICY "Users view own company eligibility rules"
ON benefit_eligibility_rules FOR SELECT
TO authenticated
USING (
  benefit_id IN (
    SELECT id FROM benefits 
    WHERE root_company_id = get_user_company_id()
  )
);

-- 7. INCENTIVE_ELIGIBILITY - Filtrar via program_id
DROP POLICY IF EXISTS "Users can view incentive eligibility" ON incentive_eligibility;

CREATE POLICY "Users view own company incentive eligibility"
ON incentive_eligibility FOR SELECT
TO authenticated
USING (
  program_id IN (
    SELECT id FROM incentive_programs 
    WHERE root_company_id = get_user_company_id()
  )
);

-- 8. JOB_FAMILIES - Adicionar root_company_id e corrigir RLS
ALTER TABLE job_families ADD COLUMN IF NOT EXISTS root_company_id uuid REFERENCES organizational_structure(id);

DROP POLICY IF EXISTS "Users can view job families" ON job_families;

CREATE POLICY "Users view own company job families"
ON job_families FOR SELECT
TO authenticated
USING (
  root_company_id = get_user_company_id() 
  OR root_company_id IS NULL
);

DROP POLICY IF EXISTS "Admins and HR managers can manage job families" ON job_families;

CREATE POLICY "Admins and HR manage own company job families"
ON job_families FOR ALL
TO authenticated
USING (
  (root_company_id = get_user_company_id() OR root_company_id IS NULL)
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
)
WITH CHECK (
  (root_company_id = get_user_company_id() OR root_company_id IS NULL)
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
);