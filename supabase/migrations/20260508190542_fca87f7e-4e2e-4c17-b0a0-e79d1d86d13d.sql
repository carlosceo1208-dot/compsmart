
-- 1) Tighten budget SELECT to privileged roles only
DROP POLICY IF EXISTS "Users view own company budget" ON public.budget;
CREATE POLICY "Privileged roles view own company budget"
ON public.budget
FOR SELECT
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'manager'::app_role, 'super_admin'::app_role])
  AND unit_id IN (
    SELECT id FROM organizational_structure
    WHERE root_company_id = get_user_company_id() OR id = get_user_company_id()
  )
);

-- 2) Retarget public-role policies to authenticated on listed tables
DO $$
DECLARE
  r RECORD;
  target_tables TEXT[] := ARRAY[
    'invoices','company_subscriptions','payment_methods','employee_benefits',
    'salary_assistant_conversations','legal_assistant_conversations',
    'performai_conversations','incentive_assistant_conversations',
    'incentive_programs','job_titles','benefits','employee_incentive_assignments',
    'survey_tables','survey_data','alert_history','alert_configurations',
    'knowledge_base','invoice_items','user_subscriptions','super_admin_active_company',
    'security_alerts','approval_notifications','support_quick_actions','user_roles',
    'rate_limit_log','conversation_sessions','system_labels','competencies','permissions'
  ];
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY(target_tables)
      AND 'public' = ANY(roles)
  LOOP
    EXECUTE format('ALTER POLICY %I ON %I.%I TO authenticated',
                   r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;
