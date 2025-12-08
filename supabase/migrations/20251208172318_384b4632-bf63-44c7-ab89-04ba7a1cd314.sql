-- =====================================================
-- HARDENING DE SEGURANÇA - RLS POLICIES
-- Isolamento completo por empresa para tabelas críticas
-- =====================================================

-- =====================================================
-- 1. PAYMENT_METHODS - Métodos de pagamento
-- =====================================================

-- Dropar política vulnerável que não verifica empresa
DROP POLICY IF EXISTS "Admins manage payment methods" ON payment_methods;

-- Nova política com isolamento por empresa
CREATE POLICY "Admins manage own company payment methods" ON payment_methods
FOR ALL USING (
  (company_id = get_user_company_id()) 
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
);

-- =====================================================
-- 2. CHECKOUT_SESSIONS - Sessões de checkout
-- =====================================================

-- Dropar política perigosa com UPDATE = true (permite qualquer um atualizar)
DROP POLICY IF EXISTS "System can update checkout sessions" ON checkout_sessions;

-- Updates de checkout_sessions só devem acontecer via webhook (service_role)
-- que bypassa RLS. Não há necessidade de policy UPDATE para usuários normais.

-- =====================================================
-- 3. INVOICES - Faturas
-- =====================================================

-- Dropar política vulnerável
DROP POLICY IF EXISTS "Admins manage invoices" ON invoices;

-- Nova política com isolamento por empresa
CREATE POLICY "Admins manage own company invoices" ON invoices
FOR ALL USING (
  (company_id = get_user_company_id()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- =====================================================
-- 4. INVOICE_ITEMS - Itens de fatura
-- =====================================================

-- Dropar política vulnerável
DROP POLICY IF EXISTS "Admins manage invoice items" ON invoice_items;

-- Nova política com verificação de empresa via tabela invoices
CREATE POLICY "Admins manage own company invoice items" ON invoice_items
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND invoice_id IN (
    SELECT id FROM invoices 
    WHERE company_id = get_user_company_id()
  )
);

-- =====================================================
-- 5. COMPANY_SUBSCRIPTIONS - Assinaturas
-- =====================================================

-- Dropar política vulnerável
DROP POLICY IF EXISTS "Admins manage subscriptions" ON company_subscriptions;

-- Nova política com isolamento por empresa
CREATE POLICY "Admins manage own company subscriptions" ON company_subscriptions
FOR ALL USING (
  (company_id = get_user_company_id()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- =====================================================
-- 6. EMPLOYEE_BENEFITS - Benefícios de funcionários
-- =====================================================

-- Dropar política vulnerável que não verifica empresa
DROP POLICY IF EXISTS "Admins and HR can manage employee benefits" ON employee_benefits;

-- Nova política com isolamento por empresa via profiles
CREATE POLICY "Admins and HR manage own company employee benefits" ON employee_benefits
FOR ALL USING (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
  AND employee_id IN (
    SELECT id FROM profiles 
    WHERE root_company_id = get_user_company_id()
  )
);

-- =====================================================
-- 7. BUDGET_EMPLOYEE_PROJECTIONS - DELETE policy
-- =====================================================

-- Dropar política DELETE vulnerável que não verifica empresa
DROP POLICY IF EXISTS "Delete projections policy" ON budget_employee_projections;

-- Nova política DELETE com verificação de empresa
CREATE POLICY "Delete projections policy" ON budget_employee_projections
FOR DELETE USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND (
    -- Verificar via employee_id
    (employee_id IS NOT NULL AND employee_id IN (
      SELECT id FROM profiles 
      WHERE root_company_id = get_user_company_id()
    ))
    OR
    -- Verificar via projected_unit_id para contratações planejadas
    (projected_unit_id IS NOT NULL AND projected_unit_id IN (
      SELECT id FROM organizational_structure
      WHERE root_company_id = get_user_company_id()
    ))
  )
);

-- =====================================================
-- 8. Verificação final - listar policies atualizadas
-- =====================================================
-- As novas políticas garantem:
-- ✅ Dados de pagamento isolados por empresa
-- ✅ Nenhum admin pode ver dados de outra empresa
-- ✅ Webhook continua funcionando (usa service_role)
-- ✅ Funcionários e benefícios protegidos por empresa