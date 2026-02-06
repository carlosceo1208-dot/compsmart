-- Add approval fields to performance_succession table
ALTER TABLE public.performance_succession
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS approval_comments TEXT,
ADD COLUMN IF NOT EXISTS selected_as_successor BOOLEAN DEFAULT false;

-- Create table for succession decisions history (to integrate with evaluations)
CREATE TABLE IF NOT EXISTS public.succession_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  root_company_id UUID NOT NULL REFERENCES public.organizational_structure(id),
  succession_id UUID NOT NULL REFERENCES public.performance_succession(id) ON DELETE CASCADE,
  key_position_id UUID NOT NULL REFERENCES public.job_titles(id),
  successor_employee_id UUID NOT NULL REFERENCES public.profiles(id),
  decision_type TEXT NOT NULL CHECK (decision_type IN ('nominated', 'approved', 'rejected')),
  decision_by UUID NOT NULL REFERENCES public.profiles(id),
  decision_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  comments TEXT,
  ai_recommendation TEXT,
  linked_evaluation_id UUID REFERENCES public.performance_evaluations(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.succession_decisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for succession_decisions
CREATE POLICY "Users can view succession decisions in their company"
ON public.succession_decisions
FOR SELECT
USING (
  root_company_id IN (
    SELECT root_company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can create succession decisions in their company"
ON public.succession_decisions
FOR INSERT
WITH CHECK (
  root_company_id IN (
    SELECT root_company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update their own decisions"
ON public.succession_decisions
FOR UPDATE
USING (decision_by = auth.uid());

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_succession_decisions_successor ON public.succession_decisions(successor_employee_id);
CREATE INDEX IF NOT EXISTS idx_succession_decisions_position ON public.succession_decisions(key_position_id);
CREATE INDEX IF NOT EXISTS idx_succession_decisions_evaluation ON public.succession_decisions(linked_evaluation_id);