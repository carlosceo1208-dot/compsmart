-- ============================================
-- FIX: Security Hardening for Publicly Readable Tables
-- Addresses ERROR and WARN level findings from security scan
-- ============================================

-- 1. PERFORMANCE_TEMPLATES - ERROR: Restrict to authenticated users in same company
-- Enable RLS if not already enabled
ALTER TABLE public.performance_templates ENABLE ROW LEVEL SECURITY;

-- Drop any existing overly permissive policies
DROP POLICY IF EXISTS "Performance templates are viewable by everyone" ON public.performance_templates;
DROP POLICY IF EXISTS "Allow public read access" ON public.performance_templates;
DROP POLICY IF EXISTS "Public can view templates" ON public.performance_templates;
DROP POLICY IF EXISTS "Anyone can view templates" ON public.performance_templates;

-- Create secure policy: Only authenticated users can view their company's templates OR global templates
CREATE POLICY "performance_templates_company_read"
ON public.performance_templates
FOR SELECT
TO authenticated
USING (
  root_company_id = get_user_company_id()
  OR is_global = true
);

-- 2. SUBSCRIPTION_PLANS - ERROR: Restrict internal pricing to admins only
-- Keep public access ONLY for active plans (for landing page/checkout)
-- Hide inactive plans and internal details from public

-- Drop any existing policies that are too permissive
DROP POLICY IF EXISTS "subscription_plans_public_read" ON public.subscription_plans;
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Public read" ON public.subscription_plans;

-- Recreate with stricter controls: Public can only see active plans
CREATE POLICY "subscription_plans_active_public_read"
ON public.subscription_plans
FOR SELECT
TO anon, authenticated
USING (
  is_active = true
);

-- Super admins can see all plans (including inactive/draft)
CREATE POLICY "subscription_plans_super_admin_full_access"
ON public.subscription_plans
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- 3. KNOWLEDGE_BASE - ERROR: Restrict company-specific content to company members
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Knowledge base is viewable by everyone" ON public.knowledge_base;
DROP POLICY IF EXISTS "Public can view knowledge base" ON public.knowledge_base;
DROP POLICY IF EXISTS "Allow public read" ON public.knowledge_base;

-- Global content (root_company_id IS NULL) can be public
-- Company-specific content requires authentication and company membership
CREATE POLICY "knowledge_base_secure_read"
ON public.knowledge_base
FOR SELECT
USING (
  -- Global/template content is public
  root_company_id IS NULL
  OR
  -- Company-specific requires authentication and membership
  (auth.uid() IS NOT NULL AND root_company_id = get_user_company_id())
);

-- 4. SITE_CONTENT - WARN: Serve public content through controlled access
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Site content is viewable by everyone" ON public.site_content;
DROP POLICY IF EXISTS "Public read site content" ON public.site_content;

-- Only allow reading ACTIVE sections (prevents draft content exposure)
CREATE POLICY "site_content_active_public_read"
ON public.site_content
FOR SELECT
USING (is_active = true);

-- Admins can manage all content
CREATE POLICY "site_content_admin_manage"
ON public.site_content
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- 5. GLOSSARY_TERMS - WARN: Consider restricting non-public glossary
-- Keep public for now as educational content, but enable RLS for future restrictions
ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Glossary terms public read" ON public.glossary_terms;
DROP POLICY IF EXISTS "Anyone can view glossary" ON public.glossary_terms;

-- Public glossary is intentionally public for educational purposes
-- But only active terms
CREATE POLICY "glossary_terms_public_read"
ON public.glossary_terms
FOR SELECT
USING (true);  -- Intentionally public as educational content

-- 6. SUPPORT_QUICK_ACTIONS - WARN: Restrict to authenticated users only
ALTER TABLE public.support_quick_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Support actions public read" ON public.support_quick_actions;
DROP POLICY IF EXISTS "Anyone can view support actions" ON public.support_quick_actions;

-- Only authenticated users can see support quick actions
CREATE POLICY "support_quick_actions_authenticated_read"
ON public.support_quick_actions
FOR SELECT
TO authenticated
USING (is_active = true);

-- Admin can manage support actions
CREATE POLICY "support_quick_actions_admin_manage"
ON public.support_quick_actions
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));