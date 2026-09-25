ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS colaboradores text;

CREATE OR REPLACE FUNCTION public.submit_diagnostico_lead(
  _nome text, _email text, _porte text, _colaboradores text, _modulo text, _lgpd boolean
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid; _e text := lower(trim(_email));
BEGIN
  IF _lgpd IS NOT TRUE THEN RAISE EXCEPTION 'LGPD consent required'; END IF;
  IF length(trim(coalesce(_nome,''))) < 2 OR length(_nome) > 100 THEN RAISE EXCEPTION 'invalid name'; END IF;
  IF _e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(_e) > 255 THEN RAISE EXCEPTION 'invalid email'; END IF;
  IF _porte NOT IN ('Pequena','Média','Grande') THEN RAISE EXCEPTION 'invalid porte'; END IF;
  IF _colaboradores NOT IN ('até 99','100–499','500+') THEN RAISE EXCEPTION 'invalid colaboradores'; END IF;
  IF _modulo NOT IN ('NR-1/Riscos Psicossociais','Clima Organizacional','Cargos e Salários','Remuneração','9-Box/Sucessão') THEN RAISE EXCEPTION 'invalid modulo'; END IF;

  SELECT id INTO _id FROM public.leads WHERE lower(email) = _e AND origem = 'diagnostico' ORDER BY created_at LIMIT 1;
  IF _id IS NULL THEN
    INSERT INTO public.leads (nome, email, porte, colaboradores, modulo_interesse, consentimento_lgpd, origem, status)
    VALUES (trim(_nome), _e, _porte, _colaboradores, _modulo, true, 'diagnostico', 'novo');
  ELSE
    UPDATE public.leads SET nome = trim(_nome), porte = _porte, colaboradores = _colaboradores,
      modulo_interesse = _modulo, consentimento_lgpd = true,
      status = CASE WHEN status = 'convertido' THEN status ELSE 'novo' END,
      updated_at = now()
    WHERE id = _id;
  END IF;
END; $$;

REVOKE ALL ON FUNCTION public.submit_diagnostico_lead(text,text,text,text,text,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_diagnostico_lead(text,text,text,text,text,boolean) TO anon, authenticated;