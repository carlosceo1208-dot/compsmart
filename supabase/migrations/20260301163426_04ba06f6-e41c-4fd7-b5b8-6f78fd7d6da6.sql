CREATE POLICY "subscription_plans_public_read"
ON public.subscription_plans
FOR SELECT
TO anon
USING (is_active = true AND is_public = true);