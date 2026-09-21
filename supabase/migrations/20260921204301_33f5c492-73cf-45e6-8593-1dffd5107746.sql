-- =========================================================
-- RH SERVICE (Consultores Seniores) — backend only
-- =========================================================

-- ---------- helper: quem pode ler / escrever ----------
CREATE OR REPLACE FUNCTION public.rh_service_can_read(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin(auth.uid())
     OR (
       _tenant_id = public.get_user_company_id()
       AND (
         public.has_role(auth.uid(), 'consultor')
         OR public.has_role(auth.uid(), 'admin')
         OR public.has_role(auth.uid(), 'hr_manager')
       )
     )
$$;

CREATE OR REPLACE FUNCTION public.rh_service_can_write(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin(auth.uid())
     OR (
       _tenant_id = public.get_user_company_id()
       AND public.has_role(auth.uid(), 'consultor')
     )
$$;

REVOKE EXECUTE ON FUNCTION public.rh_service_can_read(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rh_service_can_write(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rh_service_can_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rh_service_can_write(uuid) TO authenticated;

-- ---------- consultores ----------
CREATE TABLE public.consultores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  especialidade TEXT,
  bio TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultores TO authenticated;
GRANT ALL ON public.consultores TO service_role;
ALTER TABLE public.consultores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consultores_read" ON public.consultores FOR SELECT TO authenticated
  USING (public.rh_service_can_read(tenant_id));
CREATE POLICY "consultores_write" ON public.consultores FOR ALL TO authenticated
  USING (public.rh_service_can_write(tenant_id))
  WITH CHECK (public.rh_service_can_write(tenant_id));
CREATE TRIGGER update_consultores_updated_at BEFORE UPDATE ON public.consultores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_consultores_tenant ON public.consultores(tenant_id);

-- ---------- projetos ----------
CREATE TABLE public.rh_service_projetos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  consultor_id UUID REFERENCES public.consultores(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  escopo TEXT,
  status TEXT NOT NULL DEFAULT 'proposta' CHECK (status IN ('proposta','em_andamento','concluido')),
  horas_estimadas NUMERIC,
  valor_negociado NUMERIC,
  data_inicio DATE,
  data_fim DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rh_service_projetos TO authenticated;
GRANT ALL ON public.rh_service_projetos TO service_role;
ALTER TABLE public.rh_service_projetos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rh_projetos_read" ON public.rh_service_projetos FOR SELECT TO authenticated
  USING (public.rh_service_can_read(tenant_id));
CREATE POLICY "rh_projetos_write" ON public.rh_service_projetos FOR ALL TO authenticated
  USING (public.rh_service_can_write(tenant_id))
  WITH CHECK (public.rh_service_can_write(tenant_id));
CREATE TRIGGER update_rh_projetos_updated_at BEFORE UPDATE ON public.rh_service_projetos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_rh_projetos_tenant ON public.rh_service_projetos(tenant_id);
CREATE INDEX idx_rh_projetos_consultor ON public.rh_service_projetos(consultor_id);

CREATE OR REPLACE FUNCTION public.rh_service_validar_datas_projeto()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.data_inicio IS NOT NULL AND NEW.data_fim IS NOT NULL AND NEW.data_fim < NEW.data_inicio THEN
    RAISE EXCEPTION 'data_fim não pode ser anterior a data_inicio';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validar_datas_rh_projetos BEFORE INSERT OR UPDATE ON public.rh_service_projetos
  FOR EACH ROW EXECUTE FUNCTION public.rh_service_validar_datas_projeto();

-- ---------- horas ----------
CREATE TABLE public.rh_service_horas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  projeto_id UUID NOT NULL REFERENCES public.rh_service_projetos(id) ON DELETE CASCADE,
  consultor_id UUID REFERENCES public.consultores(id) ON DELETE SET NULL,
  horas NUMERIC NOT NULL CHECK (horas > 0),
  descricao TEXT,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rh_service_horas TO authenticated;
GRANT ALL ON public.rh_service_horas TO service_role;
ALTER TABLE public.rh_service_horas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rh_horas_read" ON public.rh_service_horas FOR SELECT TO authenticated
  USING (public.rh_service_can_read(tenant_id));
CREATE POLICY "rh_horas_write" ON public.rh_service_horas FOR ALL TO authenticated
  USING (public.rh_service_can_write(tenant_id))
  WITH CHECK (public.rh_service_can_write(tenant_id));
CREATE TRIGGER update_rh_horas_updated_at BEFORE UPDATE ON public.rh_service_horas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_rh_horas_tenant ON public.rh_service_horas(tenant_id);
CREATE INDEX idx_rh_horas_projeto ON public.rh_service_horas(projeto_id);

-- ---------- questionário versionado (catálogo global) ----------
CREATE TABLE public.rh_service_maturidade_versoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  versao INTEGER NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rh_service_maturidade_versoes TO authenticated;
GRANT ALL ON public.rh_service_maturidade_versoes TO service_role;
ALTER TABLE public.rh_service_maturidade_versoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rh_versoes_read" ON public.rh_service_maturidade_versoes FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'consultor'));
CREATE POLICY "rh_versoes_write" ON public.rh_service_maturidade_versoes FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER update_rh_versoes_updated_at BEFORE UPDATE ON public.rh_service_maturidade_versoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.rh_service_maturidade_questoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  versao_id UUID NOT NULL REFERENCES public.rh_service_maturidade_versoes(id) ON DELETE CASCADE,
  pratica TEXT NOT NULL,
  module_slug TEXT REFERENCES public.modules(slug) ON UPDATE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 1,
  enunciado TEXT NOT NULL,
  peso NUMERIC NOT NULL DEFAULT 1 CHECK (peso > 0),
  escala_max NUMERIC NOT NULL DEFAULT 5 CHECK (escala_max > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (versao_id, pratica, ordem)
);
GRANT SELECT ON public.rh_service_maturidade_questoes TO authenticated;
GRANT ALL ON public.rh_service_maturidade_questoes TO service_role;
ALTER TABLE public.rh_service_maturidade_questoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rh_questoes_read" ON public.rh_service_maturidade_questoes FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'consultor'));
CREATE POLICY "rh_questoes_write" ON public.rh_service_maturidade_questoes FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER update_rh_questoes_updated_at BEFORE UPDATE ON public.rh_service_maturidade_questoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_rh_questoes_versao ON public.rh_service_maturidade_questoes(versao_id);

-- ---------- diagnósticos ----------
CREATE TABLE public.rh_service_diagnosticos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  versao_id UUID NOT NULL REFERENCES public.rh_service_maturidade_versoes(id),
  projeto_id UUID REFERENCES public.rh_service_projetos(id) ON DELETE SET NULL,
  consultor_id UUID REFERENCES public.consultores(id) ON DELETE SET NULL,
  modulo_avaliado TEXT REFERENCES public.modules(slug) ON UPDATE CASCADE,
  maturidade NUMERIC CHECK (maturidade IS NULL OR (maturidade >= 0 AND maturidade <= 100)),
  nivel TEXT,
  diagnostico JSONB NOT NULL DEFAULT '{}'::jsonb,
  recomendacoes JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','concluido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rh_service_diagnosticos TO authenticated;
GRANT ALL ON public.rh_service_diagnosticos TO service_role;
ALTER TABLE public.rh_service_diagnosticos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rh_diag_read" ON public.rh_service_diagnosticos FOR SELECT TO authenticated
  USING (public.rh_service_can_read(tenant_id));
CREATE POLICY "rh_diag_write" ON public.rh_service_diagnosticos FOR ALL TO authenticated
  USING (public.rh_service_can_write(tenant_id))
  WITH CHECK (public.rh_service_can_write(tenant_id));
CREATE TRIGGER update_rh_diag_updated_at BEFORE UPDATE ON public.rh_service_diagnosticos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_rh_diag_tenant ON public.rh_service_diagnosticos(tenant_id);
CREATE INDEX idx_rh_diag_projeto ON public.rh_service_diagnosticos(projeto_id);

-- ---------- respostas ----------
CREATE TABLE public.rh_service_diagnostico_respostas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  diagnostico_id UUID NOT NULL REFERENCES public.rh_service_diagnosticos(id) ON DELETE CASCADE,
  questao_id UUID NOT NULL REFERENCES public.rh_service_maturidade_questoes(id),
  versao_id UUID NOT NULL REFERENCES public.rh_service_maturidade_versoes(id),
  resposta_numerica NUMERIC,
  resposta_texto TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (diagnostico_id, questao_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rh_service_diagnostico_respostas TO authenticated;
GRANT ALL ON public.rh_service_diagnostico_respostas TO service_role;
ALTER TABLE public.rh_service_diagnostico_respostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rh_resp_read" ON public.rh_service_diagnostico_respostas FOR SELECT TO authenticated
  USING (public.rh_service_can_read(tenant_id));
CREATE POLICY "rh_resp_write" ON public.rh_service_diagnostico_respostas FOR ALL TO authenticated
  USING (public.rh_service_can_write(tenant_id))
  WITH CHECK (public.rh_service_can_write(tenant_id));
CREATE TRIGGER update_rh_resp_updated_at BEFORE UPDATE ON public.rh_service_diagnostico_respostas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_rh_resp_diag ON public.rh_service_diagnostico_respostas(diagnostico_id);
CREATE INDEX idx_rh_resp_questao ON public.rh_service_diagnostico_respostas(questao_id);
CREATE INDEX idx_rh_resp_tenant ON public.rh_service_diagnostico_respostas(tenant_id);

CREATE OR REPLACE FUNCTION public.rh_service_validar_resposta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_diag_versao UUID;
  v_diag_tenant UUID;
  v_questao_versao UUID;
BEGIN
  SELECT versao_id, tenant_id INTO v_diag_versao, v_diag_tenant
  FROM public.rh_service_diagnosticos WHERE id = NEW.diagnostico_id;

  SELECT versao_id INTO v_questao_versao
  FROM public.rh_service_maturidade_questoes WHERE id = NEW.questao_id;

  IF v_diag_versao IS NULL THEN
    RAISE EXCEPTION 'Diagnóstico inexistente';
  END IF;

  IF NEW.versao_id <> v_diag_versao THEN
    RAISE EXCEPTION 'A versão da resposta deve ser a mesma do diagnóstico';
  END IF;

  IF v_questao_versao <> v_diag_versao THEN
    RAISE EXCEPTION 'A questão não pertence à versão do questionário registrada no diagnóstico';
  END IF;

  NEW.tenant_id := v_diag_tenant;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validar_rh_resposta BEFORE INSERT OR UPDATE ON public.rh_service_diagnostico_respostas
  FOR EACH ROW EXECUTE FUNCTION public.rh_service_validar_resposta();

-- ---------- scores por prática ----------
CREATE OR REPLACE FUNCTION public.rh_service_calcular_nivel(_score NUMERIC)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _score IS NULL THEN NULL
    WHEN _score < 30 THEN 'inicial'
    WHEN _score < 60 THEN 'em_desenvolvimento'
    WHEN _score < 85 THEN 'estruturado'
    ELSE 'avancado'
  END
$$;

CREATE TABLE public.rh_service_diagnostico_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  diagnostico_id UUID NOT NULL REFERENCES public.rh_service_diagnosticos(id) ON DELETE CASCADE,
  pratica TEXT NOT NULL,
  module_slug TEXT REFERENCES public.modules(slug) ON UPDATE CASCADE,
  score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
  nivel TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (diagnostico_id, pratica)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rh_service_diagnostico_scores TO authenticated;
GRANT ALL ON public.rh_service_diagnostico_scores TO service_role;
ALTER TABLE public.rh_service_diagnostico_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rh_scores_read" ON public.rh_service_diagnostico_scores FOR SELECT TO authenticated
  USING (public.rh_service_can_read(tenant_id));
CREATE POLICY "rh_scores_write" ON public.rh_service_diagnostico_scores FOR ALL TO authenticated
  USING (public.rh_service_can_write(tenant_id))
  WITH CHECK (public.rh_service_can_write(tenant_id));
CREATE TRIGGER update_rh_scores_updated_at BEFORE UPDATE ON public.rh_service_diagnostico_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_rh_scores_diag ON public.rh_service_diagnostico_scores(diagnostico_id);
CREATE INDEX idx_rh_scores_tenant ON public.rh_service_diagnostico_scores(tenant_id);

CREATE OR REPLACE FUNCTION public.rh_service_preencher_nivel()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.nivel := public.rh_service_calcular_nivel(NEW.score);
  RETURN NEW;
END;
$$;
CREATE TRIGGER preencher_nivel_rh_scores BEFORE INSERT OR UPDATE ON public.rh_service_diagnostico_scores
  FOR EACH ROW EXECUTE FUNCTION public.rh_service_preencher_nivel();

-- ---------- recomendações ----------
CREATE TABLE public.rh_service_recomendacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  diagnostico_id UUID NOT NULL REFERENCES public.rh_service_diagnosticos(id) ON DELETE CASCADE,
  module_slug TEXT NOT NULL REFERENCES public.modules(slug) ON UPDATE CASCADE,
  pratica TEXT,
  justificativa TEXT,
  origem TEXT NOT NULL DEFAULT 'manual' CHECK (origem IN ('auto','editada','manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (diagnostico_id, module_slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rh_service_recomendacoes TO authenticated;
GRANT ALL ON public.rh_service_recomendacoes TO service_role;
ALTER TABLE public.rh_service_recomendacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rh_reco_read" ON public.rh_service_recomendacoes FOR SELECT TO authenticated
  USING (public.rh_service_can_read(tenant_id));
CREATE POLICY "rh_reco_write" ON public.rh_service_recomendacoes FOR ALL TO authenticated
  USING (public.rh_service_can_write(tenant_id))
  WITH CHECK (public.rh_service_can_write(tenant_id));
CREATE TRIGGER update_rh_reco_updated_at BEFORE UPDATE ON public.rh_service_recomendacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_rh_reco_diag ON public.rh_service_recomendacoes(diagnostico_id);
CREATE INDEX idx_rh_reco_tenant ON public.rh_service_recomendacoes(tenant_id);

CREATE OR REPLACE FUNCTION public.rh_service_marcar_reco_editada()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.origem = 'auto'
     AND (NEW.justificativa IS DISTINCT FROM OLD.justificativa
          OR NEW.module_slug IS DISTINCT FROM OLD.module_slug
          OR NEW.pratica IS DISTINCT FROM OLD.pratica)
     AND NEW.origem = OLD.origem THEN
    NEW.origem := 'editada';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER marcar_reco_editada BEFORE UPDATE ON public.rh_service_recomendacoes
  FOR EACH ROW EXECUTE FUNCTION public.rh_service_marcar_reco_editada();

-- ---------- cálculo de scores (somente questões da versão do diagnóstico) ----------
CREATE OR REPLACE FUNCTION public.rh_service_calcular_scores(_diagnostico_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant UUID;
  v_versao UUID;
BEGIN
  SELECT tenant_id, versao_id INTO v_tenant, v_versao
  FROM public.rh_service_diagnosticos WHERE id = _diagnostico_id;

  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'Diagnóstico inexistente';
  END IF;

  IF NOT public.rh_service_can_write(v_tenant) THEN
    RAISE EXCEPTION 'Sem permissão para recalcular este diagnóstico';
  END IF;

  INSERT INTO public.rh_service_diagnostico_scores (tenant_id, diagnostico_id, pratica, module_slug, score)
  SELECT v_tenant,
         _diagnostico_id,
         q.pratica,
         MIN(q.module_slug),
         ROUND(
           SUM(r.resposta_numerica * q.peso) / NULLIF(SUM(q.escala_max * q.peso), 0) * 100,
           2
         )
  FROM public.rh_service_diagnostico_respostas r
  JOIN public.rh_service_maturidade_questoes q ON q.id = r.questao_id
  WHERE r.diagnostico_id = _diagnostico_id
    AND q.versao_id = v_versao
    AND r.versao_id = v_versao
    AND r.resposta_numerica IS NOT NULL
  GROUP BY q.pratica
  ON CONFLICT (diagnostico_id, pratica) DO UPDATE
    SET score = EXCLUDED.score,
        module_slug = EXCLUDED.module_slug,
        updated_at = now();

  UPDATE public.rh_service_diagnosticos d
  SET maturidade = sub.media,
      nivel = public.rh_service_calcular_nivel(sub.media),
      updated_at = now()
  FROM (
    SELECT ROUND(AVG(score), 2) AS media
    FROM public.rh_service_diagnostico_scores
    WHERE diagnostico_id = _diagnostico_id
  ) sub
  WHERE d.id = _diagnostico_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rh_service_gerar_recomendacoes(_diagnostico_id UUID, _limiar NUMERIC DEFAULT 60)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant UUID;
  v_count INTEGER;
BEGIN
  SELECT tenant_id INTO v_tenant FROM public.rh_service_diagnosticos WHERE id = _diagnostico_id;

  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'Diagnóstico inexistente';
  END IF;

  IF NOT public.rh_service_can_write(v_tenant) THEN
    RAISE EXCEPTION 'Sem permissão para gerar recomendações deste diagnóstico';
  END IF;

  INSERT INTO public.rh_service_recomendacoes (tenant_id, diagnostico_id, module_slug, pratica, justificativa, origem)
  SELECT v_tenant,
         _diagnostico_id,
         s.module_slug,
         s.pratica,
         'Prática "' || s.pratica || '" com maturidade ' || s.score || ' (' || COALESCE(s.nivel, '-') || '), abaixo do limiar de ' || _limiar || '.',
         'auto'
  FROM public.rh_service_diagnostico_scores s
  WHERE s.diagnostico_id = _diagnostico_id
    AND s.module_slug IS NOT NULL
    AND s.score < _limiar
  ON CONFLICT (diagnostico_id, module_slug) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rh_service_calcular_nivel(NUMERIC) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rh_service_calcular_scores(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rh_service_gerar_recomendacoes(UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rh_service_calcular_nivel(NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rh_service_calcular_scores(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rh_service_gerar_recomendacoes(UUID, NUMERIC) TO authenticated;

-- ---------- seed do questionário v1 (9 práticas) ----------
-- Decisão de produto: a 9ª prática ("descrição de cargos e job matching",
-- module_slug 'match') foi incluída propositalmente no seed inicial.
INSERT INTO public.rh_service_maturidade_versoes (versao, nome, descricao)
VALUES (1, 'Maturidade de RH v1', 'Diagnóstico de maturidade por prática de RH — escala 0 a 5 por questão.')
ON CONFLICT (versao) DO NOTHING;

INSERT INTO public.rh_service_maturidade_questoes (versao_id, pratica, module_slug, ordem, enunciado, peso, escala_max)
SELECT v.id, x.pratica, x.module_slug, x.ordem, x.enunciado, 1, 5
FROM public.rh_service_maturidade_versoes v
CROSS JOIN (VALUES
  ('estrutura_de_cargos', 'core', 1, 'A empresa possui estrutura de cargos e níveis formalizada e atualizada?'),
  ('estrutura_de_cargos', 'core', 2, 'Os critérios de progressão entre níveis são claros e comunicados?'),
  ('remuneracao', 'core', 1, 'Existe tabela salarial com faixas definidas e governança de reajustes?'),
  ('remuneracao', 'core', 2, 'A empresa compara sua remuneração com o mercado de forma periódica?'),
  ('desempenho', 'core', 1, 'Há ciclo formal de avaliação de desempenho com metas acordadas?'),
  ('desempenho', 'core', 2, 'Os resultados da avaliação influenciam decisões de mérito e desenvolvimento?'),
  ('clima', 'clima', 1, 'A empresa mede clima organizacional e eNPS com regularidade?'),
  ('clima', 'clima', 2, 'Os resultados de clima geram planos de ação acompanhados?'),
  ('nr1', 'nr1', 1, 'A empresa realiza avaliação de riscos psicossociais conforme a NR-1?'),
  ('nr1', 'nr1', 2, 'Existem planos de ação e evidências documentadas para riscos psicossociais?'),
  ('selecao', 'talent', 1, 'O processo de seleção é padronizado, com critérios e etapas definidas?'),
  ('selecao', 'talent', 2, 'Há indicadores de seleção acompanhados (tempo, qualidade, aderência)?'),
  ('treinamento_desenvolvimento', 'evolve', 1, 'Existem trilhas de desenvolvimento e PDI formalizados?'),
  ('treinamento_desenvolvimento', 'evolve', 2, 'O desenvolvimento é planejado a partir de lacunas de competência identificadas?'),
  ('sucessao', 'potencial-sucessao', 1, 'A empresa mapeia potencial e mantém matriz 9-Box atualizada?'),
  ('sucessao', 'potencial-sucessao', 2, 'Existem planos de sucessão para posições críticas?'),
  ('descricao_cargos_job_matching', 'match', 1, 'As descrições de cargo estão completas e alinhadas a referências de mercado?'),
  ('descricao_cargos_job_matching', 'match', 2, 'Há processo de job matching para comparar cargos internos com o mercado?')
) AS x(pratica, module_slug, ordem, enunciado)
WHERE v.versao = 1
ON CONFLICT (versao_id, pratica, ordem) DO NOTHING;