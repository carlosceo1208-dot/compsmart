
DO $$ BEGIN
  CREATE TYPE public.nr1_matriz_metodologia AS ENUM ('COPSOQ-III','HSE','JCQ','ERI','OUTRA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.nr1_matriz_status AS ENUM ('pendente','em_mapeamento','mapeado','publicado','erro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.nr1_importacoes_matriz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  created_by UUID DEFAULT auth.uid(),
  metodologia public.nr1_matriz_metodologia NOT NULL,
  metodologia_outra TEXT,
  arquivo_path TEXT NOT NULL,
  arquivo_nome TEXT NOT NULL,
  arquivo_tamanho INTEGER NOT NULL,
  arquivo_mime TEXT NOT NULL,
  consultoria TEXT,
  data_diagnostico DATE,
  observacoes TEXT,
  status public.nr1_matriz_status NOT NULL DEFAULT 'pendente',
  mapeamento_resultado JSONB,
  diagnostico_id UUID REFERENCES public.nr1_diagnosticos(id) ON DELETE SET NULL,
  erro_mensagem TEXT,
  processado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nr1_imp_matriz_company ON public.nr1_importacoes_matriz(company_id);
CREATE INDEX idx_nr1_imp_matriz_status ON public.nr1_importacoes_matriz(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nr1_importacoes_matriz TO authenticated;
GRANT ALL ON public.nr1_importacoes_matriz TO service_role;

ALTER TABLE public.nr1_importacoes_matriz ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nr1_imp_matriz_select" ON public.nr1_importacoes_matriz
FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id()
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role]));

CREATE POLICY "nr1_imp_matriz_insert" ON public.nr1_importacoes_matriz
FOR INSERT TO authenticated
WITH CHECK (company_id = public.get_user_company_id()
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role]));

CREATE POLICY "nr1_imp_matriz_update" ON public.nr1_importacoes_matriz
FOR UPDATE TO authenticated
USING (company_id = public.get_user_company_id()
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role]));

CREATE POLICY "nr1_imp_matriz_delete" ON public.nr1_importacoes_matriz
FOR DELETE TO authenticated
USING (company_id = public.get_user_company_id()
  AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_nr1_imp_matriz_updated_at
BEFORE UPDATE ON public.nr1_importacoes_matriz
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies — path: {company_id}/{importacao_id}/{filename}
CREATE POLICY "nr1_matriz_storage_select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'nr1-importacoes-matriz'
  AND (storage.foldername(name))[1] = public.get_user_company_id()::text
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role])
);

CREATE POLICY "nr1_matriz_storage_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'nr1-importacoes-matriz'
  AND (storage.foldername(name))[1] = public.get_user_company_id()::text
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role])
);

CREATE POLICY "nr1_matriz_storage_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'nr1-importacoes-matriz'
  AND (storage.foldername(name))[1] = public.get_user_company_id()::text
  AND public.has_role(auth.uid(), 'admin'::app_role)
);
