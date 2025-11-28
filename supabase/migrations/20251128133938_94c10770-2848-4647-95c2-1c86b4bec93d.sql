-- Convert SECURITY DEFINER views to SECURITY INVOKER for proper RLS enforcement
-- This ensures views respect the calling user's permissions

-- Recreate v_agent_conversations as SECURITY INVOKER
DROP VIEW IF EXISTS public.v_agent_conversations;
CREATE VIEW public.v_agent_conversations 
WITH (security_invoker = true)
AS
SELECT 'legal'::text AS agent_type,
    lac.id,
    lac.user_id,
    lac.question,
    lac.answer,
    lac.document_name,
    lac.operation_mode,
    lac.tokens_used,
    lac.response_time_ms,
    lac.created_at,
    p.full_name AS user_name,
    p.email AS user_email,
    p.root_company_id,
    os.name AS company_name,
    COALESCE(( SELECT string_agg((user_roles.role)::text, ', '::text) AS string_agg
           FROM user_roles
          WHERE (user_roles.user_id = lac.user_id)), 'employee'::text) AS user_roles
   FROM ((legal_assistant_conversations lac
     LEFT JOIN profiles p ON ((lac.user_id = p.id)))
     LEFT JOIN organizational_structure os ON ((p.root_company_id = os.id)))
UNION ALL
 SELECT 'incentive'::text AS agent_type,
    iac.id,
    iac.user_id,
    iac.question,
    iac.answer,
    iac.document_name,
    iac.operation_mode,
    iac.tokens_used,
    iac.response_time_ms,
    iac.created_at,
    p.full_name AS user_name,
    p.email AS user_email,
    p.root_company_id,
    os.name AS company_name,
    COALESCE(( SELECT string_agg((user_roles.role)::text, ', '::text) AS string_agg
           FROM user_roles
          WHERE (user_roles.user_id = iac.user_id)), 'employee'::text) AS user_roles
   FROM ((incentive_assistant_conversations iac
     LEFT JOIN profiles p ON ((iac.user_id = p.id)))
     LEFT JOIN organizational_structure os ON ((p.root_company_id = os.id)));

-- Recreate v_benefit_eligibility_report as SECURITY INVOKER
DROP VIEW IF EXISTS public.v_benefit_eligibility_report;
CREATE VIEW public.v_benefit_eligibility_report
WITH (security_invoker = true)
AS
SELECT b.id AS benefit_id,
    b.name AS benefit_name,
    b.eligibility_type,
    ber.id AS rule_id,
    ber.grade_min,
    ber.grade_max,
    ber.salary_min,
    ber.salary_max,
    ber.company_contribution_value,
    ber.employee_contribution_type,
    ber.employee_contribution_value,
    ber.description,
    count(DISTINCT
        CASE
            WHEN ((b.eligibility_type = 'grade'::text) AND ((p.grade >= ber.grade_min) AND (p.grade <= ber.grade_max))) THEN p.id
            WHEN ((b.eligibility_type = 'salary_range'::text) AND ((p.salary >= ber.salary_min) AND (p.salary <= ber.salary_max))) THEN p.id
            WHEN (b.eligibility_type = 'none'::text) THEN p.id
            ELSE NULL::uuid
        END) AS eligible_employees_count,
    sum(
        CASE
            WHEN ((b.eligibility_type = 'grade'::text) AND ((p.grade >= ber.grade_min) AND (p.grade <= ber.grade_max))) THEN ber.company_contribution_value
            WHEN ((b.eligibility_type = 'salary_range'::text) AND ((p.salary >= ber.salary_min) AND (p.salary <= ber.salary_max))) THEN ber.company_contribution_value
            WHEN (b.eligibility_type = 'none'::text) THEN b.value_per_employee
            ELSE NULL::numeric
        END) AS total_projected_cost
   FROM ((benefits b
     LEFT JOIN benefit_eligibility_rules ber ON ((b.id = ber.benefit_id)))
     CROSS JOIN profiles p)
  WHERE ((p.status = 'active'::user_status) AND (b.is_active = true))
  GROUP BY b.id, b.name, b.eligibility_type, ber.id, ber.grade_min, ber.grade_max, ber.salary_min, ber.salary_max, ber.company_contribution_value, ber.employee_contribution_type, ber.employee_contribution_value, ber.description;