-- 1) Migrate any remaining cnpj data from organizational_structure into company_billing
INSERT INTO public.company_billing (company_id, cnpj)
SELECT os.id, os.cnpj
FROM public.organizational_structure os
WHERE os.cnpj IS NOT NULL
ON CONFLICT (company_id) DO UPDATE
  SET cnpj = COALESCE(public.company_billing.cnpj, EXCLUDED.cnpj);

-- 2) Drop sensitive columns from organizational_structure (now sourced from company_billing only)
ALTER TABLE public.organizational_structure
  DROP COLUMN IF EXISTS billing_email,
  DROP COLUMN IF EXISTS cnpj,
  DROP COLUMN IF EXISTS custom_monthly_price,
  DROP COLUMN IF EXISTS custom_annual_price;