DROP POLICY IF EXISTS "View templates and own surveys" ON public.survey_tables;
CREATE POLICY "View templates and own surveys" ON public.survey_tables FOR SELECT TO authenticated
USING ((root_company_id = get_user_company_id()) OR (root_company_id IS NULL AND (is_super_admin(auth.uid()) OR has_module('insight'))));

DROP POLICY IF EXISTS "View survey data based on table ownership" ON public.survey_data;
CREATE POLICY "View survey data based on table ownership" ON public.survey_data FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM survey_tables st WHERE st.id = survey_data.survey_table_id
  AND ((st.root_company_id = get_user_company_id()) OR (st.root_company_id IS NULL AND (is_super_admin(auth.uid()) OR has_module('insight'))))));

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
  INSERT INTO public.leads (nome, email, porte, segmento, colaboradores, modulo_interesse, consentimento_lgpd, origem, status, score_free, nivel_risco_free, respostas_free, submitted_at)
  VALUES (trim(_nome), _e, _p, _segmento, _colaboradores, _modulo, true, 'diagnostico', 'novo', _score, _nivel, _respostas, now())
  RETURNING id INTO _id;
  RETURN _id;
END; $function$;