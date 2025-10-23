-- Drop the existing type check constraint
ALTER TABLE public.organizational_structure 
DROP CONSTRAINT IF EXISTS organizational_structure_type_check;

-- Add the updated constraint that includes 'company'
ALTER TABLE public.organizational_structure 
ADD CONSTRAINT organizational_structure_type_check 
CHECK (type = ANY (ARRAY['company'::text, 'branch'::text, 'department'::text, 'area'::text, 'position'::text]));