
-- Governance: approval workflow for NR-1 action plans
DO $$ BEGIN
  CREATE TYPE public.nr1_aprovacao_status AS ENUM ('rascunho','em_aprovacao','aprovado','rejeitado','revisao_solicitada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.nr1_planos_acao
  ADD COLUMN IF NOT EXISTS aprovacao_status public.nr1_aprovacao_status NOT NULL DEFAULT 'rascunho',
  ADD COLUMN IF NOT EXISTS origem text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS clima_pesquisa_id uuid,
  ADD COLUMN IF NOT EXISTS submetido_por uuid,
  ADD COLUMN IF NOT EXISTS submetido_em timestamptz,
  ADD COLUMN IF NOT EXISTS revisado_por uuid,
  ADD COLUMN IF NOT EXISTS revisado_em timestamptz,
  ADD COLUMN IF NOT EXISTS observacao_aprovacao text,
  ADD COLUMN IF NOT EXISTS impacto_estimado text,
  ADD COLUMN IF NOT EXISTS custo_estimado numeric;

CREATE INDEX IF NOT EXISTS idx_nr1_planos_aprovacao ON public.nr1_planos_acao(company_id, aprovacao_status);
CREATE INDEX IF NOT EXISTS idx_nr1_planos_clima ON public.nr1_planos_acao(clima_pesquisa_id);

-- History / audit trail
CREATE TABLE IF NOT EXISTS public.nr1_planos_aprovacao_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id uuid NOT NULL REFERENCES public.nr1_planos_acao(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  acao text NOT NULL,
  status_anterior public.nr1_aprovacao_status,
  status_novo public.nr1_aprovacao_status,
  observacao text,
  ator_id uuid,
  ator_nome text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nr1_planos_hist_plano ON public.nr1_planos_aprovacao_historico(plano_id);
CREATE INDEX IF NOT EXISTS idx_nr1_planos_hist_company ON public.nr1_planos_aprovacao_historico(company_id);

ALTER TABLE public.nr1_planos_aprovacao_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nr1_planos_hist_select" ON public.nr1_planos_aprovacao_historico FOR SELECT TO authenticated
  USING (company_id = get_user_company_id()
    AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role]));

CREATE POLICY "nr1_planos_hist_insert" ON public.nr1_planos_aprovacao_historico FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id()
    AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role]));

-- RPC: transition plan state with audit
CREATE OR REPLACE FUNCTION public.nr1_plano_transicao(
  _plano_id uuid,
  _novo_status public.nr1_aprovacao_status,
  _observacao text DEFAULT NULL
) RETURNS public.nr1_planos_acao
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _plano public.nr1_planos_acao;
  _old public.nr1_aprovacao_status;
  _uid uuid := auth.uid();
  _company uuid := get_user_company_id();
  _is_approver boolean;
  _ator_nome text;
BEGIN
  SELECT * INTO _plano FROM public.nr1_planos_acao WHERE id = _plano_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Plano não encontrado'; END IF;
  IF _plano.company_id <> _company THEN RAISE EXCEPTION 'Sem acesso a este plano'; END IF;

  _is_approver := has_any_role(_uid, ARRAY['admin'::app_role,'super_admin'::app_role]);
  _old := _plano.aprovacao_status;

  -- Permission matrix
  IF _novo_status IN ('aprovado','rejeitado','revisao_solicitada') AND NOT _is_approver THEN
    RAISE EXCEPTION 'Apenas administradores podem aprovar/rejeitar planos';
  END IF;

  -- Apply transition
  UPDATE public.nr1_planos_acao SET
    aprovacao_status = _novo_status,
    submetido_por = CASE WHEN _novo_status = 'em_aprovacao' THEN _uid ELSE submetido_por END,
    submetido_em  = CASE WHEN _novo_status = 'em_aprovacao' THEN now() ELSE submetido_em END,
    revisado_por  = CASE WHEN _novo_status IN ('aprovado','rejeitado','revisao_solicitada') THEN _uid ELSE revisado_por END,
    revisado_em   = CASE WHEN _novo_status IN ('aprovado','rejeitado','revisao_solicitada') THEN now() ELSE revisado_em END,
    observacao_aprovacao = COALESCE(_observacao, observacao_aprovacao),
    updated_at = now()
  WHERE id = _plano_id
  RETURNING * INTO _plano;

  SELECT COALESCE(p.full_name, p.email, 'Usuário') INTO _ator_nome
  FROM public.profiles p WHERE p.user_id = _uid LIMIT 1;

  INSERT INTO public.nr1_planos_aprovacao_historico(plano_id, company_id, acao, status_anterior, status_novo, observacao, ator_id, ator_nome)
  VALUES (_plano_id, _plano.company_id, _novo_status::text, _old, _novo_status, _observacao, _uid, _ator_nome);

  RETURN _plano;
END;
$$;

GRANT EXECUTE ON FUNCTION public.nr1_plano_transicao(uuid, public.nr1_aprovacao_status, text) TO authenticated;
