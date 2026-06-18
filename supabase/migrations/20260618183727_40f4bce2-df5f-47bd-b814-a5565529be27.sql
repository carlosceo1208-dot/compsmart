
CREATE OR REPLACE FUNCTION public.nr1_plano_transicao(_plano_id uuid, _novo_status nr1_aprovacao_status, _observacao text DEFAULT NULL::text)
 RETURNS nr1_planos_acao
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  IF _novo_status IN ('aprovado','rejeitado','revisao_solicitada') AND NOT _is_approver THEN
    RAISE EXCEPTION 'Apenas administradores podem aprovar/rejeitar planos';
  END IF;

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
  FROM public.profiles p WHERE p.id = _uid LIMIT 1;

  INSERT INTO public.nr1_planos_aprovacao_historico(plano_id, company_id, acao, status_anterior, status_novo, observacao, ator_id, ator_nome)
  VALUES (_plano_id, _plano.company_id, _novo_status::text, _old, _novo_status, _observacao, _uid, _ator_nome);

  RETURN _plano;
END;
$function$;
