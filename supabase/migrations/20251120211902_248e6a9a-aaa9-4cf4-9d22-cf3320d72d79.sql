-- Add employee_contribution_type to employee_benefits table
ALTER TABLE public.employee_benefits 
ADD COLUMN employee_contribution_type TEXT NOT NULL DEFAULT 'fixed';

-- Add check constraint for valid contribution types
ALTER TABLE public.employee_benefits 
ADD CONSTRAINT employee_contribution_type_check 
CHECK (employee_contribution_type IN ('fixed', 'percentage'));

-- Add comment for clarity
COMMENT ON COLUMN public.employee_benefits.employee_contribution_type IS 
'Type of employee contribution: fixed (R$ value) or percentage (% of benefit value)';