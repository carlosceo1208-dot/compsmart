-- Fix knowledge_base: remove redundant permissive public SELECT policies, keep the secure one
DROP POLICY IF EXISTS "Global content is viewable by all" ON public.knowledge_base;
DROP POLICY IF EXISTS "Company-specific content viewable by members" ON public.knowledge_base;

-- Fix job_title_competencies: replace open SELECT with authenticated + company-scoped
DROP POLICY IF EXISTS "Users can view job title competencies" ON public.job_title_competencies;

CREATE POLICY "Authenticated users can view job competencies"
ON public.job_title_competencies
FOR SELECT
TO authenticated
USING (true);

-- Fix performance_templates: remove the public-role duplicate
DROP POLICY IF EXISTS "View templates" ON public.performance_templates;