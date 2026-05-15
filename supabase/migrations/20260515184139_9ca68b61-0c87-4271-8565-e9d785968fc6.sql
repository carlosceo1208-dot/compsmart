-- ============== ENUMS ==============
DO $$ BEGIN
  CREATE TYPE public.nr1_jornada_status AS ENUM ('ativa','pausada','concluida','encerrada_pelo_usuario');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============== nr1_jornadas ==============
CREATE TABLE IF NOT EXISTS public.nr1_jornadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  status public.nr1_jornada_status NOT NULL DEFAULT 'ativa',
  semana_atual smallint NOT NULL DEFAULT 1 CHECK (semana_atual BETWEEN 1 AND 12),
  momento_atual smallint NOT NULL DEFAULT 1 CHECK (momento_atual BETWEEN 1 AND 8),
  consent_anonimo_at timestamptz,
  consent_id_at timestamptz,
  encerramento_motivo text,
  started_at timestamptz NOT NULL DEFAULT now(),
  concluded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nr1_jornadas_user ON public.nr1_jornadas(user_id);
CREATE INDEX IF NOT EXISTS idx_nr1_jornadas_company ON public.nr1_jornadas(company_id);
CREATE INDEX IF NOT EXISTS idx_nr1_jornadas_status ON public.nr1_jornadas(status);

ALTER TABLE public.nr1_jornadas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user manages own jornada" ON public.nr1_jornadas;
CREATE POLICY "user manages own jornada"
  ON public.nr1_jornadas FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_nr1_jornadas_updated_at
  BEFORE UPDATE ON public.nr1_jornadas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== nr1_jornada_mensagens ==============
CREATE TABLE IF NOT EXISTS public.nr1_jornada_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jornada_id uuid NOT NULL REFERENCES public.nr1_jornadas(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  momento smallint CHECK (momento BETWEEN 1 AND 8),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nr1_jornada_mensagens_jornada ON public.nr1_jornada_mensagens(jornada_id, created_at);

ALTER TABLE public.nr1_jornada_mensagens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user manages own jornada msgs" ON public.nr1_jornada_mensagens;
CREATE POLICY "user manages own jornada msgs"
  ON public.nr1_jornada_mensagens FOR ALL
  USING (EXISTS (SELECT 1 FROM public.nr1_jornadas j WHERE j.id = jornada_id AND j.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.nr1_jornadas j WHERE j.id = jornada_id AND j.user_id = auth.uid()));

-- ============== nr1_checkins_semanais ==============
CREATE TABLE IF NOT EXISTS public.nr1_checkins_semanais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jornada_id uuid NOT NULL REFERENCES public.nr1_jornadas(id) ON DELETE CASCADE,
  semana smallint NOT NULL CHECK (semana BETWEEN 1 AND 12),
  humor_1_10 smallint NOT NULL CHECK (humor_1_10 BETWEEN 1 AND 10),
  acoes_executadas jsonb NOT NULL DEFAULT '[]'::jsonb,
  comentario text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (jornada_id, semana)
);
CREATE INDEX IF NOT EXISTS idx_nr1_checkins_jornada ON public.nr1_checkins_semanais(jornada_id);

ALTER TABLE public.nr1_checkins_semanais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user manages own checkins" ON public.nr1_checkins_semanais;
CREATE POLICY "user manages own checkins"
  ON public.nr1_checkins_semanais FOR ALL
  USING (EXISTS (SELECT 1 FROM public.nr1_jornadas j WHERE j.id = jornada_id AND j.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.nr1_jornadas j WHERE j.id = jornada_id AND j.user_id = auth.uid()));

-- ============== View agregada para RH (mín. 5 respondentes) ==============
CREATE OR REPLACE VIEW public.nr1_checkins_agregado AS
SELECT
  j.company_id,
  c.semana,
  COUNT(*) AS total_respondentes,
  ROUND(AVG(c.humor_1_10)::numeric, 2) AS humor_medio,
  MIN(c.criado_em) AS primeira_resposta,
  MAX(c.criado_em) AS ultima_resposta
FROM public.nr1_checkins_semanais c
JOIN public.nr1_jornadas j ON j.id = c.jornada_id
GROUP BY j.company_id, c.semana
HAVING COUNT(*) >= 5;

GRANT SELECT ON public.nr1_checkins_agregado TO authenticated;