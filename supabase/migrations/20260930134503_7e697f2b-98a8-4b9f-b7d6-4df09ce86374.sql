DROP POLICY IF EXISTS "nr1_resp_insert" ON public.nr1_diagnostico_respostas;

CREATE OR REPLACE FUNCTION public.nr1_recompute_scores(p_diagnostico_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_scores jsonb;
  v_geral numeric;
  v_resp integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.nr1_diagnosticos WHERE id = p_diagnostico_id) THEN
    RAISE EXCEPTION 'Diagnóstico não encontrado';
  END IF;

  SELECT count(DISTINCT respondent_hash) INTO v_resp
  FROM public.nr1_diagnostico_respostas
  WHERE diagnostico_id = p_diagnostico_id;

  IF v_resp < 5 THEN
    UPDATE public.nr1_diagnosticos
    SET scores_dimensao = NULL, score_geral = NULL, nivel_risco = NULL,
        total_respondentes = COALESCE(v_resp, 0)
    WHERE id = p_diagnostico_id;
    RETURN;
  END IF;

  SELECT jsonb_object_agg(dim, sc), avg(sc)::numeric(5,2)
  INTO v_scores, v_geral
  FROM (
    SELECT q.dimensao::text AS dim,
      round(avg(CASE WHEN q.reverso THEN 4-r.resposta ELSE r.resposta END)::numeric * 25, 2) AS sc
    FROM public.nr1_diagnostico_respostas r
    JOIN public.nr1_questoes q ON q.id = r.questao_id
    WHERE r.diagnostico_id = p_diagnostico_id
    GROUP BY q.dimensao
  ) s;

  UPDATE public.nr1_diagnosticos
  SET scores_dimensao = COALESCE(v_scores, '{}'::jsonb),
      score_geral = v_geral,
      nivel_risco = public.nr1_calc_risco(v_geral),
      total_respondentes = v_resp
  WHERE id = p_diagnostico_id;
END
$$;

REVOKE ALL ON FUNCTION public.nr1_recompute_scores(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nr1_recompute_scores(uuid) TO service_role;