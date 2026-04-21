
-- =========================================================================
-- 1. PROTEGER DADOS FINANCEIROS DA EMPRESA
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.company_billing (
  company_id UUID PRIMARY KEY REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  cnpj TEXT,
  billing_email TEXT,
  payment_method TEXT,
  custom_monthly_price NUMERIC,
  custom_annual_price NUMERIC,
  billing_cycle TEXT,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  subscription_started_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

INSERT INTO public.company_billing (
  company_id, cnpj, billing_email, payment_method,
  custom_monthly_price, custom_annual_price, billing_cycle,
  trial_ends_at, subscription_started_at
)
SELECT 
  id, cnpj, billing_email, payment_method,
  custom_monthly_price, custom_annual_price, billing_cycle,
  trial_ends_at, subscription_started_at
FROM public.organizational_structure
WHERE type = 'company'
ON CONFLICT (company_id) DO NOTHING;

ALTER TABLE public.company_billing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view own company billing" ON public.company_billing;
DROP POLICY IF EXISTS "Admins manage own company billing" ON public.company_billing;

CREATE POLICY "Admins view own company billing"
ON public.company_billing
FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR (
    company_id = public.get_user_company_id()
    AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role])
  )
);

CREATE POLICY "Admins manage own company billing"
ON public.company_billing
FOR ALL
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR (
    company_id = public.get_user_company_id()
    AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role])
  )
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR (
    company_id = public.get_user_company_id()
    AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role])
  )
);

DROP TRIGGER IF EXISTS update_company_billing_updated_at ON public.company_billing;
CREATE TRIGGER update_company_billing_updated_at
BEFORE UPDATE ON public.company_billing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE VIEW public.organizational_structure_public
WITH (security_invoker=on) AS
SELECT 
  id, name, fantasy_name, type, code, description, parent_id,
  root_company_id, logo_url, subscription_plan_id, subscription_status,
  social_charges_percentage, industry_sector, latitude, longitude,
  default_language, is_founder, created_at, updated_at
FROM public.organizational_structure;

-- =========================================================================
-- 2. REFORÇAR KUDOS
-- =========================================================================

DROP POLICY IF EXISTS "View public kudos or own" ON public.performance_kudos;
DROP POLICY IF EXISTS "Users can send kudos" ON public.performance_kudos;
DROP POLICY IF EXISTS "View kudos within own company" ON public.performance_kudos;
DROP POLICY IF EXISTS "Send kudos within own company" ON public.performance_kudos;

CREATE POLICY "View kudos within own company"
ON public.performance_kudos
FOR SELECT
TO authenticated
USING (
  root_company_id = public.get_user_company_id()
  AND (
    is_public = true
    OR from_employee_id = auth.uid()
    OR to_employee_id = auth.uid()
  )
);

CREATE POLICY "Send kudos within own company"
ON public.performance_kudos
FOR INSERT
TO authenticated
WITH CHECK (
  from_employee_id = auth.uid()
  AND root_company_id = public.get_user_company_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = to_employee_id
      AND p.root_company_id = public.get_user_company_id()
  )
);

-- =========================================================================
-- 3. profiles_compensation_directory é VIEW: forçar security_invoker
-- =========================================================================
-- Com security_invoker=on, a view aplica as políticas RLS da tabela base 
-- profiles para o usuário que está consultando, garantindo isolamento.

ALTER VIEW public.profiles_compensation_directory SET (security_invoker = on);
ALTER VIEW public.v_agent_conversations SET (security_invoker = on);
ALTER VIEW public.v_performance_employees SET (security_invoker = on);
ALTER VIEW public.v_performance_evaluations_directory SET (security_invoker = on);

-- =========================================================================
-- 4. DEFESA EM PROFUNDIDADE: get_user_company_id valida super_admin
-- =========================================================================

CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT sac.active_company_id 
     FROM public.super_admin_active_company sac
     WHERE sac.user_id = auth.uid()
       AND public.is_super_admin(auth.uid())),
    (SELECT root_company_id 
     FROM public.profiles 
     WHERE id = auth.uid())
  )
  LIMIT 1;
$$;
