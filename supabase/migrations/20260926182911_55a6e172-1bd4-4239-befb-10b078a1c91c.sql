CREATE OR REPLACE FUNCTION public.vagas_bloquear_exclusao()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.status <> 'rascunho' THEN
    RAISE EXCEPTION 'Somente vagas em rascunho podem ser excluídas.';
  END IF;
  RETURN OLD;
END; $$;
DROP TRIGGER IF EXISTS vagas_bloquear_exclusao ON public.vagas;
CREATE TRIGGER vagas_bloquear_exclusao BEFORE DELETE ON public.vagas
FOR EACH ROW EXECUTE FUNCTION public.vagas_bloquear_exclusao();