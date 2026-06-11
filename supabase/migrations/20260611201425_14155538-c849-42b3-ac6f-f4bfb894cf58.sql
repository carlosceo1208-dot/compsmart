
-- ============ Templates de de-para ============
CREATE TABLE public.nr1_mapeamentos_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  created_by UUID DEFAULT auth.uid(),
  metodologia public.nr1_matriz_metodologia NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  mapeamento JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  uso_count INTEGER NOT NULL DEFAULT 0,
  ultimo_uso_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, metodologia, nome)
);

CREATE INDEX idx_nr1_map_tpl_company ON public.nr1_mapeamentos_templates(company_id, metodologia);

-- Apenas um default por (empresa, metodologia)
CREATE UNIQUE INDEX idx_nr1_map_tpl_default_unico
  ON public.nr1_mapeamentos_templates(company_id, metodologia)
  WHERE is_default = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nr1_mapeamentos_templates TO authenticated;
GRANT ALL ON public.nr1_mapeamentos_templates TO service_role;

ALTER TABLE public.nr1_mapeamentos_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nr1_map_tpl_select" ON public.nr1_mapeamentos_templates
FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id()
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role]));

CREATE POLICY "nr1_map_tpl_insert" ON public.nr1_mapeamentos_templates
FOR INSERT TO authenticated
WITH CHECK (company_id = public.get_user_company_id()
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role]));

CREATE POLICY "nr1_map_tpl_update" ON public.nr1_mapeamentos_templates
FOR UPDATE TO authenticated
USING (company_id = public.get_user_company_id()
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role]));

CREATE POLICY "nr1_map_tpl_delete" ON public.nr1_mapeamentos_templates
FOR DELETE TO authenticated
USING (company_id = public.get_user_company_id()
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role]));

CREATE TRIGGER trg_nr1_map_tpl_updated_at
BEFORE UPDATE ON public.nr1_mapeamentos_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Modo de entrada + texto livre + ref template ============
DO $$ BEGIN
  CREATE TYPE public.nr1_matriz_modo AS ENUM ('arquivo','texto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.nr1_importacoes_matriz
  ADD COLUMN IF NOT EXISTS modo public.nr1_matriz_modo NOT NULL DEFAULT 'arquivo',
  ADD COLUMN IF NOT EXISTS texto_livre TEXT,
  ADD COLUMN IF NOT EXISTS mapeamento_aplicado JSONB,
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.nr1_mapeamentos_templates(id) ON DELETE SET NULL;

-- arquivo_* deixam de ser obrigatórios quando modo='texto'
ALTER TABLE public.nr1_importacoes_matriz ALTER COLUMN arquivo_path DROP NOT NULL;
ALTER TABLE public.nr1_importacoes_matriz ALTER COLUMN arquivo_nome DROP NOT NULL;
ALTER TABLE public.nr1_importacoes_matriz ALTER COLUMN arquivo_tamanho DROP NOT NULL;
ALTER TABLE public.nr1_importacoes_matriz ALTER COLUMN arquivo_mime DROP NOT NULL;

-- Garantia: arquivo OU texto, conforme o modo
ALTER TABLE public.nr1_importacoes_matriz
  ADD CONSTRAINT nr1_imp_matriz_modo_chk
  CHECK (
    (modo = 'arquivo' AND arquivo_path IS NOT NULL)
    OR (modo = 'texto' AND texto_livre IS NOT NULL AND length(texto_livre) > 0)
  );

-- Função para incrementar uso de template
CREATE OR REPLACE FUNCTION public.nr1_template_marcar_uso(_template_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.nr1_mapeamentos_templates
  SET uso_count = uso_count + 1, ultimo_uso_em = now()
  WHERE id = _template_id
    AND company_id = public.get_user_company_id();
END;
$$;

REVOKE ALL ON FUNCTION public.nr1_template_marcar_uso(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nr1_template_marcar_uso(UUID) TO authenticated;
