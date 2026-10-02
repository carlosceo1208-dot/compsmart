CREATE TABLE public.nr1_sociodemo_envios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  diagnostico_id uuid NOT NULL REFERENCES public.nr1_diagnosticos(id) ON DELETE CASCADE,
  submission_hash text NOT NULL UNIQUE,
  sexo text, faixa_etaria text, tempo_casa text, area text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.nr1_sociodemo_envios TO service_role;
ALTER TABLE public.nr1_sociodemo_envios ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.nr1_sociodemo_envios(diagnostico_id);

CREATE TABLE public.nr1_sociodemo_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  diagnostico_id uuid NOT NULL REFERENCES public.nr1_diagnosticos(id) ON DELETE CASCADE,
  ciclo_nome text,
  recortes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, diagnostico_id)
);
GRANT SELECT ON public.nr1_sociodemo_results TO authenticated;
GRANT ALL ON public.nr1_sociodemo_results TO service_role;
ALTER TABLE public.nr1_sociodemo_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY nr1_sociodemo_results_select ON public.nr1_sociodemo_results
  FOR SELECT TO authenticated USING (public.nr1_importacao_pode_gerir(company_id));

DROP FUNCTION public.nr1_submeter_completo(text, uuid, jsonb, jsonb, jsonb);
CREATE FUNCTION public.nr1_submeter_completo(p_token text, p_submission_id uuid, p_respostas jsonb, p_respostas_segpsi jsonb, p_respostas_vitalidade jsonb, p_demografia jsonb DEFAULT NULL)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_diag uuid; v_convite public.nr1_convites%ROWTYPE; v_company uuid; v_total int; v_validas int; v_hash text;
  v_sexo text; v_idade text; v_tempo text; v_area text;
BEGIN
  IF p_respostas_vitalidade IS NULL OR jsonb_typeof(p_respostas_vitalidade) <> 'object' THEN
    RAISE EXCEPTION 'Todas as questões devem ser respondidas';
  END IF;
  SELECT count(*) INTO v_total FROM public.nr1_vitalidade_questoes WHERE ativo AND origem = 'propria';
  SELECT count(*) INTO v_validas FROM jsonb_each_text(p_respostas_vitalidade) r
    JOIN public.nr1_vitalidade_questoes q ON q.id::text = r.key AND q.ativo AND q.origem = 'propria' WHERE r.value ~ '^[0-4]$';
  IF v_validas <> v_total OR (SELECT count(*) FROM jsonb_object_keys(p_respostas_vitalidade)) <> v_total THEN
    RAISE EXCEPTION 'Todas as questões devem ser respondidas';
  END IF;

  v_diag := public.nr1_submeter_com_segpsi(p_token, p_submission_id, p_respostas, p_respostas_segpsi);

  SELECT * INTO v_convite FROM public.nr1_convites WHERE token = p_token;
  SELECT company_id INTO v_company FROM public.nr1_diagnosticos WHERE id = v_diag;
  v_hash := encode(extensions.digest(v_convite.id::text || ':' || p_submission_id::text, 'sha256'), 'hex');

  INSERT INTO public.nr1_vitalidade_respostas (company_id, diagnostico_id, convite_id, grupo, submission_hash, questao_id, resposta)
  SELECT v_company, v_diag, v_convite.id, v_convite.grupo, v_hash, q.id, r.value::int
  FROM jsonb_each_text(p_respostas_vitalidade) r JOIN public.nr1_vitalidade_questoes q ON q.id::text = r.key AND q.ativo AND q.origem = 'propria';
  INSERT INTO public.nr1_vitalidade_respostas (company_id, diagnostico_id, convite_id, grupo, submission_hash, questao_id, resposta)
  SELECT v_company, v_diag, v_convite.id, v_convite.grupo, v_hash, q.id, (p_respostas->>q.copsoq_questao_id::text)::int
  FROM public.nr1_vitalidade_questoes q
  WHERE q.ativo AND q.origem = 'copsoq' AND (p_respostas->>q.copsoq_questao_id::text) ~ '^[0-4]$';

  -- Perfil opcional: só valores de listas fixas; área só da lista da empresa (gravada como rótulo)
  IF p_demografia IS NOT NULL AND jsonb_typeof(p_demografia) = 'object' THEN
    v_sexo := NULLIF(p_demografia->>'sexo','');
    IF v_sexo IS NOT NULL AND v_sexo NOT IN ('Feminino','Masculino','Outro') THEN v_sexo := NULL; END IF;
    v_idade := NULLIF(p_demografia->>'faixa_etaria','');
    IF v_idade IS NOT NULL AND v_idade NOT IN ('Até 29 anos','30 a 44 anos','45 anos ou mais') THEN v_idade := NULL; END IF;
    v_tempo := NULLIF(p_demografia->>'tempo_casa','');
    IF v_tempo IS NOT NULL AND v_tempo NOT IN ('Menos de 2 anos','2 a 5 anos','Mais de 5 anos') THEN v_tempo := NULL; END IF;
    v_area := NULLIF(p_demografia->>'area','');
    IF v_area IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.organizational_structure o
      WHERE (o.root_company_id = v_company OR o.parent_id = v_company) AND o.id <> v_company AND o.name = v_area
    ) THEN v_area := NULL; END IF;
    IF COALESCE(v_sexo, v_idade, v_tempo, v_area) IS NOT NULL THEN
      INSERT INTO public.nr1_sociodemo_envios (company_id, diagnostico_id, submission_hash, sexo, faixa_etaria, tempo_casa, area)
      VALUES (v_company, v_diag, v_hash, v_sexo, v_idade, v_tempo, v_area)
      ON CONFLICT (submission_hash) DO NOTHING;
    END IF;
  END IF;
  RETURN v_diag;
END $function$;
REVOKE ALL ON FUNCTION public.nr1_submeter_completo(text, uuid, jsonb, jsonb, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nr1_submeter_completo(text, uuid, jsonb, jsonb, jsonb, jsonb) TO service_role;

CREATE FUNCTION public.nr1_sociodemo_consolidar(_diag uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_company uuid; v_ciclo text; v_recortes jsonb;
BEGIN
  SELECT company_id, ciclo_nome INTO v_company, v_ciclo FROM public.nr1_diagnosticos WHERE id = _diag;
  IF v_company IS NULL OR NOT public.nr1_importacao_pode_gerir(v_company) THEN
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
      jsonb_agg(jsonb_build_object('rotulo', rotulo, 'segPsi', sp, 'fib', NULL, 'hse', NULL, 'n', n) ORDER BY rotulo) linhas
    FROM lin GROUP BY rec, ord
  ) t;
  INSERT INTO public.nr1_sociodemo_results (company_id, diagnostico_id, ciclo_nome, recortes)
  VALUES (v_company, _diag, v_ciclo, v_recortes)
  ON CONFLICT (company_id, diagnostico_id) DO UPDATE SET recortes = EXCLUDED.recortes, ciclo_nome = EXCLUDED.ciclo_nome, updated_at = now();
  RETURN v_recortes;
END $function$;
REVOKE ALL ON FUNCTION public.nr1_sociodemo_consolidar(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nr1_sociodemo_consolidar(uuid) TO authenticated, service_role;