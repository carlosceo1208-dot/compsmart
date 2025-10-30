-- Adicionar novos campos à tabela job_titles
ALTER TABLE public.job_titles
ADD COLUMN IF NOT EXISTS job_family TEXT NOT NULL DEFAULT 'Profissionais',
ADD COLUMN IF NOT EXISTS cbo VARCHAR(7) NOT NULL DEFAULT '0000-00',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS main_responsibilities TEXT,
ADD COLUMN IF NOT EXISTS key_factors TEXT,
ADD COLUMN IF NOT EXISTS job_impact TEXT,
ADD COLUMN IF NOT EXISTS soft_skills TEXT,
ADD COLUMN IF NOT EXISTS hard_skills TEXT,
ADD COLUMN IF NOT EXISTS required_experience TEXT,
ADD COLUMN IF NOT EXISTS required_education TEXT,
ADD COLUMN IF NOT EXISTS salary_range_id UUID REFERENCES public.salary_ranges(id);

-- Remover defaults temporários após adicionar colunas
ALTER TABLE public.job_titles
ALTER COLUMN job_family DROP DEFAULT,
ALTER COLUMN cbo DROP DEFAULT;

-- Adicionar constraint para validar família de cargos
ALTER TABLE public.job_titles
DROP CONSTRAINT IF EXISTS check_job_family;

ALTER TABLE public.job_titles
ADD CONSTRAINT check_job_family CHECK (job_family IN (
  'Analistas', 
  'Profissionais', 
  'Consultores', 
  'Especialistas', 
  'Coordenadores', 
  'Supervisores', 
  'Gerentes', 
  'Executivos - Diretores', 
  'Lideres-Projetos'
));

-- Constraint para validar formato do CBO (XXXX-XX)
ALTER TABLE public.job_titles
DROP CONSTRAINT IF EXISTS check_cbo_format;

ALTER TABLE public.job_titles
ADD CONSTRAINT check_cbo_format CHECK (cbo ~ '^\d{4}-\d{2}$');

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_job_titles_family ON public.job_titles(job_family);
CREATE INDEX IF NOT EXISTS idx_job_titles_active ON public.job_titles(is_active);
CREATE INDEX IF NOT EXISTS idx_job_titles_cbo ON public.job_titles(cbo);
CREATE INDEX IF NOT EXISTS idx_job_titles_grade_active ON public.job_titles(grade, is_active);

-- Função para atualizar salary_range_id automaticamente com base no grade
CREATE OR REPLACE FUNCTION public.update_job_title_salary_range()
RETURNS TRIGGER AS $$
BEGIN
  -- Buscar a salary_range ativa correspondente ao grade
  SELECT id INTO NEW.salary_range_id
  FROM public.salary_ranges sr
  JOIN public.salary_tables st ON sr.salary_table_id = st.id
  WHERE sr.grade = NEW.grade
    AND st.is_active = true
  LIMIT 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para vincular faixa salarial automaticamente
DROP TRIGGER IF EXISTS set_job_title_salary_range ON public.job_titles;

CREATE TRIGGER set_job_title_salary_range
BEFORE INSERT OR UPDATE ON public.job_titles
FOR EACH ROW
EXECUTE FUNCTION public.update_job_title_salary_range();

-- Comentários para documentação
COMMENT ON COLUMN public.job_titles.salary_range_id IS 'Vincula automaticamente à faixa salarial baseada no grade';
COMMENT ON COLUMN public.job_titles.job_family IS 'Família do cargo (Analistas, Profissionais, etc.)';
COMMENT ON COLUMN public.job_titles.cbo IS 'Código Brasileiro de Ocupações no formato XXXX-XX';
COMMENT ON COLUMN public.job_titles.is_active IS 'Indica se o cargo está ativo no sistema';