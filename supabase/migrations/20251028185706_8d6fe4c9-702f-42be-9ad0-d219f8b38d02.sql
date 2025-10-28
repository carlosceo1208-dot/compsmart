-- Tornar job_code opcional em survey_data
ALTER TABLE public.survey_data 
  ALTER COLUMN job_code DROP NOT NULL;

-- Remover constraint única antiga se existir
ALTER TABLE public.survey_data 
  DROP CONSTRAINT IF EXISTS survey_data_survey_table_id_job_code_key;

-- Adicionar índice único para quando TEM código
CREATE UNIQUE INDEX IF NOT EXISTS survey_data_unique_with_code 
  ON public.survey_data (survey_table_id, job_code)
  WHERE job_code IS NOT NULL;

-- Adicionar índice único para quando NÃO TEM código (usar título + grade como identificador)
CREATE UNIQUE INDEX IF NOT EXISTS survey_data_unique_without_code 
  ON public.survey_data (survey_table_id, job_title, grade)
  WHERE job_code IS NULL;