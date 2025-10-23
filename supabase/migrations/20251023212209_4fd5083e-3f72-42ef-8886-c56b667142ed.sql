-- Add variable_salary column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN variable_salary DECIMAL(12,2);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.variable_salary IS 'Salário variável do funcionário';