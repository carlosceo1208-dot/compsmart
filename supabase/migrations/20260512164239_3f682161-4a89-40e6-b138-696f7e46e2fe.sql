-- Campos sociodemográficos extras no profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS work_modality text,
  ADD COLUMN IF NOT EXISTS shift text,
  ADD COLUMN IF NOT EXISTS leadership_level text,
  ADD COLUMN IF NOT EXISTS pcd boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS nr1_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS nr1_consent_version text;

-- Log de acesso a dados sensíveis NR-1
CREATE TABLE IF NOT EXISTS public.nr1_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  actor_user_id uuid NOT NULL,
  actor_role text NOT NULL,
  action text NOT NULL,
  resource text NOT NULL,
  filters jsonb,
  k_value integer,
  blocked boolean DEFAULT false,
  reason text,
  ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nr1_access_log_company ON public.nr1_access_log(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nr1_access_log_actor ON public.nr1_access_log(actor_user_id, created_at DESC);

ALTER TABLE public.nr1_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nr1_access_log_select_admins"
  ON public.nr1_access_log
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr_manager')
    OR public.has_role(auth.uid(), 'occupational_health')
  );

CREATE POLICY "nr1_access_log_insert_self"
  ON public.nr1_access_log
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_user_id = auth.uid());
