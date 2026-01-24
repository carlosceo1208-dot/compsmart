-- Views redacted/minimal to reduce exposure surface

-- 1) HR-friendly invoices view (no payment references / notes)
create or replace view public.invoices_redacted_for_hr
with (security_invoker=on)
as
select
  i.id,
  i.company_id,
  i.invoice_number,
  i.status,
  i.issue_date,
  i.due_date,
  i.subtotal,
  i.discount,
  i.tax,
  i.total,
  i.paid_at,
  i.created_at,
  i.updated_at,
  -- Keep only a coarse payment method label; omit payment_reference and other sensitive fields
  i.payment_method
from public.invoices i;

comment on view public.invoices_redacted_for_hr is
  'Redacted invoices for HR: omits payment_reference and other sensitive payment metadata; use for hr_manager screens.';

-- 2) Compensation directory view (salary without PII)
-- Note: intentionally excludes email/phone/cpf/birth_date.
create or replace view public.profiles_compensation_directory
with (security_invoker=on)
as
select
  p.id as user_id,
  p.root_company_id,
  coalesce(nullif(p.full_name, ''), 'Usuário') as full_name,
  p.status,
  p.unit_id,
  p.job_title,
  p.job_title_id,
  p.grade,
  p.avatar_url,
  p.salary,
  p.variable_salary,
  p.salary_range_percentage,
  p.benefits_value,
  p.short_term_incentive,
  p.long_term_incentive,
  p.updated_at
from public.profiles p;

comment on view public.profiles_compensation_directory is
  'Directory for compensation analytics/manager views: salary and comp fields without PII.';
