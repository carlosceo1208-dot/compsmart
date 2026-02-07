-- =============================================
-- SECURITY HARDENING: subscription_plans table
-- Issue: Multiple public READ policies expose pricing strategy
-- Fix: Remove public access, allow only authenticated users to view active plans
-- =============================================

-- Drop the problematic public policies
DROP POLICY IF EXISTS "Public plans viewable by all" ON public.subscription_plans;
DROP POLICY IF EXISTS "subscription_plans_public_read_active" ON public.subscription_plans;
DROP POLICY IF EXISTS "subscription_plans_active_public_read" ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins can manage all plans" ON public.subscription_plans;

-- Create a single policy for authenticated users to view active public plans
-- This is needed for pricing page (authenticated users can see available plans)
CREATE POLICY "subscription_plans_authenticated_read"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (is_active = true AND is_public = true);

-- =============================================
-- SECURITY HARDENING: role_permissions table
-- Issue: Policy exposes all permission mappings to public (true condition)
-- Fix: Restrict to authenticated users viewing their own role permissions
-- =============================================

-- Drop the problematic policy that allows anyone to see all permissions
DROP POLICY IF EXISTS "Users can view all role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Only admins can manage role permissions" ON public.role_permissions;

-- Create policy for authenticated users to view only their own role's permissions
CREATE POLICY "role_permissions_user_read_own"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = role_permissions.role
  )
);

-- Admins can view and manage all role permissions
CREATE POLICY "role_permissions_admin_all"
ON public.role_permissions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));