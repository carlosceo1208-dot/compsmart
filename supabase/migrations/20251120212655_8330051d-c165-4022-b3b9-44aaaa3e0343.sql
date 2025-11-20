-- Remove old check constraint if exists
ALTER TABLE public.benefits 
DROP CONSTRAINT IF EXISTS benefits_benefit_type_check;

-- Add correct check constraint for benefit_type
ALTER TABLE public.benefits 
ADD CONSTRAINT benefits_benefit_type_check 
CHECK (benefit_type IN ('health', 'dental', 'life_insurance', 'meal_voucher', 'food_voucher', 'transportation', 'education', 'gym', 'other'));

-- Add default employee contribution fields to benefits table
ALTER TABLE public.benefits 
ADD COLUMN IF NOT EXISTS default_employee_contribution_type TEXT DEFAULT 'none' CHECK (default_employee_contribution_type IN ('none', 'fixed', 'percentage'));

ALTER TABLE public.benefits 
ADD COLUMN IF NOT EXISTS default_employee_contribution_value NUMERIC DEFAULT 0 CHECK (default_employee_contribution_value >= 0);

COMMENT ON COLUMN public.benefits.default_employee_contribution_type IS 
'Default employee contribution type: none (company pays all), fixed (R$ value), or percentage (% of benefit value)';

COMMENT ON COLUMN public.benefits.default_employee_contribution_value IS 
'Default employee contribution amount (R$ if fixed, % if percentage)';