-- Tabela de Benefícios
CREATE TABLE public.benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  benefit_type TEXT NOT NULL CHECK (benefit_type IN ('fixed', 'variable', 'optional')),
  value_per_employee NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Elegibilidade de Benefícios por Grade
CREATE TABLE public.benefit_eligibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benefit_id UUID REFERENCES public.benefits(id) ON DELETE CASCADE,
  grade TEXT NOT NULL,
  custom_value NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Programas de Incentivos
CREATE TABLE public.incentive_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  program_type TEXT NOT NULL CHECK (program_type IN ('short_term', 'long_term')),
  description TEXT,
  target_percentage NUMERIC(5,2),
  payment_frequency TEXT CHECK (payment_frequency IN ('monthly', 'quarterly', 'annual')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Elegibilidade de Incentivos por Grade
CREATE TABLE public.incentive_eligibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES public.incentive_programs(id) ON DELETE CASCADE,
  grade TEXT NOT NULL,
  custom_percentage NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Orçamento
CREATE TABLE public.budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  budgeted_salary NUMERIC(12,2) NOT NULL,
  budgeted_headcount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fiscal_year, month)
);

-- Enable RLS
ALTER TABLE public.benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefit_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentive_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentive_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget ENABLE ROW LEVEL SECURITY;

-- RLS Policies para Benefits
CREATE POLICY "Admins and HR can manage benefits"
  ON public.benefits FOR ALL
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Users can view benefits"
  ON public.benefits FOR SELECT
  USING (true);

CREATE POLICY "Admins and HR can manage benefit eligibility"
  ON public.benefit_eligibility FOR ALL
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Users can view benefit eligibility"
  ON public.benefit_eligibility FOR SELECT
  USING (true);

-- RLS Policies para Incentive Programs
CREATE POLICY "Admins and HR can manage incentive programs"
  ON public.incentive_programs FOR ALL
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Users can view incentive programs"
  ON public.incentive_programs FOR SELECT
  USING (true);

CREATE POLICY "Admins and HR can manage incentive eligibility"
  ON public.incentive_eligibility FOR ALL
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Users can view incentive eligibility"
  ON public.incentive_eligibility FOR SELECT
  USING (true);

-- RLS Policies para Budget
CREATE POLICY "Admins and HR can manage budget"
  ON public.budget FOR ALL
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Users can view budget"
  ON public.budget FOR SELECT
  USING (true);

-- Triggers para updated_at
CREATE TRIGGER update_benefits_updated_at
  BEFORE UPDATE ON public.benefits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incentive_programs_updated_at
  BEFORE UPDATE ON public.incentive_programs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_updated_at
  BEFORE UPDATE ON public.budget
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();