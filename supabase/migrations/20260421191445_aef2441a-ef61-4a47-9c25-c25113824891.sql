
-- =========================================================================
-- FIX 1: approval_notifications — restringir INSERT permissivo
-- =========================================================================
DROP POLICY IF EXISTS "Authenticated insert notifications in their company" ON public.approval_notifications;

-- Apenas admin/HR/super_admin (mesmas regras do "manage") podem inserir notificações.
-- A inserção legítima por usuários comuns acontece via SECURITY DEFINER triggers
-- (create_merit_approval_assignment etc.), que ignoram RLS.
CREATE POLICY "Admin/HR insert notifications"
ON public.approval_notifications
FOR INSERT
TO authenticated
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
);

-- =========================================================================
-- FIX 2: organizational_structure — esconder dados de billing de não-admins
-- =========================================================================
-- Estratégia: criar função SECURITY DEFINER para ler dados sensíveis de billing
-- apenas para admin/super_admin, e adicionar policy restritiva por coluna via
-- substituição da SELECT policy. Como Postgres RLS não tem column-level grants
-- via policy, removemos os campos sensíveis para usuários não-admin usando uma
-- política de SELECT que retorna a linha mas restringimos o acesso aos campos
-- sensíveis via REVOKE de coluna.

-- 2.1 Revogar SELECT em colunas sensíveis para roles authenticated/anon
REVOKE SELECT (
  billing_email,
  cnpj,
  payment_method,
  custom_monthly_price,
  custom_annual_price,
  subscription_status,
  trial_ends_at,
  subscription_started_at,
  billing_cycle
) ON public.organizational_structure FROM authenticated, anon;

-- 2.2 Conceder SELECT dessas colunas apenas via função SECURITY DEFINER
-- Função para admin/super_admin acessarem dados de billing de sua própria empresa
CREATE OR REPLACE FUNCTION public.get_company_billing_info(p_company_id uuid)
RETURNS TABLE(
  id uuid,
  billing_email text,
  cnpj text,
  payment_method text,
  custom_monthly_price numeric,
  custom_annual_price numeric,
  subscription_status text,
  trial_ends_at timestamp with time zone,
  subscription_started_at timestamp with time zone,
  billing_cycle text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Apenas admin/super_admin da própria empresa (ou super_admin global)
  IF NOT (
    is_super_admin(auth.uid())
    OR (
      has_role(auth.uid(), 'admin'::app_role)
      AND (p_company_id = get_user_company_id())
    )
  ) THEN
    RAISE EXCEPTION 'Access denied: billing data restricted to company admins';
  END IF;

  RETURN QUERY
  SELECT
    os.id,
    os.billing_email,
    os.cnpj,
    os.payment_method,
    os.custom_monthly_price,
    os.custom_annual_price,
    os.subscription_status,
    os.trial_ends_at,
    os.subscription_started_at,
    os.billing_cycle
  FROM public.organizational_structure os
  WHERE os.id = p_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_billing_info(uuid) TO authenticated;
