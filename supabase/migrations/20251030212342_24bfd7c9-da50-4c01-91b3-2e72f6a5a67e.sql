-- Create job_families table
CREATE TABLE IF NOT EXISTS public.job_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color_class TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert existing job families
INSERT INTO public.job_families (name, color_class) VALUES
  ('Analistas', 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'),
  ('Profissionais', 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'),
  ('Consultores', 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'),
  ('Especialistas', 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'),
  ('Coordenadores', 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200'),
  ('Supervisores', 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'),
  ('Gerentes', 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'),
  ('Diretores Executivos', 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'),
  ('Executivos - Diretores', 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'),
  ('Lideres-Projetos', 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE public.job_families ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view job families"
  ON public.job_families FOR SELECT
  USING (true);

CREATE POLICY "Admins and HR managers can manage job families"
  ON public.job_families FOR ALL
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
  );

-- Trigger for updated_at
CREATE TRIGGER set_job_families_updated_at
  BEFORE UPDATE ON public.job_families
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing data - standardize job family name
UPDATE public.job_titles 
SET job_family = 'Diretores Executivos' 
WHERE job_family = 'Executivos - Diretores';