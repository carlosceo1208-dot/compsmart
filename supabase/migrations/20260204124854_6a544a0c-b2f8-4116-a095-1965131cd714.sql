-- Fix 1: Remove public SELECT access to discount_coupons
-- Only super_admin should have direct table access, others use validate_coupon_code() RPC

DROP POLICY IF EXISTS "Everyone can view active coupons" ON public.discount_coupons;

-- Also drop the legacy admin policy as super_admin policy covers admins
DROP POLICY IF EXISTS "Admins manage coupons" ON public.discount_coupons;

-- Ensure we have the super_admin policy (should already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'discount_coupons' 
    AND policyname = 'discount_coupons_super_admin_all'
  ) THEN
    CREATE POLICY "discount_coupons_super_admin_all" 
    ON public.discount_coupons 
    FOR ALL 
    TO authenticated 
    USING (is_super_admin(auth.uid()));
  END IF;
END
$$;

-- Fix 2: Restrict invoices access to admin only (HR uses redacted view)
-- Drop the HR view access and create new admin-only policy
DROP POLICY IF EXISTS "Admin/HR view own company invoices" ON public.invoices;

CREATE POLICY "Admin view own company invoices" 
ON public.invoices 
FOR SELECT 
TO authenticated 
USING (
  company_id = get_user_company_id() 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Ensure HR uses the redacted view (verify view policies)
-- The invoices_redacted_for_hr view already exists with security_invoker
-- HR should query that view instead of the main table