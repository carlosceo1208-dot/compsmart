CREATE TABLE public.nr1_segpsi_questoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  dimensao public.nr1_dimensao NOT NULL,
  enunciado text NOT NULL,
  reverso boolean NOT NULL DEFAULT false,
  ordem integer NOT NULL,
  fonte text NOT NULL DEFAULT 'complementar',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.nr1_segpsi_questoes TO authenticated;
GRANT ALL ON public.nr1_segpsi_questoes TO service_role;
ALTER TABLE public.nr1_segpsi_questoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY nr1_segpsi_questoes_read ON public.nr1_segpsi_questoes FOR SELECT TO authenticated USING (true);

INSERT INTO public.nr1_segpsi_questoes (codigo, dimensao, enunciado, reverso, ordem, fonte) VALUES
('SP01','relacoes_lideranca','Se eu cometer um erro nesta equipe, isso costuma ser usado contra mim.',true,1,'edmondson'),
('SP02','relacoes_lideranca','As pessoas desta equipe conseguem trazer à tona problemas e questões difíceis.',false,2,'edmondson'),
('SP03','valores_trabalho','As pessoas desta equipe às vezes rejeitam outras por serem diferentes.',true,3,'edmondson'),
('SP04','organizacao_conteudo','É seguro assumir riscos nesta equipe.',false,4,'edmondson'),
('SP05','relacoes_lideranca','É difícil pedir ajuda a outras pessoas desta equipe.',true,5,'edmondson'),
('SP06','valores_trabalho','Ninguém nesta equipe agiria deliberadamente para prejudicar meus esforços.',false,6,'edmondson'),
('SP07','valores_trabalho','Trabalhando nesta equipe, minhas habilidades e talentos são valorizados e utilizados.',false,7,'edmondson'),
('SP08','relacoes_lideranca','Confio que meu líder me apoiará se eu levantar um problema.',false,8,'complementar'),
('SP09','relacoes_lideranca','Sinto-me à vontade para discordar do meu líder.',false,9,'complementar'),
('SP10','interface_trabalho_individuo','Tenho medo de sofrer consequências negativas se der minha opinião sincera.',true,10,'complementar'),
('SP11','organizacao_conteudo','Posso admitir um erro sem receio de punição.',false,11,'complementar');

CREATE TABLE public.nr1_segpsi_respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  diagnostico_id uuid NOT NULL REFERENCES public.nr1_diagnosticos(id) ON DELETE CASCADE,
  convite_id uuid REFERENCES public.nr1_convites(id) ON DELETE SET NULL,
  grupo text NOT NULL,
  submission_hash text NOT NULL,
  questao_id uuid NOT NULL REFERENCES public.nr1_segpsi_questoes(id),
  resposta integer NOT NULL CHECK (resposta BETWEEN 0 AND 4),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (diagnostico_id, submission_hash, questao_id)
);
CREATE INDEX idx_nr1_segpsi_resp_diag ON public.nr1_segpsi_respostas(diagnostico_id, grupo);
GRANT ALL ON public.nr1_segpsi_respostas TO service_role;
ALTER TABLE public.nr1_segpsi_respostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY nr1_segpsi_resp_no_read ON public.nr1_segpsi_respostas FOR SELECT TO authenticated USING (false);

CREATE TABLE public.nr1_grupo_gestores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  grupo text NOT NULL,
  gestor_id uuid NOT NULL,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, grupo, gestor_id)
);
GRANT SELECT, INSERT, DELETE ON public.nr1_grupo_gestores TO authenticated;
GRANT ALL ON public.nr1_grupo_gestores TO service_role;
ALTER TABLE public.nr1_grupo_gestores ENABLE ROW LEVEL SECURITY;
CREATE POLICY nr1_grupo_gestores_manage ON public.nr1_grupo_gestores FOR ALL TO authenticated
  USING (public.nr1_pode_gerir(company_id)) WITH CHECK (public.nr1_pode_gerir(company_id));
CREATE POLICY nr1_grupo_gestores_self ON public.nr1_grupo_gestores FOR SELECT TO authenticated
  USING (gestor_id = auth.uid());

-- Envio atômico: diagnóstico + segurança psicológica na mesma transação
CREATE OR REPLACE FUNCTION public.nr1_submeter_com_segpsi(p_token text, p_submission_id uuid, p_respostas jsonb, p_respostas_segpsi jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_diag uuid; v_convite public.nr1_convites%ROWTYPE; v_company uuid;
  v_total integer; v_validas integer; v_hash text;
BEGIN
  IF p_respostas_segpsi IS NULL OR jsonb_typeof(p_respostas_segpsi) <> 'object' THEN
    RAISE EXCEPTION 'Todas as questões devem ser respondidas';
  END IF;
  SELECT count(*) INTO v_total FROM public.nr1_segpsi_questoes WHERE ativo;
  SELECT count(*) INTO v_validas FROM jsonb_each_text(p_respostas_segpsi) r
    JOIN public.nr1_segpsi_questoes q ON q.id::text = r.key AND q.ativo WHERE r.value ~ '^[0-4]$';
  IF v_validas <> v_total OR (SELECT count(*) FROM jsonb_object_keys(p_respostas_segpsi)) <> v_total THEN
    RAISE EXCEPTION 'Todas as questões devem ser respondidas';
  END IF;

  v_diag := public.nr1_submeter_respostas(p_token, p_submission_id, p_respostas);

  SELECT * INTO v_convite FROM public.nr1_convites WHERE token = p_token;
  SELECT company_id INTO v_company FROM public.nr1_diagnosticos WHERE id = v_diag;
  v_hash := encode(extensions.digest(v_convite.id::text || ':' || p_submission_id::text, 'sha256'), 'hex');

  INSERT INTO public.nr1_segpsi_respostas (company_id, diagnostico_id, convite_id, grupo, submission_hash, questao_id, resposta)
  SELECT v_company, v_diag, v_convite.id, v_convite.grupo, v_hash, q.id, r.value::integer
  FROM jsonb_each_text(p_respostas_segpsi) r JOIN public.nr1_segpsi_questoes q ON q.id::text = r.key AND q.ativo;
  RETURN v_diag;
END $$;
REVOKE ALL ON FUNCTION public.nr1_submeter_com_segpsi(text, uuid, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nr1_submeter_com_segpsi(text, uuid, jsonb, jsonb) TO service_role;

-- Agregação interna (sem checagem; só chamada pelas funções abaixo)
CREATE OR REPLACE FUNCTION public._nr1_segpsi_agregar(p_diag uuid, p_grupos text[])
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH base AS (
    SELECT r.submission_hash, q.dimensao::text dim, CASE WHEN q.reverso THEN 4 - r.resposta ELSE r.resposta END v
    FROM public.nr1_segpsi_respostas r JOIN public.nr1_segpsi_questoes q ON q.id = r.questao_id
    WHERE r.diagnostico_id = p_diag AND (p_grupos IS NULL OR r.grupo = ANY(p_grupos))
  ), dims AS (SELECT dim, round(avg(v)::numeric * 25, 2) sc FROM base GROUP BY dim)
  SELECT jsonb_build_object(
    'total', (SELECT count(DISTINCT submission_hash) FROM base),
    'scores_dimensao', (SELECT jsonb_object_agg(dim, sc) FROM dims),
    'score_geral', (SELECT round(avg(sc), 2) FROM dims))
$$;
REVOKE ALL ON FUNCTION public._nr1_segpsi_agregar(uuid, text[]) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public._nr1_segpsi_negar(p_company uuid, p_resource text, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND p_company IS NOT NULL THEN
    INSERT INTO public.nr1_access_log (company_id, actor_user_id, actor_role, action, resource, blocked, reason, k_value)
    VALUES (p_company, auth.uid(), 'authenticated', 'view_dashboard', p_resource, true, p_reason, 5);
  END IF;
END $$;
REVOKE ALL ON FUNCTION public._nr1_segpsi_negar(uuid, text, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.nr1_segpsi_resultado(p_diagnostico_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company uuid; v_escopo text; v_grupos text[]; v_geral jsonb; v_lista jsonb; v_hist jsonb; g record;
BEGIN
  SELECT company_id INTO v_company FROM public.nr1_diagnosticos WHERE id = p_diagnostico_id;
  IF v_company IS NULL OR auth.uid() IS NULL THEN
    RETURN jsonb_build_object('acesso', 'negado');
  END IF;
  IF public.nr1_pode_gerir(v_company) THEN
    v_escopo := 'empresa';
    SELECT array_agg(DISTINCT grupo) INTO v_grupos FROM public.nr1_segpsi_respostas WHERE diagnostico_id = p_diagnostico_id;
  ELSIF v_company = public.get_user_company_id() AND public.has_role(auth.uid(), 'manager') AND public.has_module('nr1') THEN
    SELECT array_agg(grupo) INTO v_grupos FROM public.nr1_grupo_gestores WHERE company_id = v_company AND gestor_id = auth.uid();
    IF v_grupos IS NULL THEN
      PERFORM public._nr1_segpsi_negar(v_company, 'segpsi', 'gestor sem grupo vinculado');
      RETURN jsonb_build_object('acesso', 'negado', 'motivo', 'Nenhum grupo vinculado a você.');
    END IF;
    v_escopo := 'gestor';
  ELSE
    PERFORM public._nr1_segpsi_negar(v_company, 'segpsi', 'sem permissão para a empresa');
    RETURN jsonb_build_object('acesso', 'negado', 'motivo', 'Acesso negado.');
  END IF;

  v_lista := '[]'::jsonb;
  FOR g IN SELECT unnest(COALESCE(v_grupos, '{}')) grupo ORDER BY 1 LOOP
    DECLARE a jsonb := public._nr1_segpsi_agregar(p_diagnostico_id, ARRAY[g.grupo]);
    BEGIN
      IF (a->>'total')::int >= 5 THEN
        v_lista := v_lista || jsonb_build_array(a || jsonb_build_object('grupo', g.grupo));
      END IF;
    END;
  END LOOP;

  IF v_escopo = 'empresa' THEN
    v_geral := public._nr1_segpsi_agregar(p_diagnostico_id, NULL);
    IF (v_geral->>'total')::int >= 5 THEN
      SELECT jsonb_object_agg(faixa, n) INTO v_hist FROM (
        SELECT CASE WHEN s < 20 THEN '0-20' WHEN s < 40 THEN '20-40' WHEN s < 60 THEN '40-60' WHEN s < 80 THEN '60-80' ELSE '80-100' END faixa, count(*) n
        FROM (SELECT r.submission_hash, avg(CASE WHEN q.reverso THEN 4 - r.resposta ELSE r.resposta END) * 25 s
              FROM public.nr1_segpsi_respostas r JOIN public.nr1_segpsi_questoes q ON q.id = r.questao_id
              WHERE r.diagnostico_id = p_diagnostico_id GROUP BY 1) x GROUP BY 1) y;
      v_geral := v_geral || jsonb_build_object('dados_suficientes', true, 'distribuicao', v_hist);
    ELSE
      v_geral := jsonb_build_object('total', (v_geral->>'total')::int, 'dados_suficientes', false);
    END IF;
  ELSE
    v_geral := NULL;
  END IF;

  RETURN jsonb_build_object('acesso', v_escopo, 'k_minimo', 5, 'empresa', v_geral, 'grupos', v_lista);
END $$;
REVOKE ALL ON FUNCTION public.nr1_segpsi_resultado(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nr1_segpsi_resultado(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.nr1_segpsi_historico(p_company_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v jsonb := '[]'::jsonb; d record; a jsonb;
BEGIN
  IF NOT public.nr1_pode_gerir(p_company_id) THEN
    PERFORM public._nr1_segpsi_negar(p_company_id, 'segpsi_historico', 'sem permissão para a empresa');
    RETURN jsonb_build_object('acesso', 'negado');
  END IF;
  FOR d IN SELECT id, ciclo_nome, periodo_inicio FROM public.nr1_diagnosticos WHERE company_id = p_company_id ORDER BY periodo_inicio, created_at LOOP
    a := public._nr1_segpsi_agregar(d.id, NULL);
    IF (a->>'total')::int > 0 THEN
      v := v || jsonb_build_array(jsonb_build_object('diagnostico_id', d.id, 'ciclo_nome', d.ciclo_nome, 'periodo_inicio', d.periodo_inicio,
        'total', (a->>'total')::int, 'dados_suficientes', (a->>'total')::int >= 5,
        'score_geral', CASE WHEN (a->>'total')::int >= 5 THEN a->'score_geral' END,
        'scores_dimensao', CASE WHEN (a->>'total')::int >= 5 THEN a->'scores_dimensao' END));
    END IF;
  END LOOP;
  RETURN jsonb_build_object('acesso', 'empresa', 'ciclos', v);
END $$;
REVOKE ALL ON FUNCTION public.nr1_segpsi_historico(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nr1_segpsi_historico(uuid) TO authenticated, service_role;