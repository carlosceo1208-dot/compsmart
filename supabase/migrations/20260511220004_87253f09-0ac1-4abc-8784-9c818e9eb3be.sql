
-- ============== ENUMS ==============
CREATE TYPE public.nr1_plan_tier AS ENUM ('essencial', 'pro');
CREATE TYPE public.nr1_subscription_status AS ENUM ('trial', 'active', 'past_due', 'canceled', 'included');
CREATE TYPE public.nr1_dimensao AS ENUM (
  'demandas_trabalho',
  'organizacao_conteudo',
  'relacoes_lideranca',
  'interface_trabalho_individuo',
  'valores_trabalho',
  'saude_bem_estar'
);
CREATE TYPE public.nr1_nivel_risco AS ENUM ('baixo', 'moderado', 'alto', 'critico');
CREATE TYPE public.nr1_diagnostico_status AS ENUM ('em_andamento', 'concluido', 'arquivado');

-- ============== TABLES ==============

-- Subscriptions per company (one row per active subscription)
CREATE TABLE public.nr1_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  plan_tier public.nr1_plan_tier NOT NULL DEFAULT 'essencial',
  status public.nr1_subscription_status NOT NULL DEFAULT 'trial',
  trial_ends_at timestamptz,
  mrr numeric(10,2),
  max_employees integer,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id)
);

-- Global question bank (COPSOQ-III adapted, public read)
CREATE TABLE public.nr1_questoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  dimensao public.nr1_dimensao NOT NULL,
  enunciado text NOT NULL,
  peso numeric(4,2) NOT NULL DEFAULT 1.00,
  ordem integer NOT NULL DEFAULT 0,
  is_free_diagnostic boolean NOT NULL DEFAULT false,
  reverso boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Diagnostic cycles
CREATE TABLE public.nr1_diagnosticos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  ciclo_nome text NOT NULL,
  periodo_inicio date NOT NULL DEFAULT CURRENT_DATE,
  periodo_fim date,
  status public.nr1_diagnostico_status NOT NULL DEFAULT 'em_andamento',
  score_geral numeric(5,2),
  nivel_risco public.nr1_nivel_risco,
  scores_dimensao jsonb,
  total_respondentes integer NOT NULL DEFAULT 0,
  observacoes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_nr1_diag_company ON public.nr1_diagnosticos(company_id);

-- Anonymous responses (LGPD)
CREATE TABLE public.nr1_diagnostico_respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id uuid NOT NULL REFERENCES public.nr1_diagnosticos(id) ON DELETE CASCADE,
  respondent_hash text NOT NULL,
  questao_id uuid NOT NULL REFERENCES public.nr1_questoes(id),
  resposta integer NOT NULL CHECK (resposta BETWEEN 0 AND 4),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (diagnostico_id, respondent_hash, questao_id)
);
CREATE INDEX idx_nr1_resp_diag ON public.nr1_diagnostico_respostas(diagnostico_id);

-- Public landing leads
CREATE TABLE public.nr1_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  empresa text NOT NULL,
  telefone text,
  tamanho_empresa text,
  cargo text,
  score_free numeric(5,2),
  nivel_risco_free public.nr1_nivel_risco,
  respostas_free jsonb,
  origem text DEFAULT 'landing_nr1',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_nr1_leads_email ON public.nr1_leads(email);

-- ============== TIMESTAMPS TRIGGER ==============
CREATE TRIGGER trg_nr1_subs_upd BEFORE UPDATE ON public.nr1_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_nr1_diag_upd BEFORE UPDATE ON public.nr1_diagnosticos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== RLS ==============
ALTER TABLE public.nr1_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nr1_questoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nr1_diagnosticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nr1_diagnostico_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nr1_leads ENABLE ROW LEVEL SECURITY;

-- Subscriptions: only admin/hr_manager of the same company
CREATE POLICY "nr1_subs_select" ON public.nr1_subscriptions FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id()
         AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role]));
CREATE POLICY "nr1_subs_insert" ON public.nr1_subscriptions FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id()
              AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));
CREATE POLICY "nr1_subs_update" ON public.nr1_subscriptions FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id()
         AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));

-- Questions: public read (global bank), only super_admin writes
CREATE POLICY "nr1_questoes_read" ON public.nr1_questoes FOR SELECT
  USING (ativo = true);
CREATE POLICY "nr1_questoes_admin_all" ON public.nr1_questoes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Diagnostics: company-scoped, admin/hr_manager only
CREATE POLICY "nr1_diag_select" ON public.nr1_diagnosticos FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id()
         AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role]));
CREATE POLICY "nr1_diag_insert" ON public.nr1_diagnosticos FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id()
              AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role]));
CREATE POLICY "nr1_diag_update" ON public.nr1_diagnosticos FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id()
         AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role]));
CREATE POLICY "nr1_diag_delete" ON public.nr1_diagnosticos FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id()
         AND public.has_role(auth.uid(), 'admin'::app_role));

-- Responses: anonymous insert allowed for authenticated users of the company; aggregated select for admin/hr_manager
CREATE POLICY "nr1_resp_select" ON public.nr1_diagnostico_respostas FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.nr1_diagnosticos d
    WHERE d.id = diagnostico_id
      AND d.company_id = public.get_user_company_id()
      AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role])
  ));
CREATE POLICY "nr1_resp_insert" ON public.nr1_diagnostico_respostas FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.nr1_diagnosticos d
    WHERE d.id = diagnostico_id
      AND d.company_id = public.get_user_company_id()
      AND d.status = 'em_andamento'
  ));

-- Leads: PUBLIC insert (landing capture), super_admin only read
CREATE POLICY "nr1_leads_public_insert" ON public.nr1_leads FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(nome) BETWEEN 2 AND 120
    AND char_length(email) BETWEEN 5 AND 255
    AND char_length(empresa) BETWEEN 2 AND 200
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );
CREATE POLICY "nr1_leads_admin_select" ON public.nr1_leads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- ============== HELPER FUNCTIONS ==============

-- Compute risk level from score (0-100)
CREATE OR REPLACE FUNCTION public.nr1_calc_risco(score numeric)
RETURNS public.nr1_nivel_risco
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN score IS NULL THEN NULL
    WHEN score <= 25 THEN 'baixo'::public.nr1_nivel_risco
    WHEN score <= 50 THEN 'moderado'::public.nr1_nivel_risco
    WHEN score <= 75 THEN 'alto'::public.nr1_nivel_risco
    ELSE 'critico'::public.nr1_nivel_risco
  END;
$$;

-- Aggregate scores for a diagnostic (writes to scores_dimensao + score_geral)
CREATE OR REPLACE FUNCTION public.nr1_recompute_scores(p_diagnostico_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
  v_scores jsonb;
  v_geral numeric;
  v_resp integer;
BEGIN
  SELECT company_id INTO v_company FROM public.nr1_diagnosticos WHERE id = p_diagnostico_id;
  IF v_company IS NULL THEN RAISE EXCEPTION 'Diagnostico not found'; END IF;

  SELECT jsonb_object_agg(dim, sc), AVG(sc)::numeric(5,2),
         (SELECT COUNT(DISTINCT respondent_hash) FROM public.nr1_diagnostico_respostas WHERE diagnostico_id = p_diagnostico_id)
    INTO v_scores, v_geral, v_resp
  FROM (
    SELECT q.dimensao::text AS dim,
           ROUND(AVG(CASE WHEN q.reverso THEN (4 - r.resposta) ELSE r.resposta END)::numeric * 25, 2) AS sc
    FROM public.nr1_diagnostico_respostas r
    JOIN public.nr1_questoes q ON q.id = r.questao_id
    WHERE r.diagnostico_id = p_diagnostico_id
    GROUP BY q.dimensao
  ) t;

  UPDATE public.nr1_diagnosticos
     SET scores_dimensao = COALESCE(v_scores, '{}'::jsonb),
         score_geral = v_geral,
         nivel_risco = public.nr1_calc_risco(v_geral),
         total_respondentes = COALESCE(v_resp, 0)
   WHERE id = p_diagnostico_id;
END;
$$;
