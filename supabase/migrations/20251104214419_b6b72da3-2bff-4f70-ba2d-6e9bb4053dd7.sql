-- =====================================================
-- SISTEMA DE NÚMERO DE REGISTRO DE FUNCIONÁRIO (RE)
-- =====================================================

-- 1. Adicionar coluna employee_number
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS employee_number VARCHAR(50) UNIQUE;

COMMENT ON COLUMN public.profiles.employee_number IS 
'Número de registro do funcionário (RE, matrícula, employee number). Obrigatório.';

-- 2. Criar index para otimizar buscas
CREATE INDEX IF NOT EXISTS idx_profiles_employee_number 
ON public.profiles(employee_number);

-- 3. Desabilitar apenas a trigger de validação (não as triggers de sistema)
ALTER TABLE public.profiles DISABLE TRIGGER validate_profile_update_trigger;

-- 4. Renumerar os 4 funcionários existentes (por ordem de created_at)
-- Resultado: 2025001, 2025002, 2025003, 2025004
WITH numbered_profiles AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM public.profiles
  WHERE employee_number IS NULL
)
UPDATE public.profiles p
SET employee_number = CONCAT('2025', LPAD(np.row_num::TEXT, 3, '0'))
FROM numbered_profiles np
WHERE p.id = np.id;

-- 5. Recalcular salary_range_percentage PERMITINDO VALORES NEGATIVOS
-- Importante: Remove GREATEST(0, ...) para permitir valores negativos
-- quando salário está abaixo do mínimo da faixa
UPDATE public.profiles p
SET salary_range_percentage = (
  SELECT 
    CASE 
      WHEN sr.max_value = sr.min_value THEN 50.00
      ELSE LEAST(100, 
        ((p.salary - sr.min_value) / (sr.max_value - sr.min_value)) * 100
      )
    END
  FROM salary_ranges sr
  JOIN salary_tables st ON sr.salary_table_id = st.id
  WHERE sr.grade = p.grade 
    AND st.is_active = true
  LIMIT 1
)
WHERE p.salary IS NOT NULL 
  AND p.grade IS NOT NULL;

-- 6. Reabilitar a trigger
ALTER TABLE public.profiles ENABLE TRIGGER validate_profile_update_trigger;

-- 7. Função para sugerir próximo número automático
CREATE OR REPLACE FUNCTION suggest_next_employee_number()
RETURNS VARCHAR
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_max_seq INTEGER;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(
    CASE 
      WHEN employee_number ~ ('^' || v_year || '\d{3,}$')
      THEN SUBSTRING(employee_number FROM LENGTH(v_year) + 1)::INTEGER
      ELSE 0
    END
  ), 0)
  INTO v_max_seq
  FROM public.profiles
  WHERE employee_number LIKE (v_year || '%');
  
  RETURN v_year || LPAD((v_max_seq + 1)::TEXT, 3, '0');
END;
$$;

COMMENT ON FUNCTION suggest_next_employee_number() IS 
'Sugere o próximo número de registro no formato YYYYNNN (ex: 2025005)';