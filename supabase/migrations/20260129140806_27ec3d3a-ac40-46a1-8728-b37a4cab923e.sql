-- =============================================
-- MODALIDADES SALARIAIS: Fixed, Total Cash, Total Compensation
-- =============================================

-- 1. Criar enum para modalidade de remuneração
CREATE TYPE salary_modality AS ENUM ('fixed_salary', 'total_cash', 'total_compensation');

-- 2. Adicionar coluna de modalidade na tabela salary_tables
ALTER TABLE public.salary_tables
ADD COLUMN modality salary_modality NOT NULL DEFAULT 'fixed_salary';

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.salary_tables.modality IS 
'Modalidade da tabela: fixed_salary (Salário Fixo), total_cash (Total Cash = Fixo + Variável), total_compensation (Total Compensation = Total Cash + Benefícios + ILP)';

-- 3. Adicionar coluna de modalidade na tabela survey_tables
ALTER TABLE public.survey_tables
ADD COLUMN modality salary_modality NOT NULL DEFAULT 'fixed_salary';

COMMENT ON COLUMN public.survey_tables.modality IS 
'Modalidade da pesquisa: fixed_salary (Salário Fixo), total_cash (Total Cash = Fixo + Variável), total_compensation (Total Compensation = Total Cash + Benefícios + ILP)';

-- 4. Criar índices para otimizar consultas filtradas por modalidade
CREATE INDEX idx_salary_tables_modality ON public.salary_tables (modality);
CREATE INDEX idx_survey_tables_modality ON public.survey_tables (modality);