
DROP POLICY IF EXISTS "Block direct authenticated inserts on merit_approval_history" ON public.merit_approval_history;
CREATE POLICY "Block direct authenticated inserts on merit_approval_history"
ON public.merit_approval_history
FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "Block direct authenticated updates on merit_approval_history" ON public.merit_approval_history;
CREATE POLICY "Block direct authenticated updates on merit_approval_history"
ON public.merit_approval_history
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "Block direct authenticated deletes on merit_approval_history" ON public.merit_approval_history;
CREATE POLICY "Block direct authenticated deletes on merit_approval_history"
ON public.merit_approval_history
FOR DELETE
TO authenticated
USING (false);
