-- Fix 1: Scope approval_sla_config management to user's own company
DROP POLICY IF EXISTS "Admin/HR manages SLA config" ON public.approval_sla_config;

CREATE POLICY "Admin/HR manages SLA config in own company"
ON public.approval_sla_config
FOR ALL
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND root_company_id = get_user_company_id()
)
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND root_company_id = get_user_company_id()
);

-- Fix 2: Restrict agent_source_citations rows with NULL conversation_id
-- Only verified global citations should be readable to authenticated users.
DROP POLICY IF EXISTS "Citations scoped to user company" ON public.agent_source_citations;

CREATE POLICY "Citations scoped to user company"
ON public.agent_source_citations
FOR SELECT
TO authenticated
USING (
  -- Company-scoped citations: must belong to a conversation in the caller's company
  (
    conversation_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.conversation_sessions cs
      WHERE cs.id = agent_source_citations.conversation_id
        AND cs.root_company_id = get_user_company_id()
    )
  )
  -- Global/reference citations: only verified ones, readable by any authenticated user
  OR (
    conversation_id IS NULL
    AND verified IS TRUE
  )
);