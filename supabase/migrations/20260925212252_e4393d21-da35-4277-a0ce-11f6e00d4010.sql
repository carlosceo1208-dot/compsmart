ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS segmento text;
DROP FUNCTION IF EXISTS public.submit_diagnostico_lead(text,text,text,text,text,boolean,numeric,text,jsonb);
CREATE OR REPLACE FUNCTION public.submit_diagnostico_lead(_nome text, _email text, _porte text, _colaboradores text, _modulo text, _lgpd boolean, _score numeric, _nivel text, _respostas jsonb, _segmento text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _id uuid; _e text := lower(trim(_email)); _p text;
BEGIN
  IF _lgpd IS NOT TRUE THEN RAISE EXCEPTION 'LGPD consent required'; END IF;
  IF length(trim(coalesce(_nome,''))) < 2 OR length(_nome) > 100 THEN RAISE EXCEPTION 'invalid name'; END IF;
  IF _e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(_e) > 255 THEN RAISE EXCEPTION 'invalid email'; END IF;
  _p := CASE _porte WHEN 'Pequena' THEN 'PE' WHEN 'Média' THEN 'ME' WHEN 'Grande' THEN 'GE' END;
  IF _p IS NULL THEN RAISE EXCEPTION 'invalid porte'; END IF;
  IF _segmento IS NULL OR length(_segmento) > 40 OR _segmento NOT IN ('Indústria','Comércio','Serviços','Tecnologia','Saúde','Educação','Construção Civil','Agronegócio','Financeiro','Outro') THEN RAISE EXCEPTION 'invalid segmento'; END IF;
  IF _colaboradores NOT IN ('até 99','100–499','500+') THEN RAISE EXCEPTION 'invalid colaboradores'; END IF;
  IF _modulo NOT IN ('NR-1/Riscos Psicossociais','Clima Organizacional','Cargos e Salários','Remuneração','9-Box/Sucessão') THEN RAISE EXCEPTION 'invalid modulo'; END IF;
  IF _score IS NULL OR _score < 0 OR _score > 100 THEN RAISE EXCEPTION 'invalid score'; END IF;
  IF _nivel NOT IN ('baixo','moderado','alto','critico') THEN RAISE EXCEPTION 'invalid nivel'; END IF;
  IF _respostas IS NULL OR jsonb_typeof(_respostas) <> 'object' OR (SELECT count(*) FROM jsonb_object_keys(_respostas)) > 60 THEN RAISE EXCEPTION 'invalid respostas'; END IF;

  SELECT id INTO _id FROM public.leads WHERE lower(email) = _e AND origem = 'diagnostico' ORDER BY created_at LIMIT 1;
  IF _id IS NULL THEN
    INSERT INTO public.leads (nome, email, porte, segmento, colaboradores, modulo_interesse, consentimento_lgpd, origem, status, score_free, nivel_risco_free, respostas_free)
    VALUES (trim(_nome), _e, _p, _segmento, _colaboradores, _modulo, true, 'diagnostico', 'novo', _score, _nivel, _respostas)
    RETURNING id INTO _id;
  ELSE
    UPDATE public.leads SET nome = trim(_nome), porte = _p, segmento = _segmento, colaboradores = _colaboradores,
      modulo_interesse = _modulo, consentimento_lgpd = true,
      score_free = _score, nivel_risco_free = _nivel, respostas_free = _respostas,
      status = CASE WHEN status = 'convertido' THEN status ELSE 'novo' END,
      updated_at = now()
    WHERE id = _id;
  END IF;
  RETURN _id;
END; $function$;
GRANT EXECUTE ON FUNCTION public.submit_diagnostico_lead(text,text,text,text,text,boolean,numeric,text,jsonb,text) TO anon, authenticated;