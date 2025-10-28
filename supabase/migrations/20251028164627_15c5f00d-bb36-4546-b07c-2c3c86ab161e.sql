-- 1. Criar tabela de tabelas salariais
CREATE TABLE public.salary_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  effective_month int NOT NULL CHECK (effective_month BETWEEN 1 AND 12),
  effective_year int NOT NULL CHECK (effective_year >= 2020),
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.salary_tables ENABLE ROW LEVEL SECURITY;

-- RLS Policies para salary_tables
CREATE POLICY "Admins and HR managers can manage salary tables"
ON public.salary_tables
FOR ALL
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Users can view salary tables"
ON public.salary_tables
FOR SELECT
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_salary_tables_updated_at
BEFORE UPDATE ON public.salary_tables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Modificar tabela salary_ranges
ALTER TABLE public.salary_ranges 
ADD COLUMN salary_table_id uuid REFERENCES public.salary_tables(id) ON DELETE CASCADE;

-- Remover constraint antiga de grade única se existir
ALTER TABLE public.salary_ranges 
DROP CONSTRAINT IF EXISTS salary_ranges_grade_key;

-- Criar constraint composta (grade única por tabela)
ALTER TABLE public.salary_ranges 
ADD CONSTRAINT unique_grade_per_table UNIQUE (salary_table_id, grade);

-- 3. Criar função de cálculo com valores fixos (-20% / +25%)
CREATE OR REPLACE FUNCTION public.calculate_salary_range_fixed(p_median numeric)
RETURNS TABLE(
  min_value numeric,
  q1_value numeric,
  median_value numeric,
  q3_value numeric,
  max_value numeric
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_range numeric;
BEGIN
  -- Mínimo: -20% do ponto médio
  min_value := p_median * 0.80;
  
  -- Máximo: +25% do ponto médio
  max_value := p_median * 1.25;
  
  -- Mediana: o próprio ponto médio
  median_value := p_median;
  
  -- Calcular range total
  v_range := max_value - min_value;
  
  -- 1º Quartil: 25% do range a partir do mínimo
  q1_value := min_value + (v_range * 0.25);
  
  -- 3º Quartil: 75% do range a partir do mínimo
  q3_value := min_value + (v_range * 0.75);
  
  RETURN NEXT;
END;
$$;

-- 4. Trigger para garantir apenas 1 tabela ativa por vez
CREATE OR REPLACE FUNCTION public.ensure_single_active_table()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.salary_tables 
    SET is_active = false 
    WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER single_active_table_trigger
BEFORE INSERT OR UPDATE ON public.salary_tables
FOR EACH ROW
WHEN (NEW.is_active = true)
EXECUTE FUNCTION public.ensure_single_active_table();