CREATE OR REPLACE FUNCTION public.nr1_importacao_transicao()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.conferido_por := OLD.conferido_por;
  NEW.conferido_em := OLD.conferido_em;
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