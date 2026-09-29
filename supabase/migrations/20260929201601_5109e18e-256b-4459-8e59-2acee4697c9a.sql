ALTER TABLE public.consultores ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS consultores_user_id_uniq ON public.consultores(user_id) WHERE user_id IS NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='rh_service_projetos_consultor_fk') THEN
    ALTER TABLE public.rh_service_projetos ADD CONSTRAINT rh_service_projetos_consultor_fk FOREIGN KEY (consultor_id) REFERENCES public.consultores(id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.rh_projeto_exige_dono() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.consultor_id IS NULL THEN RAISE EXCEPTION 'Projeto precisa de consultor responsável'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_rh_projeto_exige_dono ON public.rh_service_projetos;
CREATE TRIGGER trg_rh_projeto_exige_dono BEFORE INSERT OR UPDATE OF consultor_id ON public.rh_service_projetos FOR EACH ROW EXECUTE FUNCTION public.rh_projeto_exige_dono();

CREATE OR REPLACE FUNCTION public.consultor_dono_ativo(_tenant uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT _tenant IS NOT NULL AND auth.uid() IS NOT NULL
    AND public.has_role(auth.uid(),'consultor')
    AND EXISTS (SELECT 1 FROM public.rh_service_projetos p
      JOIN public.consultores c ON c.id = p.consultor_id
      WHERE p.tenant_id = _tenant AND p.status='em_andamento'
        AND c.user_id = auth.uid() AND c.ativo)
$$;
REVOKE EXECUTE ON FUNCTION public.consultor_dono_ativo(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consultor_dono_ativo(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.maturidade_pode_gerir(_company uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT _company IS NOT NULL AND (public.is_super_admin(auth.uid()) OR public.consultor_dono_ativo(_company))
$$;

CREATE OR REPLACE FUNCTION public.has_consultor_modulo_access(_tenant_id uuid, _module_slug text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT _tenant_id IS NOT NULL
    AND _module_slug = ANY(ARRAY['core'])
    AND EXISTS (SELECT 1 FROM public.tenant_subscriptions ts JOIN public.modules m ON m.id=ts.module_id
      WHERE ts.tenant_id=_tenant_id AND m.slug='rh-service' AND ts.status='active'
        AND (ts.expires_at IS NULL OR ts.expires_at > now()))
    AND public.consultor_dono_ativo(_tenant_id)
$$;

CREATE OR REPLACE FUNCTION public.rh_service_can_read(_tenant_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.is_super_admin(auth.uid())
    OR public.consultor_dono_ativo(_tenant_id)
    OR (_tenant_id = public.get_user_company_id()
        AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_manager')))
$$;

CREATE OR REPLACE FUNCTION public.rh_service_can_write(_tenant_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.is_super_admin(auth.uid()) OR public.consultor_dono_ativo(_tenant_id)
$$;