CREATE OR REPLACE FUNCTION public.nr1_sociodemo_consolidar(_diag uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_company uuid; v_ciclo text; v_recortes jsonb;
BEGIN
  SELECT company_id, ciclo_nome INTO v_company, v_ciclo FROM public.nr1_diagnosticos WHERE id = _diag;
  IF v_company IS NULL OR (pg_trigger_depth() = 0 AND NOT public.nr1_importacao_pode_gerir(v_company)) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  WITH sp AS (
    SELECT r.submission_hash, avg(CASE WHEN q.reverso THEN 4 - r.resposta ELSE r.resposta END) * 25 v
    FROM public.nr1_segpsi_respostas r JOIN public.nr1_segpsi_questoes q ON q.id = r.questao_id
    WHERE r.diagnostico_id = _diag GROUP BY 1
  ), base AS (
    SELECT e.*, sp.v FROM public.nr1_sociodemo_envios e LEFT JOIN sp USING (submission_hash) WHERE e.diagnostico_id = _diag
  ), lin AS (
    SELECT rec, ord, rotulo, count(*) n, round(avg(v))::int sp FROM (
      SELECT 'genero' rec, 1 ord, sexo rotulo, v FROM base WHERE sexo IS NOT NULL
      UNION ALL SELECT 'idade', 2, faixa_etaria, v FROM base WHERE faixa_etaria IS NOT NULL
      UNION ALL SELECT 'tempo', 3, tempo_casa, v FROM base WHERE tempo_casa IS NOT NULL
      UNION ALL SELECT 'area', 4, area, v FROM base WHERE area IS NOT NULL
    ) x GROUP BY rec, ord, rotulo HAVING count(*) >= 5
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', rec, 'titulo', titulo, 'linhas', linhas) ORDER BY ord), '[]'::jsonb)
  INTO v_recortes FROM (
    SELECT rec, ord, CASE rec WHEN 'genero' THEN 'Por sexo' WHEN 'idade' THEN 'Por faixa etária' WHEN 'tempo' THEN 'Por tempo de casa' ELSE 'Por área' END titulo,
      jsonb_agg(jsonb_build_object('rotulo', rotulo, 'segPsi', sp, 'fib', NULL, 'hse', NULL) ORDER BY rotulo) linhas
    FROM lin GROUP BY rec, ord
  ) t;
  INSERT INTO public.nr1_sociodemo_results (company_id, diagnostico_id, ciclo_nome, recortes)
  VALUES (v_company, _diag, v_ciclo, v_recortes)
  ON CONFLICT (company_id, diagnostico_id) DO UPDATE SET recortes = EXCLUDED.recortes, ciclo_nome = EXCLUDED.ciclo_nome, updated_at = now();
  RETURN v_recortes;
END $function$;

CREATE OR REPLACE FUNCTION public.nr1_sociodemo_ao_concluir()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'concluido' AND OLD.status IS DISTINCT FROM 'concluido' THEN
    PERFORM public.nr1_sociodemo_consolidar(NEW.id);
  END IF;
  RETURN NEW;
END $function$;
REVOKE ALL ON FUNCTION public.nr1_sociodemo_ao_concluir() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER nr1_sociodemo_ao_concluir AFTER UPDATE OF status ON public.nr1_diagnosticos
  FOR EACH ROW EXECUTE FUNCTION public.nr1_sociodemo_ao_concluir();