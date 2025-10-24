-- Part 1: Update organizational structure types
-- Drop the existing type check constraint
ALTER TABLE public.organizational_structure 
DROP CONSTRAINT IF EXISTS organizational_structure_type_check;

-- Add the updated constraint with new hierarchy types (removing 'position', adding new types)
ALTER TABLE public.organizational_structure 
ADD CONSTRAINT organizational_structure_type_check 
CHECK (type = ANY (ARRAY['company'::text, 'headquarters'::text, 'branch'::text, 'area'::text, 'department'::text, 'sector'::text, 'project'::text]));

-- Part 2: Create job_titles table (Master Job Titles / Career Plan)
CREATE TABLE public.job_titles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  grade TEXT NOT NULL,
  median_points DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for job_titles
ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_titles
CREATE POLICY "Users can view all job titles"
ON public.job_titles
FOR SELECT
USING (true);

CREATE POLICY "Admins and HR managers can manage job titles"
ON public.job_titles
FOR ALL
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- Trigger to update updated_at on job_titles
CREATE TRIGGER update_job_titles_updated_at
BEFORE UPDATE ON public.job_titles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Part 3: Update profiles table
-- Add job_title_id column to profiles
ALTER TABLE public.profiles
ADD COLUMN job_title_id UUID REFERENCES public.job_titles(id) ON DELETE SET NULL;

-- Update comment on position_id to clarify it should reference Sector or Project
COMMENT ON COLUMN public.profiles.position_id IS 'References organizational_structure entities of type sector or project';