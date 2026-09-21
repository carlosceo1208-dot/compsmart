REVOKE EXECUTE ON FUNCTION public.has_module(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_tenant_modules() FROM anon;
REVOKE EXECUTE ON FUNCTION public.leads_throttle() FROM anon;
REVOKE EXECUTE ON FUNCTION public.leads_throttle() FROM authenticated;