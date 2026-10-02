ALTER TYPE public.nr1_matriz_status ADD VALUE IF NOT EXISTS 'conferido';
ALTER TYPE public.nr1_matriz_status ADD VALUE IF NOT EXISTS 'rejeitado';

ALTER TABLE public.nr1_importacoes_matriz
  ADD COLUMN IF NOT EXISTS motivo_rejeicao text,
  ADD COLUMN IF NOT EXISTS conferido_por uuid,
  ADD COLUMN IF NOT EXISTS conferido_em timestamptz;

CREATE OR REPLACE FUNCTION public.nr1_importacao_pode_gerir(_company uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _company IS NOT NULL AND _company = public.get_user_company_id() AND (
    public.is_super_admin(auth.uid())
    OR (public.has_module('nr1') AND (
      public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role])
      OR public.consultor_dono_ativo(_company)))
  )
$$;
REVOKE EXECUTE ON FUNCTION public.nr1_importacao_pode_gerir(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.nr1_importacao_pode_gerir(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.nr1_importacao_transicao()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status::text IS DISTINCT FROM OLD.status::text
     AND NEW.status::text IN ('conferido','rejeitado') THEN
    IF OLD.status::text <> 'pendente' THEN
      RAISE EXCEPTION 'Só importações pendentes podem ser conferidas ou rejeitadas';
    END IF;
    NEW.conferido_por := auth.uid();
    NEW.conferido_em := now();
  ELSIF OLD.status::text IN ('conferido','rejeitado')
     AND (NEW.status::text IS DISTINCT FROM OLD.status::text
          OR NEW.motivo_rejeicao IS DISTINCT FROM OLD.motivo_rejeicao) THEN
    RAISE EXCEPTION 'Importação já conferida ou rejeitada não pode ser alterada';
  END IF;
  IF NEW.status::text = 'rejeitado' AND length(trim(coalesce(NEW.motivo_rejeicao,''))) < 3 THEN
    RAISE EXCEPTION 'Motivo da rejeição é obrigatório';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS nr1_importacao_transicao_trg ON public.nr1_importacoes_matriz;
CREATE TRIGGER nr1_importacao_transicao_trg BEFORE UPDATE ON public.nr1_importacoes_matriz
FOR EACH ROW EXECUTE FUNCTION public.nr1_importacao_transicao();

DROP POLICY IF EXISTS nr1_imp_matriz_select ON public.nr1_importacoes_matriz;
CREATE POLICY nr1_imp_matriz_select ON public.nr1_importacoes_matriz FOR SELECT TO authenticated
  USING (public.nr1_importacao_pode_gerir(company_id));
DROP POLICY IF EXISTS nr1_imp_matriz_update ON public.nr1_importacoes_matriz;
CREATE POLICY nr1_imp_matriz_update ON public.nr1_importacoes_matriz FOR UPDATE TO authenticated
  USING (public.nr1_importacao_pode_gerir(company_id))
  WITH CHECK (public.nr1_importacao_pode_gerir(company_id));

DROP POLICY IF EXISTS nr1_matriz_storage_select ON storage.objects;
CREATE POLICY nr1_matriz_storage_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'nr1-importacoes-matriz'
    AND public.nr1_importacao_pode_gerir(((storage.foldername(name))[1])::uuid));