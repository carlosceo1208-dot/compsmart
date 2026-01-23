-- Corrigir findings do Security Scan: invoices, profiles e checkout_sessions

-- 1) Restrição de acesso a faturas (invoices) apenas para Admin/HR da própria empresa
DROP POLICY IF EXISTS "Users view own company invoices" ON public.invoices;

CREATE POLICY "Admin/HR view own company invoices"
ON public.invoices
FOR SELECT
USING (
  company_id = get_user_company_id()
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
);


-- 2) Reorganizar políticas de SELECT de profiles para ficar explícito: self OR admin/hr
DROP POLICY IF EXISTS "Admins and HR view own company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admin/HR view company profiles"
ON public.profiles
FOR SELECT
USING (
  root_company_id = get_user_company_id()
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
);


-- 3) Minimização de dados de pagamento em checkout_sessions após finalizar (paid/canceled/expired)
CREATE OR REPLACE FUNCTION public.purge_checkout_session_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Quando a sessão deixa de ser pendente, removemos dados sensíveis (PIX/boleto)
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IS NOT NULL AND NEW.status <> 'pending' THEN
    NEW.pix_qr_code := NULL;
    NEW.pix_qr_code_url := NULL;
    NEW.boleto_url := NULL;
    NEW.boleto_barcode := NULL;
  END IF;

  -- Se marcou como pago, também remove (mesmo que status não tenha mudado)
  IF NEW.paid_at IS NOT NULL THEN
    NEW.pix_qr_code := NULL;
    NEW.pix_qr_code_url := NULL;
    NEW.boleto_url := NULL;
    NEW.boleto_barcode := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_purge_checkout_session_sensitive_fields ON public.checkout_sessions;

CREATE TRIGGER trg_purge_checkout_session_sensitive_fields
BEFORE UPDATE ON public.checkout_sessions
FOR EACH ROW
EXECUTE FUNCTION public.purge_checkout_session_sensitive_fields();
