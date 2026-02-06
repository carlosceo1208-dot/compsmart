
-- Fix checkout_sessions policies to require authenticated role
DROP POLICY IF EXISTS "Users create own checkout sessions" ON public.checkout_sessions;
DROP POLICY IF EXISTS "Users view own active checkout sessions" ON public.checkout_sessions;

CREATE POLICY "Users create own checkout sessions"
ON public.checkout_sessions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users view own active checkout sessions"
ON public.checkout_sessions
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid()) 
  AND (
    ((status = 'pending') AND ((expires_at IS NULL) OR (expires_at > now())))
    OR (status = ANY (ARRAY['paid', 'failed', 'expired']))
  )
);

-- Fix support_conversations policies to require authenticated role
DROP POLICY IF EXISTS "Users can insert own support conversations" ON public.support_conversations;
DROP POLICY IF EXISTS "Users can update own support conversations" ON public.support_conversations;
DROP POLICY IF EXISTS "Users can view own support conversations" ON public.support_conversations;

CREATE POLICY "Users can insert own support conversations"
ON public.support_conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own support conversations"
ON public.support_conversations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own support conversations"
ON public.support_conversations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
