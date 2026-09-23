
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS linkedin text,
  ADD COLUMN IF NOT EXISTS parceria_tipo text,
  ADD COLUMN IF NOT EXISTS especialidade text;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_parceria_tipo_check
  CHECK (parceria_tipo IS NULL OR parceria_tipo IN ('indicacao','consultor','ambos'));

ALTER TABLE public.module_pricing
  ADD COLUMN IF NOT EXISTS preco_por_colaborador numeric,
  ADD COLUMN IF NOT EXISTS desconto_modulo_adicional_pct numeric;

CREATE TABLE IF NOT EXISTS public.public_pricing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT true,
  preco_base_colaborador numeric NOT NULL DEFAULT 5.00,
  desconto_modulo_adicional_pct numeric NOT NULL DEFAULT 50,
  desconto_semestral_pct numeric NOT NULL DEFAULT 5,
  desconto_anual_pct numeric NOT NULL DEFAULT 10,
  moeda text NOT NULL DEFAULT 'BRL',
  faixas jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.public_pricing_config TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_pricing_config TO authenticated;
GRANT ALL ON public.public_pricing_config TO service_role;

ALTER TABLE public.public_pricing_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_pricing_config_read ON public.public_pricing_config;
CREATE POLICY public_pricing_config_read
  ON public.public_pricing_config FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS public_pricing_config_manage ON public.public_pricing_config;
CREATE POLICY public_pricing_config_manage
  ON public.public_pricing_config FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER update_public_pricing_config_updated_at
  BEFORE UPDATE ON public.public_pricing_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.public_pricing_config (faixas)
SELECT '[
  {"slug":"essencial","nome":"Essencial","min":1,"max":50,"sob_consulta":false},
  {"slug":"profissional","nome":"Profissional","min":51,"max":250,"sob_consulta":false},
  {"slug":"corporativo","nome":"Corporativo","min":251,"max":1000,"sob_consulta":false},
  {"slug":"enterprise","nome":"Enterprise","min":1001,"max":null,"sob_consulta":true}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.public_pricing_config);

CREATE OR REPLACE FUNCTION public.get_public_pricing()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'moeda', c.moeda,
    'preco_base_colaborador', c.preco_base_colaborador,
    'desconto_modulo_adicional_pct', c.desconto_modulo_adicional_pct,
    'desconto_semestral_pct', c.desconto_semestral_pct,
    'desconto_anual_pct', c.desconto_anual_pct,
    'faixas', c.faixas,
    'modulos', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'slug', m.slug,
        'nome', m.nome,
        'nome_agente', m.nome_agente,
        'is_negotiable', m.is_negotiable,
        'is_legal_product', m.is_legal_product,
        'ordem', m.ordem
      ) ORDER BY m.ordem), '[]'::jsonb)
      FROM public.modules m
      WHERE m.is_active = true
    )
  )
  FROM public.public_pricing_config c
  WHERE c.is_active = true
  ORDER BY c.created_at
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_pricing() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_pricing() TO anon, authenticated;
