REVOKE ALL ON FUNCTION public.talent_company_has_module(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.candidaturas_check_tenant() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.talent_empresa_publica(public.vagas) FROM PUBLIC, anon, authenticated;
CREATE POLICY "Portal rate limit: sem acesso direto" ON public.portal_rate_limit FOR SELECT TO authenticated USING (false);