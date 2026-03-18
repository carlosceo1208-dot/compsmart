
-- =====================================================
-- FIX: Add company isolation to admin RLS policies
-- Prevents cross-company data access by admins
-- =====================================================

-- 1. user_roles: Most critical - prevent cross-company role manipulation
DROP POLICY IF EXISTS "Only admins can manage user roles" ON user_roles;
CREATE POLICY "Admins manage own company user roles"
  ON user_roles FOR ALL TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()))
    AND user_id IN (
      SELECT id FROM profiles WHERE root_company_id = get_user_company_id()
    )
  )
  WITH CHECK (
    (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()))
    AND role <> 'super_admin'::app_role
    AND user_id IN (
      SELECT id FROM profiles WHERE root_company_id = get_user_company_id()
    )
  );

-- Also scope the HR view policy
DROP POLICY IF EXISTS "Admins and HR view all roles" ON user_roles;
CREATE POLICY "Admins and HR view own company roles"
  ON user_roles FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND user_id IN (
      SELECT id FROM profiles WHERE root_company_id = get_user_company_id()
    )
  );

-- 2. audit_logs: Scope to own company
DROP POLICY IF EXISTS "Only admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins view own company audit logs"
  ON audit_logs FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND (
      user_id IN (SELECT id FROM profiles WHERE root_company_id = get_user_company_id())
      OR user_id IS NULL
    )
  );

-- 3. salary_ranges: Scope management to own company
DROP POLICY IF EXISTS "Admins and HR managers can manage salary ranges" ON salary_ranges;
CREATE POLICY "Admins and HR manage own company salary ranges"
  ON salary_ranges FOR ALL TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND salary_table_id IN (
      SELECT id FROM salary_tables WHERE root_company_id = get_user_company_id()
    )
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND salary_table_id IN (
      SELECT id FROM salary_tables WHERE root_company_id = get_user_company_id()
    )
  );

-- 4. benefit_eligibility: Scope to own company via benefits table
DROP POLICY IF EXISTS "Admins and HR can manage benefit eligibility" ON benefit_eligibility;
CREATE POLICY "Admins and HR manage own company benefit eligibility"
  ON benefit_eligibility FOR ALL TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND benefit_id IN (
      SELECT id FROM benefits WHERE root_company_id = get_user_company_id()
    )
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND benefit_id IN (
      SELECT id FROM benefits WHERE root_company_id = get_user_company_id()
    )
  );

-- 5. benefit_eligibility_rules: Scope to own company via benefits table
DROP POLICY IF EXISTS "Admins and HR can manage eligibility rules" ON benefit_eligibility_rules;
CREATE POLICY "Admins and HR manage own company eligibility rules"
  ON benefit_eligibility_rules FOR ALL TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND benefit_id IN (
      SELECT id FROM benefits WHERE root_company_id = get_user_company_id()
    )
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND benefit_id IN (
      SELECT id FROM benefits WHERE root_company_id = get_user_company_id()
    )
  );

-- 6. budget: Scope to own company via unit_id
DROP POLICY IF EXISTS "Admins and HR can manage budget" ON budget;
CREATE POLICY "Admins and HR manage own company budget"
  ON budget FOR ALL TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND unit_id IN (
      SELECT id FROM organizational_structure
      WHERE root_company_id = get_user_company_id() OR id = get_user_company_id()
    )
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND unit_id IN (
      SELECT id FROM organizational_structure
      WHERE root_company_id = get_user_company_id() OR id = get_user_company_id()
    )
  );

-- 7. budget_deadline_settings: Scope to own company
DROP POLICY IF EXISTS "Admin/HR pode gerenciar deadlines" ON budget_deadline_settings;
CREATE POLICY "Admin/HR manage own company deadlines"
  ON budget_deadline_settings FOR ALL TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND root_company_id = get_user_company_id()
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND root_company_id = get_user_company_id()
  );

-- Also fix the SELECT policy
DROP POLICY IF EXISTS "Admin/HR pode visualizar deadlines" ON budget_deadline_settings;
CREATE POLICY "Admin/HR view own company deadlines"
  ON budget_deadline_settings FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND root_company_id = get_user_company_id()
  );

-- 8. budget_approvers: Scope to own company
DROP POLICY IF EXISTS "Admins can manage budget approvers" ON budget_approvers;
CREATE POLICY "Admins manage own company budget approvers"
  ON budget_approvers FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND user_id IN (
      SELECT id FROM profiles WHERE root_company_id = get_user_company_id()
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    AND user_id IN (
      SELECT id FROM profiles WHERE root_company_id = get_user_company_id()
    )
  );

-- 9. user_subscriptions: Scope to own company
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON user_subscriptions;
CREATE POLICY "Admins manage own company subscriptions"
  ON user_subscriptions FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND user_id IN (
      SELECT id FROM profiles WHERE root_company_id = get_user_company_id()
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    AND user_id IN (
      SELECT id FROM profiles WHERE root_company_id = get_user_company_id()
    )
  );

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON user_subscriptions;
CREATE POLICY "Admins view own company subscriptions"
  ON user_subscriptions FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND user_id IN (
      SELECT id FROM profiles WHERE root_company_id = get_user_company_id()
    )
  );
