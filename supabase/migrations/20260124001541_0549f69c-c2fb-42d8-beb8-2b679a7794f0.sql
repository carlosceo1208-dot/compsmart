-- Security Status snapshots (auditável)

CREATE TABLE IF NOT EXISTS public.security_scan_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  active_error_count integer NOT NULL DEFAULT 0,
  ignored_findings jsonb NOT NULL DEFAULT '[]'::jsonb
);

-- Índices para listagem/último scan
CREATE INDEX IF NOT EXISTS idx_security_scan_snapshots_created_at
  ON public.security_scan_snapshots (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_scan_snapshots_created_by
  ON public.security_scan_snapshots (created_by);

-- RLS
ALTER TABLE public.security_scan_snapshots ENABLE ROW LEVEL SECURITY;

-- Somente super_admin pode ler
DROP POLICY IF EXISTS "Super admins can read security scan snapshots" ON public.security_scan_snapshots;
CREATE POLICY "Super admins can read security scan snapshots"
  ON public.security_scan_snapshots
  FOR SELECT
  USING (public.is_super_admin());

-- Somente super_admin pode inserir
DROP POLICY IF EXISTS "Super admins can insert security scan snapshots" ON public.security_scan_snapshots;
CREATE POLICY "Super admins can insert security scan snapshots"
  ON public.security_scan_snapshots
  FOR INSERT
  WITH CHECK (public.is_super_admin());

-- (Opcional) Somente super_admin pode deletar
DROP POLICY IF EXISTS "Super admins can delete security scan snapshots" ON public.security_scan_snapshots;
CREATE POLICY "Super admins can delete security scan snapshots"
  ON public.security_scan_snapshots
  FOR DELETE
  USING (public.is_super_admin());

-- Helper view: último snapshot (invoker)
CREATE OR REPLACE VIEW public.security_scan_latest
WITH (security_invoker=on) AS
  SELECT *
  FROM public.security_scan_snapshots
  ORDER BY created_at DESC
  LIMIT 1;

-- Bloquear acesso direto à tabela por quem não é super_admin (já coberto por policy),
-- e permitir o view para super_admin via policy da tabela (invoker respeita RLS).