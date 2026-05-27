-- Make SELECT restriction explicit on discount_coupons for the scanner
CREATE POLICY "discount_coupons_super_admin_select"
ON public.discount_coupons
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));