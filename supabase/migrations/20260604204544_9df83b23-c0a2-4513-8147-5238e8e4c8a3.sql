-- Add selected_modules to organizational_structure
ALTER TABLE public.organizational_structure
  ADD COLUMN IF NOT EXISTS selected_modules text[] NOT NULL DEFAULT ARRAY[]::text[];

-- Add per-module pricing to subscription_plans (monthly BRL)
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS module_core_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS module_insight_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS module_match_price numeric(10,2);

COMMENT ON COLUMN public.organizational_structure.selected_modules IS 'Array of selected service modules: Core, Insight, Match';
COMMENT ON COLUMN public.subscription_plans.module_core_price IS 'Monthly add-on price for Core module (BRL). NULL = use default.';
COMMENT ON COLUMN public.subscription_plans.module_insight_price IS 'Monthly add-on price for Insight module (BRL). NULL = use default.';
COMMENT ON COLUMN public.subscription_plans.module_match_price IS 'Monthly add-on price for Match module (BRL). NULL = use default.';