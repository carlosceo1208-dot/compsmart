
DROP POLICY IF EXISTS "Citations scoped to user company" ON public.agent_source_citations;

CREATE POLICY "Citations scoped to user company"
ON public.agent_source_citations
FOR SELECT
TO authenticated
USING (
  (
    conversation_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.conversation_sessions cs
      WHERE cs.id = agent_source_citations.conversation_id
        AND cs.root_company_id = get_user_company_id()
    )
  )
  OR (
    conversation_id IS NULL
    AND verified IS TRUE
    AND source_type IN ('lei', 'sumula', 'nr', 'jurisprudencia', 'oj')
  )
);
