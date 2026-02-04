-- =====================================================
-- FIX: subscription_plans - Restringir acesso público
-- Planos podem ser visualizados publicamente para pricing page,
-- mas campos sensíveis (internal notes, enterprise pricing) devem ser protegidos
-- =====================================================

-- Revogar políticas existentes se houver
DROP POLICY IF EXISTS "subscription_plans_public_read" ON public.subscription_plans;
DROP POLICY IF EXISTS "subscription_plans_admin_all" ON public.subscription_plans;
DROP POLICY IF EXISTS "Allow public read access to subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Super admin can manage plans" ON public.subscription_plans;

-- Habilitar RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Política: Leitura pública apenas de planos ativos e públicos
CREATE POLICY "subscription_plans_public_read_active"
ON public.subscription_plans
FOR SELECT
TO public
USING (is_active = true);

-- Política: Super admin pode gerenciar todos os planos
CREATE POLICY "subscription_plans_super_admin_all"
ON public.subscription_plans
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- =====================================================
-- FIX: discount_coupons - Restringir acesso totalmente
-- Cupons NÃO devem ser publicamente legíveis
-- =====================================================

-- Revogar políticas existentes se houver
DROP POLICY IF EXISTS "discount_coupons_public_read" ON public.discount_coupons;
DROP POLICY IF EXISTS "discount_coupons_admin_all" ON public.discount_coupons;
DROP POLICY IF EXISTS "Allow reading active coupons" ON public.discount_coupons;
DROP POLICY IF EXISTS "Super admin can manage coupons" ON public.discount_coupons;

-- Habilitar RLS
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

-- Política: Super admin pode gerenciar cupons
CREATE POLICY "discount_coupons_super_admin_all"
ON public.discount_coupons
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Criar função segura para validar cupom (sem expor dados)
CREATE OR REPLACE FUNCTION public.validate_coupon_code(p_code TEXT, p_plan_id UUID DEFAULT NULL, p_billing_cycle TEXT DEFAULT NULL)
RETURNS TABLE (
  is_valid BOOLEAN,
  discount_type TEXT,
  discount_value NUMERIC,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_coupon RECORD;
BEGIN
  -- Buscar cupom pelo código
  SELECT * INTO v_coupon
  FROM discount_coupons
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = true;
  
  -- Cupom não encontrado
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, 'Cupom inválido ou inexistente'::TEXT;
    RETURN;
  END IF;
  
  -- Verificar validade temporal
  IF v_coupon.valid_from IS NOT NULL AND v_coupon.valid_from > NOW() THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, 'Cupom ainda não está ativo'::TEXT;
    RETURN;
  END IF;
  
  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < NOW() THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, 'Cupom expirado'::TEXT;
    RETURN;
  END IF;
  
  -- Verificar limite de uso
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, 'Cupom atingiu limite de uso'::TEXT;
    RETURN;
  END IF;
  
  -- Verificar plano aplicável
  IF v_coupon.applicable_plans IS NOT NULL AND p_plan_id IS NOT NULL THEN
    IF NOT (p_plan_id::TEXT = ANY(v_coupon.applicable_plans)) THEN
      RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, 'Cupom não aplicável a este plano'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Verificar ciclo de cobrança mínimo
  IF v_coupon.min_billing_cycle IS NOT NULL AND p_billing_cycle IS NOT NULL THEN
    IF v_coupon.min_billing_cycle = 'annual' AND p_billing_cycle = 'monthly' THEN
      RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, 'Cupom válido apenas para planos anuais'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Cupom válido
  RETURN QUERY SELECT 
    true, 
    v_coupon.discount_type, 
    v_coupon.discount_value,
    NULL::TEXT;
END;
$$;