-- Create survey_tables table
CREATE TABLE public.survey_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  effective_month INTEGER NOT NULL CHECK (effective_month >= 1 AND effective_month <= 12),
  effective_year INTEGER NOT NULL CHECK (effective_year >= 2000),
  is_active BOOLEAN NOT NULL DEFAULT false,
  default_amplitude NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create survey_data table
CREATE TABLE public.survey_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_table_id UUID NOT NULL REFERENCES public.survey_tables(id) ON DELETE CASCADE,
  job_code TEXT NOT NULL,
  job_title TEXT NOT NULL,
  grade TEXT NOT NULL,
  calculation_mode calculation_mode NOT NULL DEFAULT 'manual',
  input_median NUMERIC,
  input_amplitude NUMERIC,
  min_value NUMERIC NOT NULL,
  q1_value NUMERIC NOT NULL,
  median_value NUMERIC NOT NULL,
  q3_value NUMERIC NOT NULL,
  max_value NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (survey_table_id, job_code)
);

-- Enable RLS
ALTER TABLE public.survey_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for survey_tables
CREATE POLICY "Admins and HR managers can manage survey tables"
  ON public.survey_tables
  FOR ALL
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Users can view survey tables"
  ON public.survey_tables
  FOR SELECT
  USING (true);

-- RLS Policies for survey_data
CREATE POLICY "Admins and HR managers can manage survey data"
  ON public.survey_data
  FOR ALL
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Users can view survey data"
  ON public.survey_data
  FOR SELECT
  USING (true);

-- Trigger to ensure only one active survey table
CREATE OR REPLACE FUNCTION public.ensure_single_active_survey()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.survey_tables 
    SET is_active = false 
    WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_active_survey_trigger
  BEFORE INSERT OR UPDATE ON public.survey_tables
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_active_survey();

-- Trigger to update updated_at for survey_tables
CREATE TRIGGER update_survey_tables_updated_at
  BEFORE UPDATE ON public.survey_tables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update updated_at for survey_data
CREATE TRIGGER update_survey_data_updated_at
  BEFORE UPDATE ON public.survey_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();