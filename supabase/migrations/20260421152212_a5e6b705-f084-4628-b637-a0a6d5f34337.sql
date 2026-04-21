-- Add review fields to job_matching_results
ALTER TABLE public.job_matching_results
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'approved', 'corrected', 'rejected')),
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_notes TEXT,
  ADD COLUMN IF NOT EXISTS ai_original_score NUMERIC,
  ADD COLUMN IF NOT EXISTS ai_original_reasoning TEXT,
  ADD COLUMN IF NOT EXISTS final_reasoning TEXT,
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Versioned history table
CREATE TABLE IF NOT EXISTS public.job_matching_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  root_company_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  job_title_id UUID NOT NULL REFERENCES public.job_titles(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'ai' CHECK (source IN ('ai', 'human_review')),
  matched_market_role TEXT NOT NULL,
  matched_cbo_code TEXT,
  match_score NUMERIC NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  reasoning TEXT,
  recommendations TEXT,
  market_median NUMERIC,
  internal_median NUMERIC,
  gap_pct NUMERIC,
  parameters JSONB,
  review_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jm_history_company ON public.job_matching_history(root_company_id);
CREATE INDEX IF NOT EXISTS idx_jm_history_job_version ON public.job_matching_history(job_title_id, version DESC);

ALTER TABLE public.job_matching_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admins/HR can view matching history"
ON public.job_matching_history FOR SELECT
USING (
  root_company_id = public.get_user_company_id()
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'hr_manager'::app_role))
);

CREATE POLICY "Tenant admins/HR can insert matching history"
ON public.job_matching_history FOR INSERT
WITH CHECK (
  root_company_id = public.get_user_company_id()
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'hr_manager'::app_role))
);

CREATE POLICY "Tenant admins/HR can update matching history"
ON public.job_matching_history FOR UPDATE
USING (
  root_company_id = public.get_user_company_id()
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'hr_manager'::app_role))
);

CREATE POLICY "Tenant admins/HR can delete matching history"
ON public.job_matching_history FOR DELETE
USING (
  root_company_id = public.get_user_company_id()
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'hr_manager'::app_role))
);