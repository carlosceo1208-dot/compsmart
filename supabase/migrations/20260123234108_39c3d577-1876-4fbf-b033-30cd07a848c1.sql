-- FIX: permitir root_company_id NULL no diretório para não quebrar com perfis legados incompletos
-- (linhas com root_company_id NULL não serão visíveis via RLS do diretório)

BEGIN;

CREATE TABLE IF NOT EXISTS public.profiles_directory (
  user_id uuid PRIMARY KEY,
  root_company_id uuid NULL,
  full_name text NOT NULL,
  job_title text NULL,
  grade text NULL,
  unit_id uuid NULL,
  avatar_url text NULL,
  status user_status NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Caso a tabela já exista (tentativas anteriores), garante a coluna como NULLABLE
ALTER TABLE public.profiles_directory
  ALTER COLUMN root_company_id DROP NOT NULL;

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_directory_company ON public.profiles_directory (root_company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_directory_company_unit ON public.profiles_directory (root_company_id, unit_id);
CREATE INDEX IF NOT EXISTS idx_profiles_directory_company_status ON public.profiles_directory (root_company_id, status);
CREATE INDEX IF NOT EXISTS idx_profiles_directory_company_full_name ON public.profiles_directory (root_company_id, full_name);

-- RLS
ALTER TABLE public.profiles_directory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own company profiles directory" ON public.profiles_directory;
CREATE POLICY "Users view own company profiles directory"
ON public.profiles_directory
FOR SELECT
USING (root_company_id = get_user_company_id());

DROP POLICY IF EXISTS "No direct insert to profiles_directory" ON public.profiles_directory;
DROP POLICY IF EXISTS "No direct update to profiles_directory" ON public.profiles_directory;
DROP POLICY IF EXISTS "No direct delete to profiles_directory" ON public.profiles_directory;

CREATE POLICY "No direct insert to profiles_directory"
ON public.profiles_directory
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No direct update to profiles_directory"
ON public.profiles_directory
FOR UPDATE
USING (false);

CREATE POLICY "No direct delete to profiles_directory"
ON public.profiles_directory
FOR DELETE
USING (false);

-- Sync trigger function
CREATE OR REPLACE FUNCTION public.sync_profiles_directory_from_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.profiles_directory
    WHERE user_id = OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO public.profiles_directory (
    user_id,
    root_company_id,
    full_name,
    job_title,
    grade,
    unit_id,
    avatar_url,
    status,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.root_company_id,
    COALESCE(NULLIF(NEW.full_name, ''), 'Usuário'),
    NEW.job_title,
    NEW.grade,
    NEW.unit_id,
    NEW.avatar_url,
    NEW.status,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    root_company_id = EXCLUDED.root_company_id,
    full_name = EXCLUDED.full_name,
    job_title = EXCLUDED.job_title,
    grade = EXCLUDED.grade,
    unit_id = EXCLUDED.unit_id,
    avatar_url = EXCLUDED.avatar_url,
    status = EXCLUDED.status,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profiles_directory_aiud ON public.profiles;
CREATE TRIGGER trg_sync_profiles_directory_aiud
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profiles_directory_from_profiles();

-- Backfill
INSERT INTO public.profiles_directory (
  user_id,
  root_company_id,
  full_name,
  job_title,
  grade,
  unit_id,
  avatar_url,
  status,
  updated_at
)
SELECT
  p.id,
  p.root_company_id,
  COALESCE(NULLIF(p.full_name, ''), 'Usuário'),
  p.job_title,
  p.grade,
  p.unit_id,
  p.avatar_url,
  p.status,
  now()
FROM public.profiles p
ON CONFLICT (user_id) DO UPDATE SET
  root_company_id = EXCLUDED.root_company_id,
  full_name = EXCLUDED.full_name,
  job_title = EXCLUDED.job_title,
  grade = EXCLUDED.grade,
  unit_id = EXCLUDED.unit_id,
  avatar_url = EXCLUDED.avatar_url,
  status = EXCLUDED.status,
  updated_at = now();

COMMIT;
