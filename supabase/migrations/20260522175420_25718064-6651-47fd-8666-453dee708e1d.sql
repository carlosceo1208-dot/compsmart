
-- Enum para status do ciclo
CREATE TYPE public.clima_pesquisa_status AS ENUM ('rascunho', 'aberta', 'fechada', 'arquivada');
CREATE TYPE public.clima_modalidade AS ENUM ('isolada', 'integrada_psicossocial', 'com_clientes_externos');
CREATE TYPE public.clima_tipo_respondente AS ENUM ('colaborador', 'lideranca', 'cliente_interno', 'cliente_externo');

-- Ciclos de pesquisa
CREATE TABLE public.clima_pesquisas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  nome text NOT NULL,
  status clima_pesquisa_status NOT NULL DEFAULT 'rascunho',
  modalidade clima_modalidade NOT NULL DEFAULT 'isolada',
  periodo_inicio date NOT NULL DEFAULT CURRENT_DATE,
  periodo_fim date,
  total_respondentes integer NOT NULL DEFAULT 0,
  score_geral numeric(4,2),
  scores_dimensao jsonb,
  observacoes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_clima_pesquisas_company ON public.clima_pesquisas(company_id);

-- Respostas (uma por respondente por pesquisa, anônima)
CREATE TABLE public.clima_respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pesquisa_id uuid NOT NULL REFERENCES public.clima_pesquisas(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  respondent_hash text NOT NULL,
  tipo_respondente clima_tipo_respondente NOT NULL DEFAULT 'colaborador',
  departamento text,
  funcao_nivel text,
  tempo_empresa text,
  modalidade_trabalho text,
  score_geral numeric(4,2),
  scores_dimensao jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pesquisa_id, respondent_hash)
);
CREATE INDEX idx_clima_respostas_pesquisa ON public.clima_respostas(pesquisa_id);
CREATE INDEX idx_clima_respostas_company ON public.clima_respostas(company_id);

-- Itens (1 linha por questão respondida)
CREATE TABLE public.clima_respostas_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resposta_id uuid NOT NULL REFERENCES public.clima_respostas(id) ON DELETE CASCADE,
  dimensao text NOT NULL,
  questao_num smallint NOT NULL,
  valor smallint NOT NULL CHECK (valor BETWEEN 1 AND 5)
);
CREATE INDEX idx_clima_resp_itens_resposta ON public.clima_respostas_itens(resposta_id);

-- Trigger updated_at
CREATE TRIGGER trg_clima_pesquisas_upd
  BEFORE UPDATE ON public.clima_pesquisas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.clima_pesquisas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clima_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clima_respostas_itens ENABLE ROW LEVEL SECURITY;

-- Pesquisas: admin/hr/super veem; admin/hr criam, atualizam; admin deleta
CREATE POLICY clima_pesq_select ON public.clima_pesquisas FOR SELECT TO authenticated
  USING (company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role]));
CREATE POLICY clima_pesq_insert ON public.clima_pesquisas FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));
CREATE POLICY clima_pesq_update ON public.clima_pesquisas FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));
CREATE POLICY clima_pesq_delete ON public.clima_pesquisas FOR DELETE TO authenticated
  USING (company_id = get_user_company_id() AND has_role(auth.uid(), 'admin'::app_role));

-- Respostas: qualquer usuário autenticado da empresa pode INSERIR (anônimo via hash);
-- somente admin/hr/super podem VER (agregados).
CREATE POLICY clima_resp_select ON public.clima_respostas FOR SELECT TO authenticated
  USING (company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role]));
CREATE POLICY clima_resp_insert ON public.clima_respostas FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY clima_resp_itens_select ON public.clima_respostas_itens FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clima_respostas r WHERE r.id = resposta_id AND r.company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])));
CREATE POLICY clima_resp_itens_insert ON public.clima_respostas_itens FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.clima_respostas r WHERE r.id = resposta_id AND r.company_id = get_user_company_id()));
