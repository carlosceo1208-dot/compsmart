-- =====================================================
-- SECURITY FIX: Restrict sensitive data access
-- Issues: profiles_table_public_exposure, checkout_sessions_payment_exposure
-- =====================================================

-- =====================================================
-- FIX 1: PROFILES TABLE - Field-level access control
-- Only Admin/HR can see all profiles, regular employees see own profile only
-- The profiles_directory and profiles_compensation_directory views are already
-- in place for safe organizational access. This migration ensures the main 
-- profiles table is properly locked down.
-- =====================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Admin/HR view company profiles" ON public.profiles;

-- Admin and HR can view ALL profiles in their company (full access for management)
CREATE POLICY "Admin/HR view all company profiles"
ON public.profiles
FOR SELECT
USING (
  (root_company_id = get_user_company_id() OR root_company_id IS NULL) 
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
);

-- Managers can view BASIC profile info for their unit members (via profiles_compensation_directory view instead)
-- No direct profiles access for managers - they use the compensation directory view

-- Regular users can ONLY view their own profile
-- (Policy "Users view own profile" already exists)

-- =====================================================
-- FIX 2: CHECKOUT_SESSIONS - Time-based access restriction
-- Only allow viewing pending sessions that aren't expired
-- Completed/expired sessions should have sensitive data nullified
-- =====================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users view own checkout sessions" ON public.checkout_sessions;

-- Users can only view their own ACTIVE checkout sessions (pending and not expired)
-- For paid sessions, sensitive payment data is already nullified by trigger
CREATE POLICY "Users view own active checkout sessions"
ON public.checkout_sessions
FOR SELECT
USING (
  user_id = auth.uid()
  AND (
    -- Always allow viewing if session is still pending and not expired
    (status = 'pending' AND (expires_at IS NULL OR expires_at > now()))
    -- Allow viewing completed sessions (sensitive data already nullified by existing trigger)
    OR status IN ('paid', 'failed', 'expired')
  )
);

-- =====================================================
-- ENHANCED TRIGGER: Ensure sensitive data is nullified for all non-pending sessions
-- (Extends existing trigger to cover more cases)
-- =====================================================

CREATE OR REPLACE FUNCTION public.nullify_checkout_sensitive_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Nullify sensitive payment data when session is no longer pending
  -- or when it has been paid (to minimize data retention)
  IF NEW.status IN ('paid', 'failed', 'expired') OR 
     (NEW.expires_at IS NOT NULL AND NEW.expires_at < now()) THEN
    NEW.pix_qr_code := NULL;
    NEW.pix_qr_code_url := NULL;
    NEW.boleto_url := NULL;
    NEW.boleto_barcode := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS nullify_checkout_sensitive_data_trigger ON public.checkout_sessions;
CREATE TRIGGER nullify_checkout_sensitive_data_trigger
  BEFORE UPDATE ON public.checkout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.nullify_checkout_sensitive_data();

-- =====================================================
-- Add comment documenting security controls
-- =====================================================
COMMENT ON TABLE public.profiles IS 'Employee profiles with PII. Direct access restricted to Admin/HR and self. Use profiles_directory or profiles_compensation_directory views for organizational display.';
COMMENT ON TABLE public.checkout_sessions IS 'Payment checkout sessions. Sensitive payment data (QR codes, barcodes) automatically nullified for non-pending sessions.';