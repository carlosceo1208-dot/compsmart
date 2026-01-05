-- Create user_feedback table for collecting in-app feedback
CREATE TABLE public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  root_company_id UUID REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  
  -- Feedback type
  type TEXT NOT NULL CHECK (type IN ('suggestion', 'bug', 'praise', 'question')),
  
  -- Content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Auto-captured context
  page_url TEXT,
  user_agent TEXT,
  
  -- Optional NPS score
  nps_score INTEGER CHECK (nps_score IS NULL OR (nps_score >= 0 AND nps_score <= 10)),
  
  -- Internal management
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'planned', 'implemented', 'declined')),
  internal_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback" 
ON public.user_feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" 
ON public.user_feedback 
FOR SELECT 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_feedback_updated_at
BEFORE UPDATE ON public.user_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for common queries
CREATE INDEX idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX idx_user_feedback_root_company_id ON public.user_feedback(root_company_id);
CREATE INDEX idx_user_feedback_status ON public.user_feedback(status);
CREATE INDEX idx_user_feedback_type ON public.user_feedback(type);
CREATE INDEX idx_user_feedback_created_at ON public.user_feedback(created_at DESC);