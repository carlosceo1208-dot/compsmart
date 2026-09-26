UPDATE public.modules SET nome = 'Recrutamento & Seleção (Aquisição de talentos)' WHERE slug = 'talent';

CREATE TABLE public.vagas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  root_company_id uuid NOT NULL,
  titulo text NOT NULL,
  area text,
  senioridade text NOT NULL DEFAULT 'pleno' CHECK (senioridade IN ('junior','pleno','senior','especialista')),
  cbo text,
  descricao_cargo_id uuid REFERENCES public.job_titles(id) ON DELETE SET NULL,
  responsabilidades text,
  requisitos_obrigatorios text,
  requisitos_desejaveis text,
  competencias text[] NOT NULL DEFAULT '{}',
  faixa_salarial_min numeric,
  faixa_salarial_max numeric,
  modelo_trabalho text NOT NULL DEFAULT 'presencial' CHECK (modelo_trabalho IN ('remoto','hibrido','presencial')),
  localizacao text,
  tipo_contratacao text NOT NULL DEFAULT 'clt' CHECK (tipo_contratacao IN ('clt','pj','estagio')),
  qtd_vagas integer NOT NULL DEFAULT 1 CHECK (qtd_vagas >= 1),
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','publicada','pausada','fechada')),
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (faixa_salarial_min IS NULL OR faixa_salarial_max IS NULL OR faixa_salarial_min <= faixa_salarial_max)
);
CREATE INDEX vagas_company_idx ON public.vagas(root_company_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vagas TO authenticated;
GRANT ALL ON public.vagas TO service_role;
ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vagas: RH da empresa gerencia" ON public.vagas FOR ALL TO authenticated
USING (
  (root_company_id = public.get_user_company_id() AND public.has_module('talent')
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_manager')))
  OR public.has_role(auth.uid(),'super_admin')
)
WITH CHECK (
  (root_company_id = public.get_user_company_id() AND public.has_module('talent')
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_manager')))
  OR public.has_role(auth.uid(),'super_admin')
);

CREATE TRIGGER update_vagas_updated_at BEFORE UPDATE ON public.vagas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cadastra cargo na biblioteca da empresa sem duplicar (mesmo CBO ou mesmo nome)
CREATE OR REPLACE FUNCTION public.talent_link_or_create_job_title(
  _title text, _cbo text, _job_family text, _grade text,
  _responsibilities text, _hard_skills text, _soft_skills text, _experience text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _company uuid := public.get_user_company_id();
  _existing uuid;
  _new uuid;
BEGIN
  IF _company IS NULL OR NOT public.has_module('talent')
     OR NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_manager') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  IF coalesce(trim(_title),'') = '' OR coalesce(trim(_job_family),'') = '' OR coalesce(trim(_grade),'') = '' THEN
    RAISE EXCEPTION 'Título, família e nível são obrigatórios';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(_company::text || 'job_titles'));

  SELECT id INTO _existing FROM public.job_titles
  WHERE root_company_id = _company
    AND ((coalesce(_cbo,'') <> '' AND cbo = _cbo)
      OR lower(public.unaccent_safe(title)) = lower(public.unaccent_safe(_title)))
  LIMIT 1;

  IF _existing IS NOT NULL THEN
    RETURN jsonb_build_object('id', _existing, 'existed', true);
  END IF;

  INSERT INTO public.job_titles (root_company_id, title, cbo, code, job_family, grade, median_points,
    main_responsibilities, hard_skills, soft_skills, required_experience, is_active)
  VALUES (_company, left(trim(_title),200), coalesce(_cbo,''), 'RS-' || substr(md5(random()::text),1,6),
    left(_job_family,100), left(_grade,50), 0, _responsibilities, _hard_skills, _soft_skills, _experience, true)
  RETURNING id INTO _new;
  RETURN jsonb_build_object('id', _new, 'existed', false);
END $$;

CREATE OR REPLACE FUNCTION public.unaccent_safe(t text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT translate(coalesce(t,''), 'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')
$$;

REVOKE EXECUTE ON FUNCTION public.talent_link_or_create_job_title(text,text,text,text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.talent_link_or_create_job_title(text,text,text,text,text,text,text,text) TO authenticated;