-- =====================================================
-- FASE 1: Estrutura Completa de Planos e Faturamento
-- =====================================================

-- 1. TABELA: subscription_plans (Catálogo de Planos)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'medium', 'pro', 'enterprise', 'custom')),
  
  -- Preços
  monthly_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  annual_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  setup_fee NUMERIC(10,2) DEFAULT 0,
  
  -- Limites e Features
  max_employees INTEGER,
  max_users INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. ADICIONAR CAMPOS À organizational_structure (para empresas)
ALTER TABLE public.organizational_structure
ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES public.subscription_plans(id),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled', 'suspended')),
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS custom_monthly_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS custom_annual_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS billing_email TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 3. TABELA: company_subscriptions (Histórico de Assinaturas)
CREATE TABLE IF NOT EXISTS public.company_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  
  -- Período
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Valores
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  monthly_price NUMERIC(10,2) NOT NULL,
  annual_price NUMERIC(10,2) NOT NULL,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('trial', 'active', 'canceled', 'expired')),
  cancellation_reason TEXT,
  canceled_at TIMESTAMP WITH TIME ZONE,
  canceled_by UUID REFERENCES auth.users(id),
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 4. TABELA: invoices (Faturas)
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.company_subscriptions(id),
  
  -- Numeração
  invoice_number TEXT NOT NULL UNIQUE,
  
  -- Valores
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  tax NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  -- Datas
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'canceled', 'refunded')),
  
  -- Pagamento
  payment_method TEXT,
  payment_reference TEXT,
  
  -- Notas
  notes TEXT,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 5. TABELA: invoice_items (Itens da Fatura)
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  
  -- Descrição
  description TEXT NOT NULL,
  item_type TEXT CHECK (item_type IN ('subscription', 'setup_fee', 'addon', 'discount', 'adjustment')),
  
  -- Valores
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  
  -- Referências
  plan_id UUID REFERENCES public.subscription_plans(id),
  period_start DATE,
  period_end DATE,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. INSERIR PLANOS PADRÃO
INSERT INTO public.subscription_plans (name, description, plan_type, monthly_price, annual_price, max_employees, max_users, features, sort_order, is_active, is_public)
VALUES 
(
  'Starter',
  'Ideal para pequenas empresas iniciando na gestão de remuneração',
  'starter',
  199.00,
  1990.00,
  50,
  3,
  '["Gestão de Cargos e Salários", "Tabelas Salariais", "Relatórios Básicos", "até 50 colaboradores", "até 3 usuários"]'::jsonb,
  1,
  true,
  true
),
(
  'Medium',
  'Para empresas em crescimento que precisam de análises avançadas',
  'medium',
  499.00,
  4990.00,
  200,
  10,
  '["Tudo do Starter", "Benchmark Salarial", "Análise de Mercado", "até 200 colaboradores", "até 10 usuários", "Dashboards Avançados"]'::jsonb,
  2,
  true,
  true
),
(
  'Pro',
  'Solução completa para grandes empresas com gestão estratégica',
  'pro',
  999.00,
  9990.00,
  NULL,
  NULL,
  '["Tudo do Medium", "Colaboradores Ilimitados", "Usuários Ilimitados", "Assistente Legal (IA)", "Assistente de Incentivos (IA)", "API Access", "Suporte Premium"]'::jsonb,
  3,
  true,
  true
),
(
  'Enterprise',
  'Plano customizado para grandes corporações',
  'enterprise',
  0,
  0,
  NULL,
  NULL,
  '["Tudo do Pro", "Preços Personalizados", "SLA Dedicado", "Treinamento Presencial", "Integração Customizada", "Gerente de Conta Dedicado"]'::jsonb,
  4,
  true,
  true
);

-- 7. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_company ON public.company_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_plan ON public.company_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_status ON public.company_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_company ON public.invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_org_structure_plan ON public.organizational_structure(subscription_plan_id);

-- 8. RLS POLICIES

-- subscription_plans: todos podem ver planos públicos, apenas admins gerenciam
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public plans viewable by all"
  ON public.subscription_plans FOR SELECT
  USING (is_public = true);

CREATE POLICY "Admins can manage all plans"
  ON public.subscription_plans FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- company_subscriptions: empresa vê próprias subscriptions, admins veem todas
ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own company subscriptions"
  ON public.company_subscriptions FOR SELECT
  USING (
    company_id IN (
      SELECT root_company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins manage subscriptions"
  ON public.company_subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- invoices: empresa vê próprias faturas, admins veem todas
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own company invoices"
  ON public.invoices FOR SELECT
  USING (
    company_id IN (
      SELECT root_company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins manage invoices"
  ON public.invoices FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- invoice_items: acesso via invoice
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own invoice items"
  ON public.invoice_items FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE company_id IN (
        SELECT root_company_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins manage invoice items"
  ON public.invoice_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 9. TRIGGER PARA updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column_v2()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column_v2();

CREATE TRIGGER update_company_subscriptions_updated_at
  BEFORE UPDATE ON public.company_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column_v2();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column_v2();

-- 10. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE public.subscription_plans IS 'Catálogo de planos de assinatura disponíveis';
COMMENT ON TABLE public.company_subscriptions IS 'Histórico de assinaturas das empresas';
COMMENT ON TABLE public.invoices IS 'Faturas geradas para cobrança';
COMMENT ON TABLE public.invoice_items IS 'Itens detalhados de cada fatura';

COMMENT ON COLUMN public.organizational_structure.subscription_plan_id IS 'Plano atual da empresa (apenas para type=company)';
COMMENT ON COLUMN public.organizational_structure.subscription_status IS 'Status da assinatura: trial, active, past_due, canceled, suspended';
COMMENT ON COLUMN public.organizational_structure.billing_cycle IS 'Ciclo de cobrança: monthly ou annual';