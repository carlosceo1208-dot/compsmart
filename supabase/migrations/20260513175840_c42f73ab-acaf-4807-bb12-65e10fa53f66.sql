
-- Grau de risco INSS (1 a 4) na assinatura NR-1
ALTER TABLE public.nr1_subscriptions
  ADD COLUMN IF NOT EXISTS grau_risco_inss smallint
  CHECK (grau_risco_inss BETWEEN 1 AND 4);

COMMENT ON COLUMN public.nr1_subscriptions.grau_risco_inss IS
  'Grau de risco da empresa segundo CNAE/INSS (1=leve, 2=médio, 3=grave, 4=gravíssimo). Define exigências e ações NR-1.';

-- Enum para status / prioridade do plano de ação
DO $$ BEGIN
  CREATE TYPE public.nr1_acao_status AS ENUM ('pendente','em_andamento','concluido','atrasado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.nr1_acao_prioridade AS ENUM ('baixa','media','alta','critica');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela de planos de ação NR-1
CREATE TABLE IF NOT EXISTS public.nr1_planos_acao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  diagnostico_id uuid REFERENCES public.nr1_diagnosticos(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  descricao text,
  dimensao text,
  responsavel text,
  prazo date,
  status public.nr1_acao_status NOT NULL DEFAULT 'pendente',
  prioridade public.nr1_acao_prioridade NOT NULL DEFAULT 'media',
  progresso smallint NOT NULL DEFAULT 0 CHECK (progresso BETWEEN 0 AND 100),
  evidencias text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nr1_planos_acao_company ON public.nr1_planos_acao(company_id);
CREATE INDEX IF NOT EXISTS idx_nr1_planos_acao_diag ON public.nr1_planos_acao(diagnostico_id);

ALTER TABLE public.nr1_planos_acao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nr1_planos_select" ON public.nr1_planos_acao FOR SELECT TO authenticated
  USING (company_id = get_user_company_id()
    AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role]));

CREATE POLICY "nr1_planos_insert" ON public.nr1_planos_acao FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id()
    AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role]));

CREATE POLICY "nr1_planos_update" ON public.nr1_planos_acao FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id()
    AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role]));

CREATE POLICY "nr1_planos_delete" ON public.nr1_planos_acao FOR DELETE TO authenticated
  USING (company_id = get_user_company_id()
    AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));

CREATE TRIGGER trg_nr1_planos_upd BEFORE UPDATE ON public.nr1_planos_acao
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
