-- 1. Regra de acesso condicional
CREATE OR REPLACE FUNCTION public.has_consultor_modulo_access(_tenant_id uuid, _module_slug text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _tenant_id IS NOT NULL
    AND _module_slug = ANY(ARRAY['core'])
    AND public.has_role(auth.uid(), 'consultor')
    AND EXISTS (
      SELECT 1
      FROM public.tenant_subscriptions ts
      JOIN public.modules m ON m.id = ts.module_id
      WHERE ts.tenant_id = _tenant_id
        AND m.slug = 'rh-service'
        AND ts.status = 'active'
        AND (ts.expires_at IS NULL OR ts.expires_at > now())
    )
    AND EXISTS (
      SELECT 1
      FROM public.rh_service_projetos p
      WHERE p.tenant_id = _tenant_id
        AND p.status = 'em_andamento'
        AND p.consultor_id IS NOT NULL
    )
$$;

REVOKE ALL ON FUNCTION public.has_consultor_modulo_access(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_consultor_modulo_access(uuid, text) TO authenticated;

-- 2. Importação passa a exigir a regra para consultor
CREATE OR REPLACE FUNCTION public.employee_import_can_manage(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin(auth.uid())
     OR (
       _tenant_id IS NOT NULL
       AND _tenant_id = public.get_user_company_id()
       AND (
         public.has_role(auth.uid(), 'admin')
         OR public.has_role(auth.uid(), 'hr_manager')
       )
     )
     OR (
       _tenant_id IS NOT NULL
       AND _tenant_id = public.get_user_company_id()
       AND public.has_consultor_modulo_access(_tenant_id, 'core')
     )
$$;

-- 3. Leitura condicionada, sempre amarrada ao tenant verificado
DROP POLICY IF EXISTS "Consultor RH Service views tenant profiles" ON public.profiles;
CREATE POLICY "Consultor RH Service views tenant profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  root_company_id IS NOT NULL
  AND root_company_id = public.get_user_company_id()
  AND public.has_consultor_modulo_access(root_company_id, 'core')
);

DROP POLICY IF EXISTS "Consultor RH Service views tenant job titles" ON public.job_titles;
CREATE POLICY "Consultor RH Service views tenant job titles"
ON public.job_titles FOR SELECT TO authenticated
USING (
  root_company_id IS NOT NULL
  AND root_company_id = public.get_user_company_id()
  AND public.has_consultor_modulo_access(root_company_id, 'core')
);

DROP POLICY IF EXISTS "Consultor RH Service views tenant salary ranges" ON public.salary_ranges;
CREATE POLICY "Consultor RH Service views tenant salary ranges"
ON public.salary_ranges FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.salary_tables st
    WHERE st.id = salary_ranges.salary_table_id
      AND st.root_company_id IS NOT NULL
      AND st.root_company_id = public.get_user_company_id()
      AND public.has_consultor_modulo_access(st.root_company_id, 'core')
  )
);

DROP POLICY IF EXISTS "Consultor RH Service views tenant evaluations" ON public.performance_evaluations;
CREATE POLICY "Consultor RH Service views tenant evaluations"
ON public.performance_evaluations FOR SELECT TO authenticated
USING (
  root_company_id IS NOT NULL
  AND root_company_id = public.get_user_company_id()
  AND public.has_consultor_modulo_access(root_company_id, 'core')
);

-- 4. Auditoria de acesso liberado e negado
CREATE OR REPLACE FUNCTION public.log_consultor_core_access(
  _action text,
  _tenant_id uuid,
  _details jsonb DEFAULT '{}'::jsonb,
  _granted boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'consultor') THEN
    RETURN;
  END IF;

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data, root_company_id)
  VALUES (
    auth.uid(),
    COALESCE(_action, 'core_access'),
    'core_access',
    NULL,
    jsonb_build_object(
      'action', COALESCE(_action, 'core_access'),
      'granted', COALESCE(_granted, false),
      'result', CASE WHEN COALESCE(_granted, false) THEN 'liberado' ELSE 'negado' END,
      'tenant_id', _tenant_id,
      'details', COALESCE(_details, '{}'::jsonb)
    ),
    _tenant_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_consultor_core_access(text, uuid, jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_consultor_core_access(text, uuid, jsonb, boolean) TO authenticated;