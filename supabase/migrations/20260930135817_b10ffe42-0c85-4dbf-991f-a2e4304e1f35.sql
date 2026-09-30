ALTER TABLE public.nr1_diagnostico_respostas
ADD COLUMN convite_id uuid REFERENCES public.nr1_convites(id) ON DELETE SET NULL;

CREATE INDEX nr1_respostas_convite_hash_idx
ON public.nr1_diagnostico_respostas (convite_id, respondent_hash);

CREATE OR REPLACE FUNCTION public.nr1_submeter_respostas(p_token text, p_submission_id uuid, p_respostas jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  IF v_total_respostas <> v_total_questoes OR jsonb_object_length(p_respostas) <> v_total_questoes THEN
    RAISE EXCEPTION 'Todas as questões devem ser respondidas';
  END IF;

  v_hash := encode(digest(v_convite.id::text || ':' || p_submission_id::text, 'sha256'), 'hex');
  IF EXISTS (
    SELECT 1 FROM public.nr1_diagnostico_respostas
    WHERE diagnostico_id = v_convite.diagnostico_id AND respondent_hash = v_hash
  ) THEN
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
$$;
REVOKE ALL ON FUNCTION public.nr1_submeter_respostas(text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nr1_submeter_respostas(text, uuid, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.nr1_resultado_grupo(p_diagnostico_id uuid, p_grupo text)
RETURNS TABLE(total_respondentes integer, score_geral numeric, nivel_risco public.nr1_nivel_risco, scores_dimensao jsonb, dados_suficientes boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
  v_total integer;
  v_scores jsonb;
  v_geral numeric;
BEGIN
  SELECT company_id INTO v_company FROM public.nr1_diagnosticos WHERE id = p_diagnostico_id;
  IF v_company IS NULL OR NOT public.nr1_pode_gerir(v_company) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT count(DISTINCT r.respondent_hash) INTO v_total
  FROM public.nr1_diagnostico_respostas r
  JOIN public.nr1_convites c ON c.id = r.convite_id
  WHERE r.diagnostico_id = p_diagnostico_id AND c.grupo = p_grupo;

  IF v_total < 5 THEN
    RETURN QUERY SELECT v_total, NULL::numeric, NULL::public.nr1_nivel_risco, NULL::jsonb, false;
    RETURN;
  END IF;

  SELECT jsonb_object_agg(dim, sc), avg(sc)::numeric(5,2)
  INTO v_scores, v_geral
  FROM (
    SELECT q.dimensao::text dim,
      round(avg(CASE WHEN q.reverso THEN 4-r.resposta ELSE r.resposta END)::numeric * 25, 2) sc
    FROM public.nr1_diagnostico_respostas r
    JOIN public.nr1_convites c ON c.id = r.convite_id
    JOIN public.nr1_questoes q ON q.id = r.questao_id
    WHERE r.diagnostico_id = p_diagnostico_id AND c.grupo = p_grupo
    GROUP BY q.dimensao
  ) s;

  RETURN QUERY SELECT v_total, v_geral, public.nr1_calc_risco(v_geral), v_scores, true;
END
$$;
REVOKE ALL ON FUNCTION public.nr1_resultado_grupo(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nr1_resultado_grupo(uuid, text) TO authenticated, service_role;