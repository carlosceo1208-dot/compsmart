-- 1. economic_parameters: restrict read to users with a real profile
DROP POLICY IF EXISTS "Authenticated users can view economic parameters" ON public.economic_parameters;
CREATE POLICY "Members can view economic parameters"
ON public.economic_parameters
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()));

-- 2. nr1_leads: DB-level throttling / duplicate protection
CREATE OR REPLACE FUNCTION public.nr1_leads_throttle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_same_email int;
  v_recent_total int;
BEGIN
  SELECT count(*) INTO v_same_email
  FROM public.nr1_leads
  WHERE lower(email) = lower(NEW.email)
    AND created_at > now() - interval '1 hour';

  IF v_same_email >= 3 THEN
    RAISE EXCEPTION 'Too many submissions for this email. Please try again later.'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT count(*) INTO v_recent_total
  FROM public.nr1_leads
  WHERE created_at > now() - interval '1 minute';

  IF v_recent_total >= 30 THEN
    RAISE EXCEPTION 'Too many submissions. Please try again later.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.nr1_leads_throttle() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS nr1_leads_throttle_trg ON public.nr1_leads;
CREATE TRIGGER nr1_leads_throttle_trg
BEFORE INSERT ON public.nr1_leads
FOR EACH ROW EXECUTE FUNCTION public.nr1_leads_throttle();

CREATE INDEX IF NOT EXISTS nr1_leads_email_created_idx
  ON public.nr1_leads (lower(email), created_at DESC);

-- 3. user_roles: enforce that roles only exist for known profiles (1:1 tenant binding)
CREATE OR REPLACE FUNCTION public.user_roles_enforce_profile_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
  v_found boolean;
BEGIN
  SELECT p.root_company_id, true INTO v_company, v_found
  FROM public.profiles p
  WHERE p.id = NEW.user_id
  LIMIT 1;

  IF NOT COALESCE(v_found, false) THEN
    RAISE EXCEPTION 'Cannot assign a role to a user without a profile.'
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  -- a user must not hold roles tied to more than one company
  IF EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p2 ON p2.id = ur.user_id
    WHERE ur.user_id = NEW.user_id
      AND ur.id IS DISTINCT FROM NEW.id
      AND p2.root_company_id IS DISTINCT FROM v_company
  ) THEN
    RAISE EXCEPTION 'User roles cannot span multiple companies.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.user_roles_enforce_profile_tenant() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS user_roles_enforce_profile_tenant_trg ON public.user_roles;
CREATE TRIGGER user_roles_enforce_profile_tenant_trg
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.user_roles_enforce_profile_tenant();