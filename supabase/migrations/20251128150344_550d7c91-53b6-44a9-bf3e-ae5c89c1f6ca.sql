-- Tabela de métodos de pagamento salvos
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES organizational_structure(id) ON DELETE CASCADE,
  pagarme_customer_id TEXT,
  pagarme_card_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('credit_card', 'debit_card', 'pix', 'boleto')),
  brand TEXT,
  last_four TEXT,
  holder_name TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de sessões de checkout
CREATE TABLE public.checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES organizational_structure(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('credit_card', 'debit_card', 'pix', 'boleto')),
  pagarme_order_id TEXT,
  pagarme_charge_id TEXT,
  amount_cents INTEGER NOT NULL,
  discount_cents INTEGER DEFAULT 0,
  coupon_code TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled', 'expired')),
  pix_qr_code TEXT,
  pix_qr_code_url TEXT,
  pix_expiration TIMESTAMPTZ,
  boleto_url TEXT,
  boleto_barcode TEXT,
  boleto_due_date DATE,
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de cupons de desconto
CREATE TABLE public.discount_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  applicable_plans UUID[],
  min_billing_cycle TEXT CHECK (min_billing_cycle IN ('monthly', 'annual')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar colunas à company_subscriptions
ALTER TABLE public.company_subscriptions 
ADD COLUMN IF NOT EXISTS pagarme_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS pagarme_customer_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id),
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_methods
CREATE POLICY "Users view own company payment methods"
ON public.payment_methods FOR SELECT
USING (company_id IN (SELECT root_company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins manage payment methods"
ON public.payment_methods FOR ALL
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- RLS Policies for checkout_sessions
CREATE POLICY "Users view own checkout sessions"
ON public.checkout_sessions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users create own checkout sessions"
ON public.checkout_sessions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can update checkout sessions"
ON public.checkout_sessions FOR UPDATE
USING (true);

-- RLS Policies for discount_coupons
CREATE POLICY "Everyone can view active coupons"
ON public.discount_coupons FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins manage coupons"
ON public.discount_coupons FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes for performance
CREATE INDEX idx_checkout_sessions_user ON public.checkout_sessions(user_id);
CREATE INDEX idx_checkout_sessions_status ON public.checkout_sessions(status);
CREATE INDEX idx_checkout_sessions_pagarme ON public.checkout_sessions(pagarme_order_id);
CREATE INDEX idx_payment_methods_company ON public.payment_methods(company_id);
CREATE INDEX idx_discount_coupons_code ON public.discount_coupons(code);

-- Trigger for updated_at
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discount_coupons_updated_at
  BEFORE UPDATE ON public.discount_coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();