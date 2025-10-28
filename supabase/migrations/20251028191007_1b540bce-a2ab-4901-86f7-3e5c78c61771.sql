-- Remover índices parciais que causam problema no upsert
DROP INDEX IF EXISTS public.survey_data_unique_with_code;
DROP INDEX IF EXISTS public.survey_data_unique_without_code;

-- Criar constraint única tradicional APENAS para quando TEM código
-- (PostgreSQL permite múltiplos NULL em unique constraints por padrão)
ALTER TABLE public.survey_data
  ADD CONSTRAINT survey_data_survey_table_id_job_code_key 
  UNIQUE (survey_table_id, job_code);

-- Criar índice não-único para performance em buscas SEM código
-- (não é constraint, apenas otimização)
CREATE INDEX IF NOT EXISTS survey_data_lookup_without_code
  ON public.survey_data (survey_table_id, job_title, grade)
  WHERE job_code IS NULL;