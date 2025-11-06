-- FASE 1: Adicionar colunas de Total Compensation na tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS benefits_value NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS short_term_incentive NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS long_term_incentive NUMERIC(10,2) DEFAULT 0;

-- Criar tabela de vínculos Funcionário-Benefício
CREATE TABLE IF NOT EXISTS public.employee_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  benefit_id UUID NOT NULL REFERENCES public.benefits(id) ON DELETE CASCADE,
  
  company_contribution_value NUMERIC(10,2) NOT NULL,
  employee_contribution_value NUMERIC(10,2) DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(employee_id, benefit_id)
);

-- Habilitar RLS
ALTER TABLE public.employee_benefits ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Admins and HR can manage employee benefits"
  ON public.employee_benefits FOR ALL
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Users can view own benefits"
  ON public.employee_benefits FOR SELECT
  USING (auth.uid() = employee_id OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- Função para calcular valor total de benefícios por funcionário
CREATE OR REPLACE FUNCTION calculate_employee_benefits(p_employee_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total NUMERIC := 0;
BEGIN
  SELECT COALESCE(SUM(company_contribution_value), 0)
  INTO v_total
  FROM public.employee_benefits
  WHERE employee_id = p_employee_id
    AND is_active = true
    AND (end_date IS NULL OR end_date >= CURRENT_DATE);
  
  UPDATE public.profiles
  SET benefits_value = v_total
  WHERE id = p_employee_id;
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para recalcular automaticamente quando employee_benefits mudar
CREATE OR REPLACE FUNCTION recalculate_benefits_after_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_employee_benefits(OLD.employee_id);
  ELSE
    PERFORM calculate_employee_benefits(NEW.employee_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER recalculate_benefits_after_change
AFTER INSERT OR UPDATE OR DELETE ON public.employee_benefits
FOR EACH ROW EXECUTE FUNCTION recalculate_benefits_after_change();