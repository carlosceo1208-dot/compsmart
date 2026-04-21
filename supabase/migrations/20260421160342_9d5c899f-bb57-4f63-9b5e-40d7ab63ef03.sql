
-- Corrigir warning: INSERT no ledger exige usuário autenticado
DROP POLICY IF EXISTS "System can insert ledger entries" ON public.merit_budget_ledger;

CREATE POLICY "Authenticated users can insert ledger entries in their company"
ON public.merit_budget_ledger FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.unit_merit_budgets b
    WHERE b.id = merit_budget_ledger.budget_id
      AND b.root_company_id = (SELECT root_company_id FROM profiles WHERE id = auth.uid())
  )
);

-- ============================================================
-- NOTIFICAÇÕES & SLA DE APROVAÇÕES
-- ============================================================

-- 1. Configuração de SLA por empresa
CREATE TABLE IF NOT EXISTS public.approval_sla_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_company_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  approval_type TEXT NOT NULL CHECK (approval_type IN ('merit','talent','all')),
  sla_business_days INTEGER NOT NULL DEFAULT 5 CHECK (sla_business_days BETWEEN 1 AND 30),
  reminder_days_before INTEGER[] NOT NULL DEFAULT ARRAY[2,1],
  escalate_to_superior BOOLEAN NOT NULL DEFAULT true,
  escalate_after_days INTEGER NOT NULL DEFAULT 7,
  notify_email BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (root_company_id, approval_type)
);

ALTER TABLE public.approval_sla_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/HR manages SLA config"
ON public.approval_sla_config FOR ALL
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role]))
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role]));

CREATE POLICY "Authenticated can view SLA in their company"
ON public.approval_sla_config FOR SELECT
USING (root_company_id = (SELECT root_company_id FROM profiles WHERE id = auth.uid()));

CREATE TRIGGER trg_approval_sla_updated
BEFORE UPDATE ON public.approval_sla_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Atribuições de aprovação (inbox)
CREATE TABLE IF NOT EXISTS public.approval_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_company_id UUID NOT NULL,
  approval_type TEXT NOT NULL CHECK (approval_type IN ('merit','talent')),
  source_id UUID NOT NULL,
  approver_id UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deadline_at TIMESTAMPTZ NOT NULL,
  escalated_at TIMESTAMPTZ,
  escalated_to UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','escalated','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_assignments_approver ON public.approval_assignments(approver_id, status, deadline_at);
CREATE INDEX IF NOT EXISTS idx_approval_assignments_source ON public.approval_assignments(approval_type, source_id);

ALTER TABLE public.approval_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approvers see their own assignments"
ON public.approval_assignments FOR SELECT
USING (approver_id = auth.uid() OR escalated_to = auth.uid()
  OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role]));

CREATE POLICY "Admin/HR manage assignments"
ON public.approval_assignments FOR ALL
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role]))
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role]));

CREATE POLICY "Authenticated insert assignments in their company"
ON public.approval_assignments FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND root_company_id = (SELECT root_company_id FROM profiles WHERE id = auth.uid())
);

-- 3. Notificações enfileiradas
CREATE TABLE IF NOT EXISTS public.approval_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.approval_assignments(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('new_request','reminder','escalation','approved','rejected')),
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email','in_app')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','read')),
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_notif_recipient ON public.approval_notifications(recipient_id, status, created_at DESC);

ALTER TABLE public.approval_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recipients see their notifications"
ON public.approval_notifications FOR SELECT
USING (recipient_id = auth.uid());

CREATE POLICY "Recipients mark as read"
ON public.approval_notifications FOR UPDATE
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Admin/HR manage notifications"
ON public.approval_notifications FOR ALL
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role]))
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role]));

CREATE POLICY "Authenticated insert notifications in their company"
ON public.approval_notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Inbox: aprovações pendentes para o usuário
CREATE OR REPLACE FUNCTION public.get_my_approval_inbox()
RETURNS TABLE(
  assignment_id UUID,
  approval_type TEXT,
  source_id UUID,
  employee_name TEXT,
  requested_pct NUMERIC,
  annual_impact NUMERIC,
  assigned_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ,
  hours_remaining NUMERIC,
  is_overdue BOOLEAN,
  status TEXT,
  escalated BOOLEAN
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS assignment_id,
    a.approval_type,
    a.source_id,
    COALESCE(p.full_name, '—') AS employee_name,
    CASE a.approval_type
      WHEN 'merit' THEN (SELECT requested_pct FROM public.merit_approval_requests WHERE id = a.source_id)
      WHEN 'talent' THEN (SELECT recommended_merit_pct FROM public.talent_intelligence_recommendations WHERE id = a.source_id)
    END AS requested_pct,
    CASE a.approval_type
      WHEN 'merit' THEN (SELECT annual_impact FROM public.merit_approval_requests WHERE id = a.source_id)
      WHEN 'talent' THEN (SELECT financial_impact_annual FROM public.talent_intelligence_recommendations WHERE id = a.source_id)
    END AS annual_impact,
    a.assigned_at,
    a.deadline_at,
    ROUND(EXTRACT(EPOCH FROM (a.deadline_at - now())) / 3600, 1) AS hours_remaining,
    (a.deadline_at < now()) AS is_overdue,
    a.status,
    (a.escalated_at IS NOT NULL) AS escalated
  FROM public.approval_assignments a
  LEFT JOIN public.profiles p ON p.id = CASE a.approval_type
    WHEN 'merit' THEN (SELECT employee_id FROM public.merit_approval_requests WHERE id = a.source_id)
    WHEN 'talent' THEN (SELECT employee_id FROM public.talent_intelligence_recommendations WHERE id = a.source_id)
  END
  WHERE (a.approver_id = auth.uid() OR a.escalated_to = auth.uid())
    AND a.status = 'pending'
  ORDER BY a.deadline_at ASC;
END;
$$;

-- 5. Escalonamento automático (cron-friendly)
CREATE OR REPLACE FUNCTION public.escalate_overdue_approvals()
RETURNS TABLE(escalated_count INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  r RECORD;
  v_superior UUID;
BEGIN
  FOR r IN
    SELECT a.* FROM public.approval_assignments a
    WHERE a.status = 'pending'
      AND a.escalated_at IS NULL
      AND a.deadline_at < now()
  LOOP
    SELECT superior_approver_id INTO v_superior
    FROM public.budget_approvers WHERE user_id = r.approver_id;

    UPDATE public.approval_assignments
    SET escalated_at = now(),
        escalated_to = v_superior,
        status = CASE WHEN v_superior IS NOT NULL THEN 'escalated' ELSE status END
    WHERE id = r.id;

    IF v_superior IS NOT NULL THEN
      INSERT INTO public.approval_notifications(assignment_id, recipient_id, notification_type, payload)
      VALUES (r.id, v_superior, 'escalation',
        jsonb_build_object('original_approver', r.approver_id, 'deadline', r.deadline_at));
    END IF;
    v_count := v_count + 1;
  END LOOP;
  RETURN QUERY SELECT v_count;
END;
$$;

-- 6. Trigger: ao submeter merit request, cria assignment + notifica
CREATE OR REPLACE FUNCTION public.create_merit_approval_assignment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sla INTEGER := 5;
  v_company UUID;
  v_approver UUID;
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'pending') THEN
    SELECT root_company_id INTO v_company FROM public.profiles WHERE id = NEW.employee_id;
    SELECT sla_business_days INTO v_sla
      FROM public.approval_sla_config
      WHERE root_company_id = v_company AND approval_type IN ('merit','all')
      ORDER BY approval_type = 'merit' DESC LIMIT 1;
    v_sla := COALESCE(v_sla, 5);
    v_approver := COALESCE(NEW.approver_id, NEW.requested_by);

    INSERT INTO public.approval_assignments(
      root_company_id, approval_type, source_id, approver_id, deadline_at
    ) VALUES (
      v_company, 'merit', NEW.id, v_approver, now() + (v_sla || ' days')::INTERVAL
    );

    INSERT INTO public.approval_notifications(recipient_id, notification_type, payload)
    VALUES (v_approver, 'new_request',
      jsonb_build_object('source_id', NEW.id, 'type', 'merit', 'employee_id', NEW.employee_id));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_merit_assignment ON public.merit_approval_requests;
CREATE TRIGGER trg_create_merit_assignment
AFTER INSERT OR UPDATE ON public.merit_approval_requests
FOR EACH ROW EXECUTE FUNCTION public.create_merit_approval_assignment();

-- 7. Trigger: ao submeter talent recommendation
CREATE OR REPLACE FUNCTION public.create_talent_approval_assignment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sla INTEGER := 5;
  v_approver UUID;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'submitted' THEN
    SELECT sla_business_days INTO v_sla
      FROM public.approval_sla_config
      WHERE root_company_id = NEW.root_company_id AND approval_type IN ('talent','all')
      ORDER BY approval_type = 'talent' DESC LIMIT 1;
    v_sla := COALESCE(v_sla, 5);
    v_approver := COALESCE(NEW.reviewed_by, NEW.submitted_by);

    IF v_approver IS NOT NULL THEN
      INSERT INTO public.approval_assignments(
        root_company_id, approval_type, source_id, approver_id, deadline_at
      ) VALUES (
        NEW.root_company_id, 'talent', NEW.id, v_approver, now() + (v_sla || ' days')::INTERVAL
      );

      INSERT INTO public.approval_notifications(recipient_id, notification_type, payload)
      VALUES (v_approver, 'new_request',
        jsonb_build_object('source_id', NEW.id, 'type', 'talent', 'employee_id', NEW.employee_id));
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved','rejected') THEN
    UPDATE public.approval_assignments
    SET status = 'completed', completed_at = now()
    WHERE approval_type = 'talent' AND source_id = NEW.id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_talent_assignment ON public.talent_intelligence_recommendations;
CREATE TRIGGER trg_create_talent_assignment
AFTER UPDATE ON public.talent_intelligence_recommendations
FOR EACH ROW EXECUTE FUNCTION public.create_talent_approval_assignment();
