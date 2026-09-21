CREATE TABLE public.market_insights_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key text NOT NULL UNIQUE,
  question text NOT NULL,
  topic text NOT NULL,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_market_insights_cache_expires ON public.market_insights_cache (expires_at DESC);

GRANT SELECT ON public.market_insights_cache TO authenticated;
GRANT ALL ON public.market_insights_cache TO service_role;

ALTER TABLE public.market_insights_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read market insights cache"
ON public.market_insights_cache
FOR SELECT
TO authenticated
USING (true);

CREATE TRIGGER update_market_insights_cache_updated_at
BEFORE UPDATE ON public.market_insights_cache
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.market_insights_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  root_company_id uuid,
  question text NOT NULL,
  topic text,
  from_cache boolean NOT NULL DEFAULT false,
  rejected boolean NOT NULL DEFAULT false,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_market_insights_usage_company ON public.market_insights_usage (root_company_id, created_at DESC);
CREATE INDEX idx_market_insights_usage_user ON public.market_insights_usage (user_id, created_at DESC);

GRANT SELECT ON public.market_insights_usage TO authenticated;
GRANT ALL ON public.market_insights_usage TO service_role;

ALTER TABLE public.market_insights_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can read market insights usage"
ON public.market_insights_usage
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin')
  OR (
    root_company_id IS NOT NULL
    AND root_company_id = public.get_user_company_id()
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr_manager'))
  )
);