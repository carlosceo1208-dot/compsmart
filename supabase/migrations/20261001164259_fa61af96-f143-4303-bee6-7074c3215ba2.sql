CREATE TABLE public.nr1_vitalidade_questoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  dimensao text NOT NULL CHECK (dimensao IN ('energia','recuperacao','equilibrio','satisfacao')),
  origem text NOT NULL CHECK (origem IN ('propria','copsoq')),
  copsoq_questao_id uuid REFERENCES public.nr1_questoes(id),
  enunciado text,
  reverso boolean NOT NULL DEFAULT false,
  ordem integer NOT NULL,
  fonte text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((origem = 'propria' AND enunciado IS NOT NULL AND copsoq_questao_id IS NULL)
      OR (origem = 'copsoq' AND copsoq_questao_id IS NOT NULL AND enunciado IS NULL))
);
GRANT SELECT ON public.nr1_vitalidade_questoes TO authenticated;
GRANT ALL ON public.nr1_vitalidade_questoes TO service_role;
ALTER TABLE public.nr1_vitalidade_questoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY nr1_vitalidade_questoes_read_nr1 ON public.nr1_vitalidade_questoes FOR SELECT TO authenticated
USING (public.has_module('nr1') OR public.has_role(auth.uid(), 'super_admin'::public.app_role));

INSERT INTO public.nr1_vitalidade_questoes (codigo, dimensao, origem, copsoq_questao_id, enunciado, reverso, ordem, fonte) VALUES
('VT-E1','energia','propria',NULL,'No meu trabalho, sinto-me cheio(a) de energia.',false,1,'uwes_vigor'),
('VT-E2','energia','propria',NULL,'Sinto-me ativo(a) e com vigor ao longo do dia.',false,2,'who5'),
('VT-R1','recuperacao','propria',NULL,'Acordo sentindo-me descansado(a) e revigorado(a).',false,3,'who5'),
('VT-R2','recuperacao','propria',NULL,'Consigo me desligar do trabalho e descansar nos momentos de folga.',false,4,'complementar'),
('VT-R3','recuperacao','copsoq',(SELECT id FROM public.nr1_questoes WHERE codigo='SB02'),NULL,true,5,'copsoq_SB02'),
('VT-Q1','equilibrio','propria',NULL,'Tenho tempo e energia para atividades pessoais além do trabalho.',false,6,'complementar'),
('VT-Q2','equilibrio','propria',NULL,'Sinto que o trabalho ocupa espaço demais na minha vida.',true,7,'complementar'),
('VT-Q3','equilibrio','copsoq',(SELECT id FROM public.nr1_questoes WHERE codigo='IT02'),NULL,false,8,'copsoq_IT02'),
('VT-S1','satisfacao','propria',NULL,'Minha vida cotidiana está cheia de coisas que me interessam.',false,9,'who5'),
('VT-S2','satisfacao','propria',NULL,'De modo geral, estou satisfeito(a) com a minha vida.',false,10,'complementar');

CREATE TABLE public.nr1_vitalidade_respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  diagnostico_id uuid NOT NULL REFERENCES public.nr1_diagnosticos(id) ON DELETE CASCADE,
  convite_id uuid REFERENCES public.nr1_convites(id) ON DELETE SET NULL,
  grupo text NOT NULL,
  submission_hash text NOT NULL,
  questao_id uuid NOT NULL REFERENCES public.nr1_vitalidade_questoes(id),
  resposta integer NOT NULL CHECK (resposta BETWEEN 0 AND 4),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (diagnostico_id, submission_hash, questao_id)
);
CREATE INDEX idx_nr1_vit_resp_diag ON public.nr1_vitalidade_respostas(diagnostico_id, grupo);
GRANT ALL ON public.nr1_vitalidade_respostas TO service_role;
ALTER TABLE public.nr1_vitalidade_respostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY nr1_vit_resp_no_read ON public.nr1_vitalidade_respostas FOR SELECT TO authenticated USING (false);

-- Envio atômico completo: COPSOQ + Segurança Psicológica + Vitalidade
CREATE OR REPLACE FUNCTION public.nr1_submeter_completo(p_token text, p_submission_id uuid, p_respostas jsonb, p_respostas_segpsi jsonb, p_respostas_vitalidade jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_diag uuid; v_convite public.nr1_convites%ROWTYPE; v_company uuid; v_total int; v_validas int; v_hash text;
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
  -- Itens de referência: o mesmo valor já respondido no bloco COPSOQ (pergunta exibida uma única vez)
  INSERT INTO public.nr1_vitalidade_respostas (company_id, diagnostico_id, convite_id, grupo, submission_hash, questao_id, resposta)
  SELECT v_company, v_diag, v_convite.id, v_convite.grupo, v_hash, q.id, (p_respostas->>q.copsoq_questao_id::text)::int
  FROM public.nr1_vitalidade_questoes q
  WHERE q.ativo AND q.origem = 'copsoq' AND (p_respostas->>q.copsoq_questao_id::text) ~ '^[0-4]$';
  RETURN v_diag;
END $$;
REVOKE ALL ON FUNCTION public.nr1_submeter_completo(text, uuid, jsonb, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nr1_submeter_completo(text, uuid, jsonb, jsonb, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public._nr1_vitalidade_agregar(p_diag uuid, p_grupos text[])
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH base AS (
    SELECT r.submission_hash, q.dimensao dim, CASE WHEN q.reverso THEN 4 - r.resposta ELSE r.resposta END v
    FROM public.nr1_vitalidade_respostas r JOIN public.nr1_vitalidade_questoes q ON q.id = r.questao_id
    WHERE r.diagnostico_id = p_diag AND (p_grupos IS NULL OR r.grupo = ANY(p_grupos))
  ), dims AS (SELECT dim, round(avg(v)::numeric * 25, 2) sc FROM base GROUP BY dim)
  SELECT jsonb_build_object(
    'total', (SELECT count(DISTINCT submission_hash) FROM base),
    'scores_dimensao', (SELECT jsonb_object_agg(dim, sc) FROM dims),
    'score_geral', (SELECT round(avg(sc), 2) FROM dims))
$$;
REVOKE ALL ON FUNCTION public._nr1_vitalidade_agregar(uuid, text[]) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.nr1_vitalidade_resultado(p_diagnostico_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company uuid; v_escopo text; v_grupos text[]; v_geral jsonb; v_lista jsonb; v_hist jsonb; g record; a jsonb;
BEGIN
  SELECT company_id INTO v_company FROM public.nr1_diagnosticos WHERE id = p_diagnostico_id;
  IF v_company IS NULL OR auth.uid() IS NULL THEN RETURN jsonb_build_object('acesso', 'negado'); END IF;
  IF public.nr1_pode_gerir(v_company) THEN
    v_escopo := 'empresa';
    SELECT array_agg(DISTINCT grupo) INTO v_grupos FROM public.nr1_vitalidade_respostas WHERE diagnostico_id = p_diagnostico_id;
  ELSIF v_company = public.get_user_company_id() AND public.has_role(auth.uid(), 'manager') AND public.has_module('nr1') THEN
    SELECT array_agg(grupo) INTO v_grupos FROM public.nr1_grupo_gestores WHERE company_id = v_company AND gestor_id = auth.uid();
    IF v_grupos IS NULL THEN
      PERFORM public._nr1_segpsi_negar(v_company, 'vitalidade', 'gestor sem grupo vinculado');
      RETURN jsonb_build_object('acesso', 'negado', 'motivo', 'Seu acesso será liberado quando o RH vincular sua equipe a um grupo');
    END IF;
    v_escopo := 'gestor';
  ELSE
    PERFORM public._nr1_segpsi_negar(v_company, 'vitalidade', 'sem permissão para a empresa');
    RETURN jsonb_build_object('acesso', 'negado', 'motivo', 'Acesso negado.');
  END IF;

  v_lista := '[]'::jsonb;
  FOR g IN SELECT unnest(COALESCE(v_grupos, '{}')) grupo ORDER BY 1 LOOP
    a := public._nr1_vitalidade_agregar(p_diagnostico_id, ARRAY[g.grupo]);
    IF (a->>'total')::int >= 5 THEN v_lista := v_lista || jsonb_build_array(a || jsonb_build_object('grupo', g.grupo)); END IF;
  END LOOP;

  IF v_escopo = 'empresa' THEN
    v_geral := public._nr1_vitalidade_agregar(p_diagnostico_id, NULL);
    IF (v_geral->>'total')::int >= 5 THEN
      SELECT jsonb_object_agg(faixa, n) INTO v_hist FROM (
        SELECT CASE WHEN s < 20 THEN '0-20' WHEN s < 40 THEN '20-40' WHEN s < 60 THEN '40-60' WHEN s < 80 THEN '60-80' ELSE '80-100' END faixa, count(*) n
        FROM (SELECT r.submission_hash, avg(CASE WHEN q.reverso THEN 4 - r.resposta ELSE r.resposta END) * 25 s
              FROM public.nr1_vitalidade_respostas r JOIN public.nr1_vitalidade_questoes q ON q.id = r.questao_id
              WHERE r.diagnostico_id = p_diagnostico_id GROUP BY 1) x GROUP BY 1) y;
      v_geral := v_geral || jsonb_build_object('dados_suficientes', true, 'distribuicao', v_hist);
    ELSE
      v_geral := jsonb_build_object('total', (v_geral->>'total')::int, 'dados_suficientes', false);
    END IF;
  END IF;
  RETURN jsonb_build_object('acesso', v_escopo, 'k_minimo', 5, 'empresa', v_geral, 'grupos', v_lista);
END $$;
REVOKE ALL ON FUNCTION public.nr1_vitalidade_resultado(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nr1_vitalidade_resultado(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.nr1_vitalidade_historico(p_company_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v jsonb := '[]'::jsonb; d record; a jsonb;
BEGIN
  IF NOT public.nr1_pode_gerir(p_company_id) THEN
    PERFORM public._nr1_segpsi_negar(p_company_id, 'vitalidade_historico', 'sem permissão para a empresa');
    RETURN jsonb_build_object('acesso', 'negado');
  END IF;
  FOR d IN SELECT id, ciclo_nome, periodo_inicio FROM public.nr1_diagnosticos WHERE company_id = p_company_id ORDER BY periodo_inicio, created_at LOOP
    a := public._nr1_vitalidade_agregar(d.id, NULL);
    IF (a->>'total')::int > 0 THEN
      v := v || jsonb_build_array(jsonb_build_object('diagnostico_id', d.id, 'ciclo_nome', d.ciclo_nome, 'periodo_inicio', d.periodo_inicio,
        'total', (a->>'total')::int, 'dados_suficientes', (a->>'total')::int >= 5,
        'score_geral', CASE WHEN (a->>'total')::int >= 5 THEN a->'score_geral' END,
        'scores_dimensao', CASE WHEN (a->>'total')::int >= 5 THEN a->'scores_dimensao' END));
    END IF;
  END LOOP;
  RETURN jsonb_build_object('acesso', 'empresa', 'ciclos', v);
END $$;
REVOKE ALL ON FUNCTION public.nr1_vitalidade_historico(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nr1_vitalidade_historico(uuid) TO authenticated, service_role;

-- Leitura gerencial do catálogo (NR-1 ou super admin); negação registrada sem desfazer o registro
CREATE OR REPLACE FUNCTION public.nr1_vitalidade_questoes_listar()
RETURNS TABLE(codigo text, dimensao text, origem text, enunciado text, ordem int, reverso boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  IF NOT (public.has_module('nr1') OR public.has_role(auth.uid(), 'super_admin'::public.app_role)) THEN
    v_company := public.get_user_company_id();
    IF v_company IS NOT NULL THEN
      INSERT INTO public.nr1_access_log (company_id, actor_user_id, actor_role, action, resource, blocked, reason)
      VALUES (v_company, auth.uid(), 'authenticated', 'listar', 'nr1_vitalidade_questoes', true, 'sem_modulo_nr1');
    END IF;
    RAISE WARNING 'Acesso negado: módulo NR-1 não contratado';
    RETURN;
  END IF;
  RETURN QUERY SELECT q.codigo, q.dimensao, q.origem, COALESCE(q.enunciado, c.enunciado)::text, q.ordem, q.reverso
    FROM public.nr1_vitalidade_questoes q LEFT JOIN public.nr1_questoes c ON c.id = q.copsoq_questao_id
    WHERE q.ativo ORDER BY q.ordem;
END $$;
REVOKE ALL ON FUNCTION public.nr1_vitalidade_questoes_listar() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nr1_vitalidade_questoes_listar() TO authenticated;