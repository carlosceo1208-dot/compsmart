-- Add new compensation and performance fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN job_title TEXT,
ADD COLUMN grade TEXT,
ADD COLUMN salary DECIMAL(12,2),
ADD COLUMN salary_range_percentage DECIMAL(5,2),
ADD COLUMN performance_rating DECIMAL(3,2);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.job_title IS 'Título do cargo do funcionário';
COMMENT ON COLUMN public.profiles.grade IS 'Grade/nível salarial';
COMMENT ON COLUMN public.profiles.salary IS 'Salário atual do funcionário';
COMMENT ON COLUMN public.profiles.salary_range_percentage IS 'Porcentagem da faixa salarial (0-100)';
COMMENT ON COLUMN public.profiles.performance_rating IS 'Nota de avaliação de desempenho (0-10)';