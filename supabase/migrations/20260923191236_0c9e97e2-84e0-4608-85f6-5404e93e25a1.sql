DROP POLICY IF EXISTS "modules_public_read" ON public.modules;
CREATE POLICY "modules_public_read" ON public.modules FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "module_pricing_public_read" ON public.module_pricing;
CREATE POLICY "module_pricing_public_read" ON public.module_pricing FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.modules m WHERE m.id = module_pricing.module_id AND m.is_active = true));

DROP POLICY IF EXISTS "Authenticated users can read market insights cache" ON public.market_insights_cache;
REVOKE SELECT ON public.market_insights_cache FROM authenticated;