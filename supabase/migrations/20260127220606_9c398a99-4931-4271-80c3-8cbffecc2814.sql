-- Corrigir policy muito permissiva em rate_limit_log
-- A função check_rate_limit já é SECURITY DEFINER, então não precisa de policy permissiva

-- Drop policy permissiva
DROP POLICY IF EXISTS "Service can manage rate limit logs" ON public.rate_limit_log;

-- A função check_rate_limit (SECURITY DEFINER) já insere diretamente
-- Não precisamos de policy ALL com USING (true)

-- Adicionar policy para delete apenas pelo proprio usuário (cleanup)
CREATE POLICY "Users can delete own rate limit logs"
ON public.rate_limit_log FOR DELETE
USING (auth.uid() = user_id);