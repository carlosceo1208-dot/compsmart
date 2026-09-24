ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_porte_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_porte_check CHECK (
  porte IS NULL OR porte IN ('PE','ME','GE',
    'Até 50 colaboradores','51 a 250 colaboradores','251 a 1.000 colaboradores','Mais de 1.000 colaboradores')
);

INSERT INTO public.tenant_subscriptions (tenant_id, module_id, status)
SELECT os.id, m.id, 'active'
FROM public.organizational_structure os
JOIN public.modules m ON m.slug = 'core'
WHERE os.parent_id IS NULL
ON CONFLICT (tenant_id, module_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.grant_core_module_to_new_tenant()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN
    INSERT INTO public.tenant_subscriptions (tenant_id, module_id, status)
    SELECT NEW.id, m.id, 'active' FROM public.modules m WHERE m.slug = 'core'
    ON CONFLICT (tenant_id, module_id) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.grant_core_module_to_new_tenant() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_grant_core_module ON public.organizational_structure;
CREATE TRIGGER trg_grant_core_module AFTER INSERT ON public.organizational_structure
FOR EACH ROW EXECUTE FUNCTION public.grant_core_module_to_new_tenant();