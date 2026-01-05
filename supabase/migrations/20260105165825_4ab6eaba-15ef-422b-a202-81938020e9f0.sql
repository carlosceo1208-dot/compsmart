-- Corrigir vulnerabilidade de segurança RLS na tabela survey_data
-- Remove políticas inseguras e cria novas políticas com isolamento correto

-- Passo 1: Remover políticas existentes inseguras
DROP POLICY IF EXISTS "Users can view survey data" ON survey_data;
DROP POLICY IF EXISTS "Admins and HR managers can manage survey data" ON survey_data;

-- Passo 2: Criar política de leitura segura
-- Permite ver: Templates CompSmart (root_company_id IS NULL) OU dados da própria empresa
CREATE POLICY "View survey data based on table ownership" ON survey_data
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM survey_tables st
    WHERE st.id = survey_data.survey_table_id
    AND (
      st.root_company_id IS NULL
      OR st.root_company_id = get_user_company_id()
    )
  )
);

-- Passo 3: Criar política de gerenciamento segura
-- Super Admin pode editar templates CompSmart
-- Admin/HR podem editar apenas dados da própria empresa
CREATE POLICY "Manage own company survey data" ON survey_data
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM survey_tables st
    WHERE st.id = survey_data.survey_table_id
    AND (
      (st.root_company_id IS NULL AND is_super_admin(auth.uid()))
      OR
      (st.root_company_id = get_user_company_id() 
       AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]))
    )
  )
);