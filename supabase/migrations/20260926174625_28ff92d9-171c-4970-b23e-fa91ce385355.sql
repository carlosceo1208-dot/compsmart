ALTER TABLE public.vagas ADD COLUMN IF NOT EXISTS uf text, ADD COLUMN IF NOT EXISTS cidade text;
CREATE OR REPLACE FUNCTION public.vagas_validar_local() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.uf IS NOT NULL AND NEW.uf <> '' AND NEW.uf NOT IN ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO') THEN
    RAISE EXCEPTION 'UF inválida: %', NEW.uf;
  END IF;
  IF NEW.cidade IS NOT NULL AND length(NEW.cidade) > 120 THEN
    RAISE EXCEPTION 'Cidade muito longa';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS vagas_validar_local ON public.vagas;
CREATE TRIGGER vagas_validar_local BEFORE INSERT OR UPDATE ON public.vagas FOR EACH ROW EXECUTE FUNCTION public.vagas_validar_local();