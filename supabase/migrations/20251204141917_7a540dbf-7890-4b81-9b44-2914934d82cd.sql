-- Tabela para configuração de prazos de submissão de orçamento
CREATE TABLE public.budget_deadline_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year INTEGER NOT NULL,
  deadline_date DATE NOT NULL,
  root_company_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  reminder_days_before INTEGER[] DEFAULT '{7,3,1}',
  last_reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  UNIQUE(fiscal_year, root_company_id)
);

-- Enable RLS
ALTER TABLE public.budget_deadline_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin/HR pode visualizar deadlines" ON public.budget_deadline_settings
  FOR SELECT USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Admin/HR pode gerenciar deadlines" ON public.budget_deadline_settings
  FOR ALL USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- Trigger para updated_at
CREATE TRIGGER update_budget_deadline_settings_updated_at
  BEFORE UPDATE ON public.budget_deadline_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();