
-- Empresas terceiras cadastradas por cada empresa cliente
CREATE TABLE public.nr1_terceiros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  razao_social text NOT NULL,
  nome_fantasia text,
  cnpj text NOT NULL,
  contato_nome text,
  contato_email text,
  contato_telefone text,
  num_colaboradores integer,
  area_atuacao text,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, cnpj)
);
CREATE INDEX idx_nr1_terc_company ON public.nr1_terceiros(company_id);
CREATE INDEX idx_nr1_terc_cnpj ON public.nr1_terceiros(cnpj);

-- Versões de PGR carregadas para cada terceira
CREATE TABLE public.nr1_terceiros_pgr (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terceiro_id uuid NOT NULL REFERENCES public.nr1_terceiros(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  versao text NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  mime_type text,
  data_emissao date,
  data_vencimento date,
  observacoes text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_nr1_terc_pgr_terceiro ON public.nr1_terceiros_pgr(terceiro_id);
CREATE INDEX idx_nr1_terc_pgr_company ON public.nr1_terceiros_pgr(company_id);

-- Triggers
CREATE TRIGGER trg_nr1_terc_upd BEFORE UPDATE ON public.nr1_terceiros
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nr1_terceiros TO authenticated;
GRANT ALL ON public.nr1_terceiros TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nr1_terceiros_pgr TO authenticated;
GRANT ALL ON public.nr1_terceiros_pgr TO service_role;

-- RLS
ALTER TABLE public.nr1_terceiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nr1_terceiros_pgr ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nr1_terc_select" ON public.nr1_terceiros FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id()
         AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role]));
CREATE POLICY "nr1_terc_insert" ON public.nr1_terceiros FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id()
              AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role]));
CREATE POLICY "nr1_terc_update" ON public.nr1_terceiros FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id()
         AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role]));
CREATE POLICY "nr1_terc_delete" ON public.nr1_terceiros FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id()
         AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "nr1_terc_pgr_select" ON public.nr1_terceiros_pgr FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id()
         AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role]));
CREATE POLICY "nr1_terc_pgr_insert" ON public.nr1_terceiros_pgr FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id()
              AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role]));
CREATE POLICY "nr1_terc_pgr_delete" ON public.nr1_terceiros_pgr FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id()
         AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role]));

-- Storage RLS para o bucket nr1-pgr-docs (criado via tool)
-- Paths esperados: <company_id>/<terceiro_id>/<filename>
CREATE POLICY "nr1_pgr_storage_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'nr1-pgr-docs'
         AND (storage.foldername(name))[1] = public.get_user_company_id()::text
         AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role]));
CREATE POLICY "nr1_pgr_storage_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'nr1-pgr-docs'
              AND (storage.foldername(name))[1] = public.get_user_company_id()::text
              AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role]));
CREATE POLICY "nr1_pgr_storage_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'nr1-pgr-docs'
         AND (storage.foldername(name))[1] = public.get_user_company_id()::text
         AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role]));
