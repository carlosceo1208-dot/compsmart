CREATE OR REPLACE FUNCTION public.nr1_submeter_respostas(p_token text, p_submission_id uuid, p_respostas jsonb)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_convite public.nr1_convites%ROWTYPE;
  v_total_questoes integer;
  v_total_respostas integer;
  v_hash text;
BEGIN
  SELECT * INTO v_convite FROM public.nr1_convites WHERE token = p_token FOR SHARE;
  IF NOT FOUND OR v_convite.expires_at <= now() THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;
  IF p_submission_id IS NULL OR jsonb_typeof(p_respostas) <> 'object' THEN
    RAISE EXCEPTION 'Envio inválido';
  END IF;
  SELECT count(*) INTO v_total_questoes FROM public.nr1_questoes WHERE ativo;
  SELECT count(*) INTO v_total_respostas
  FROM jsonb_each_text(p_respostas) r
  JOIN public.nr1_questoes q ON q.id::text = r.key AND q.ativo
  WHERE r.value ~ '^[0-4]$';
  IF v_total_respostas <> v_total_questoes OR (SELECT count(*) FROM jsonb_object_keys(p_respostas)) <> v_total_questoes THEN
    RAISE EXCEPTION 'Todas as questões devem ser respondidas';
  END IF;
  v_hash := encode(extensions.digest(v_convite.id::text || ':' || p_submission_id::text, 'sha256'), 'hex');
  IF EXISTS (SELECT 1 FROM public.nr1_diagnostico_respostas WHERE diagnostico_id = v_convite.diagnostico_id AND respondent_hash = v_hash) THEN
    RAISE EXCEPTION 'Este questionário já foi enviado';
  END IF;
  INSERT INTO public.nr1_diagnostico_respostas (diagnostico_id, convite_id, respondent_hash, questao_id, resposta)
  SELECT v_convite.diagnostico_id, v_convite.id, v_hash, q.id, (r.value)::integer
  FROM jsonb_each_text(p_respostas) r
  JOIN public.nr1_questoes q ON q.id::text = r.key AND q.ativo;
  UPDATE public.nr1_convites SET used_at = COALESCE(used_at, now()) WHERE id = v_convite.id;
  PERFORM public.nr1_recompute_scores(v_convite.diagnostico_id);
  RETURN v_convite.diagnostico_id;
END
$function$;
REVOKE ALL ON FUNCTION public.nr1_submeter_respostas(text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nr1_submeter_respostas(text, uuid, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.nr1_diagnostico_k_guard()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $$
BEGIN
  -- Rede de segurança: apenas zera; nunca calcula. Cálculo >=5 é do nr1_recompute_scores.
  IF COALESCE(NEW.total_respondentes, 0) < 5 THEN
    NEW.score_geral := NULL;
    NEW.nivel_risco := NULL;
    NEW.scores_dimensao := NULL;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS nr1_diagnostico_k_guard ON public.nr1_diagnosticos;
CREATE TRIGGER nr1_diagnostico_k_guard BEFORE INSERT OR UPDATE ON public.nr1_diagnosticos
FOR EACH ROW EXECUTE FUNCTION public.nr1_diagnostico_k_guard();

GRANT EXECUTE ON FUNCTION public.nr1_resultado_grupo(uuid, text) TO authenticated;