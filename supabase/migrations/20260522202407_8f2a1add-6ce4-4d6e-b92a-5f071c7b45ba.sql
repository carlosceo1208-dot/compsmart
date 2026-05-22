
-- 1) Padronizar coluna origem e adicionar dimensoes_relacionadas
ALTER TABLE public.nr1_planos_acao
  ADD COLUMN IF NOT EXISTS dimensoes_relacionadas text[] DEFAULT '{}'::text[];

-- Normalizar valores antigos: 'copsoq' -> 'nr1'
UPDATE public.nr1_planos_acao SET origem = 'nr1' WHERE origem = 'copsoq';
UPDATE public.nr1_planos_acao SET origem = 'manual' WHERE origem IS NULL;

-- Constraint de valores válidos (manual, nr1, clima, unificado)
DO $$ BEGIN
  ALTER TABLE public.nr1_planos_acao
    ADD CONSTRAINT nr1_planos_origem_chk
    CHECK (origem IN ('manual','nr1','clima','unificado'));
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_nr1_planos_origem ON public.nr1_planos_acao(company_id, origem);

-- 2) View de correlação Clima x COPSOQ por empresa
-- Para cada empresa, pega a pesquisa de clima mais recente com respostas
-- e o diagnostico NR-1 concluído mais recente, e devolve pares dimensão-a-dimensão.
CREATE OR REPLACE VIEW public.vw_nr1_clima_copsoq_correlacao
WITH (security_invoker = true)
AS
WITH ultimo_clima AS (
  SELECT DISTINCT ON (company_id)
    company_id, id AS clima_id, nome AS clima_nome,
    score_geral AS clima_score_geral, scores_dimensao AS clima_scores,
    total_respondentes AS clima_respondentes, periodo_inicio AS clima_inicio
  FROM public.clima_pesquisas
  WHERE total_respondentes > 0 AND scores_dimensao IS NOT NULL
  ORDER BY company_id, periodo_inicio DESC, created_at DESC
),
ultimo_diag AS (
  SELECT DISTINCT ON (company_id)
    company_id, id AS diagnostico_id, ciclo_nome AS diag_nome,
    score_geral AS diag_score_geral, scores_dimensao AS diag_scores,
    total_respondentes AS diag_respondentes, periodo_inicio AS diag_inicio,
    nivel_risco
  FROM public.nr1_diagnosticos
  WHERE total_respondentes > 0 AND scores_dimensao IS NOT NULL
  ORDER BY company_id, periodo_inicio DESC, created_at DESC
),
mapa(clima_dim, copsoq_dim) AS (
  VALUES
    ('reconhecimento_recompensa','valores_trabalho'),
    ('autonomia_empowerment','organizacao_conteudo'),
    ('equilibrio_trabalho_vida','interface_trabalho_individuo'),
    ('confianca_lideranca','relacoes_lideranca'),
    ('comunicacao_interna','organizacao_conteudo'),
    ('desenvolvimento_profissional','valores_trabalho'),
    ('relacionamento_colegas','relacoes_lideranca'),
    ('seguranca_psicologica','relacoes_lideranca'),
    ('qualidade_ambiente','demandas_trabalho'),
    ('proposito_alinhamento','valores_trabalho')
)
SELECT
  uc.company_id,
  uc.clima_id,
  uc.clima_nome,
  uc.clima_respondentes,
  ud.diagnostico_id,
  ud.diag_nome,
  ud.diag_respondentes,
  m.clima_dim,
  m.copsoq_dim,
  NULLIF((uc.clima_scores ->> m.clima_dim), '')::numeric AS clima_score,
  NULLIF((ud.diag_scores  ->> m.copsoq_dim), '')::numeric AS copsoq_score_raw,
  -- COPSOQ 0-100 (maior = mais risco) -> 1-5 (maior = melhor)
  CASE WHEN (ud.diag_scores ->> m.copsoq_dim) IS NULL THEN NULL
       ELSE 5 - (NULLIF((ud.diag_scores ->> m.copsoq_dim),'')::numeric / 100.0) * 4
  END AS copsoq_score_eq,
  -- status clima
  CASE
    WHEN (uc.clima_scores ->> m.clima_dim) IS NULL THEN 'sem_dados'
    WHEN NULLIF((uc.clima_scores ->> m.clima_dim),'')::numeric <= 3.0 THEN 'critico'
    WHEN NULLIF((uc.clima_scores ->> m.clima_dim),'')::numeric <= 3.5 THEN 'moderado'
    ELSE 'positivo'
  END AS clima_status,
  -- status copsoq (em escala 1-5)
  CASE
    WHEN (ud.diag_scores ->> m.copsoq_dim) IS NULL THEN 'sem_dados'
    WHEN (5 - (NULLIF((ud.diag_scores ->> m.copsoq_dim),'')::numeric / 100.0) * 4) <= 3.0 THEN 'critico'
    WHEN (5 - (NULLIF((ud.diag_scores ->> m.copsoq_dim),'')::numeric / 100.0) * 4) <= 3.5 THEN 'moderado'
    ELSE 'positivo'
  END AS copsoq_status,
  -- prioridade combinada
  CASE
    WHEN (uc.clima_scores ->> m.clima_dim) IS NULL OR (ud.diag_scores ->> m.copsoq_dim) IS NULL THEN 'sem_dados'
    WHEN NULLIF((uc.clima_scores ->> m.clima_dim),'')::numeric <= 3.0
     AND (5 - (NULLIF((ud.diag_scores ->> m.copsoq_dim),'')::numeric / 100.0) * 4) <= 3.0
      THEN 'causa_raiz'
    WHEN NULLIF((uc.clima_scores ->> m.clima_dim),'')::numeric <= 3.0
      OR (5 - (NULLIF((ud.diag_scores ->> m.copsoq_dim),'')::numeric / 100.0) * 4) <= 3.0
      THEN 'atencao'
    ELSE 'ok'
  END AS prioridade
FROM ultimo_clima uc
JOIN ultimo_diag ud ON ud.company_id = uc.company_id
CROSS JOIN mapa m;

GRANT SELECT ON public.vw_nr1_clima_copsoq_correlacao TO authenticated;
