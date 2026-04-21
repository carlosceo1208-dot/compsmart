-- Phase 2.7.4: AI Job Matching results storage
CREATE TABLE IF NOT EXISTS public.job_matching_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  root_company_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  job_title_id UUID NOT NULL REFERENCES public.job_titles(id) ON DELETE CASCADE,
  matched_market_role TEXT NOT NULL,
  matched_cbo_code TEXT,
  match_score NUMERIC NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  reasoning TEXT,
  recommendations TEXT,
  market_median NUMERIC,
  internal_median NUMERIC,
  gap_pct NUMERIC,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_matching_results_company ON public.job_matching_results(root_company_id);
CREATE INDEX IF NOT EXISTS idx_job_matching_results_job ON public.job_matching_results(job_title_id);

ALTER TABLE public.job_matching_results ENABLE ROW LEVEL SECURITY;

-- Only HR/Admin from same tenant can see
CREATE POLICY "Tenant admins/HR can view matching results"
ON public.job_matching_results FOR SELECT
USING (
  root_company_id = public.get_user_company_id()
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'hr_manager'::app_role))
);

CREATE POLICY "Tenant admins/HR can insert matching results"
ON public.job_matching_results FOR INSERT
WITH CHECK (
  root_company_id = public.get_user_company_id()
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'hr_manager'::app_role))
);

CREATE POLICY "Tenant admins/HR can update matching results"
ON public.job_matching_results FOR UPDATE
USING (
  root_company_id = public.get_user_company_id()
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'hr_manager'::app_role))
);

CREATE POLICY "Tenant admins/HR can delete matching results"
ON public.job_matching_results FOR DELETE
USING (
  root_company_id = public.get_user_company_id()
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'hr_manager'::app_role))
);

CREATE TRIGGER trg_job_matching_results_updated_at
BEFORE UPDATE ON public.job_matching_results
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();