-- Harden realtime channel authorization: bind subscription topic to the
-- subscriber's actual root company (from profiles), ignoring the
-- super_admin_active_company override so a super admin cannot
-- inadvertently subscribe to (and rebroadcast) data from another tenant.

CREATE OR REPLACE FUNCTION public.get_user_root_company_id_strict()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT root_company_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

DROP POLICY IF EXISTS "Company-scoped realtime subscriptions" ON realtime.messages;

CREATE POLICY "Company-scoped realtime subscriptions"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND public.get_user_root_company_id_strict() IS NOT NULL
  AND topic ~ ('^[^:]+:' || public.get_user_root_company_id_strict()::text || '(:|$)')
);