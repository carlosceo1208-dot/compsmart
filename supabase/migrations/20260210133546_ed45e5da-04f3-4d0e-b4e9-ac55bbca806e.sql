
-- Create enum for retention risk level
CREATE TYPE public.retention_risk_level AS ENUM ('low', 'medium', 'high');

-- Create enum for impact level
CREATE TYPE public.impact_level AS ENUM ('low', 'medium', 'high');

-- Add new columns to performance_evaluations
ALTER TABLE public.performance_evaluations
  ADD COLUMN IF NOT EXISTS retention_risk_level public.retention_risk_level,
  ADD COLUMN IF NOT EXISTS retention_risk_factors jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS retention_risk_notes text,
  ADD COLUMN IF NOT EXISTS impact_level public.impact_level;

-- Create evaluation_potential_dimensions table
CREATE TABLE public.evaluation_potential_dimensions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluation_id UUID NOT NULL REFERENCES public.performance_evaluations(id) ON DELETE CASCADE,
  dimension text NOT NULL CHECK (dimension IN ('learning_agility', 'mental_agility', 'people_agility', 'change_agility', 'results_agility')),
  score numeric NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 5),
  comment text,
  root_company_id UUID NOT NULL REFERENCES public.organizational_structure(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(evaluation_id, dimension)
);

-- Enable RLS
ALTER TABLE public.evaluation_potential_dimensions ENABLE ROW LEVEL SECURITY;

-- RLS policies matching performance_evaluations patterns
CREATE POLICY "Users can view potential dimensions of their company"
  ON public.evaluation_potential_dimensions
  FOR SELECT
  USING (
    root_company_id IN (
      SELECT root_company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin/HR can manage potential dimensions"
  ON public.evaluation_potential_dimensions
  FOR ALL
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND root_company_id IN (
      SELECT root_company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage potential dimensions for their reports"
  ON public.evaluation_potential_dimensions
  FOR ALL
  USING (
    has_role(auth.uid(), 'manager'::app_role)
    AND evaluation_id IN (
      SELECT pe.id FROM public.performance_evaluations pe
      WHERE pe.evaluator_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_evaluation_potential_dimensions_updated_at
  BEFORE UPDATE ON public.evaluation_potential_dimensions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
