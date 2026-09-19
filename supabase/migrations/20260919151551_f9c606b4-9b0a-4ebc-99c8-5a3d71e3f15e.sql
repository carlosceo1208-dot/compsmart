-- Fix: anon role needs EXECUTE on has_any_role, which is evaluated in dozens of RLS
-- policies. Requests evaluated under the anon role (public/pre-login pages) fail
-- with "permission denied for function has_any_role" otherwise. Mirrors the
-- 20260713144101 grant of has_role/is_super_admin/get_user_company_id to anon.
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, public.app_role[]) TO anon;