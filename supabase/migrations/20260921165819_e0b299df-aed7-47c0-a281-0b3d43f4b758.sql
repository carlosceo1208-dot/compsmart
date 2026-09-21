-- =========================================================
-- FUNDAÇÃO DE COMPRA MODULAR (backend only)
-- =========================================================

-- 1) MODULES
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  nome_agente TEXT,
  categoria TEXT,
  is_legal_product BOOLEAN NOT NULL DEFAULT false,
  is_negotiable BOOLEAN NOT NULL DEFAULT false,
  descricao TEXT,
  icone TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.modules TO anon;
GRANT SELECT ON public.modules TO authenticated;
GRANT ALL ON public.modules TO service_role;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modules_public_read" ON public.modules
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "modules_super_admin_manage" ON public.modules
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) MODULE PRICING
CREATE TABLE IF NOT EXISTS public.module_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  faixa_min_colaboradores INTEGER NOT NULL,
  faixa_max_colaboradores INTEGER,
  preco_mensal NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (module_id, faixa_min_colaboradores)
);

GRANT SELECT ON public.module_pricing TO anon;
GRANT SELECT ON public.module_pricing TO authenticated;
GRANT ALL ON public.module_pricing TO service_role;
ALTER TABLE public.module_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "module_pricing_public_read" ON public.module_pricing
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "module_pricing_super_admin_manage" ON public.module_pricing
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER update_module_pricing_updated_at BEFORE UPDATE ON public.module_pricing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) BUNDLES
CREATE TABLE IF NOT EXISTS public.bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  percentual_desconto NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bundles TO anon;
GRANT SELECT ON public.bundles TO authenticated;
GRANT ALL ON public.bundles TO service_role;
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bundles_public_read" ON public.bundles
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "bundles_super_admin_manage" ON public.bundles
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER update_bundles_updated_at BEFORE UPDATE ON public.bundles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) BUNDLE_MODULES (N:N)
CREATE TABLE IF NOT EXISTS public.bundle_modules (
  bundle_id UUID NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (bundle_id, module_id)
);

GRANT SELECT ON public.bundle_modules TO anon;
GRANT SELECT ON public.bundle_modules TO authenticated;
GRANT ALL ON public.bundle_modules TO service_role;
ALTER TABLE public.bundle_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bundle_modules_public_read" ON public.bundle_modules
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "bundle_modules_super_admin_manage" ON public.bundle_modules
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- 5) TENANT SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  bundle_id UUID REFERENCES public.bundles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tenant_subscriptions_status_check CHECK (status IN ('active','trial','cancelled')),
  CONSTRAINT tenant_subscriptions_target_check CHECK (module_id IS NOT NULL OR bundle_id IS NOT NULL),
  UNIQUE (tenant_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON public.tenant_subscriptions(tenant_id);

GRANT SELECT ON public.tenant_subscriptions TO authenticated;
GRANT ALL ON public.tenant_subscriptions TO service_role;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_subscriptions_tenant_read" ON public.tenant_subscriptions
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_company_id() OR public.is_super_admin(auth.uid()));
CREATE POLICY "tenant_subscriptions_super_admin_manage" ON public.tenant_subscriptions
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER update_tenant_subscriptions_updated_at BEFORE UPDATE ON public.tenant_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) LEADS (funil de e-books)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  empresa TEXT,
  cargo TEXT,
  porte TEXT,
  modulo_interesse TEXT,
  lead_magnet TEXT,
  consentimento_lgpd BOOLEAN NOT NULL DEFAULT false,
  origem TEXT,
  status TEXT NOT NULL DEFAULT 'novo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT leads_porte_check CHECK (porte IS NULL OR porte IN ('PE','ME','GE'))
);

CREATE INDEX IF NOT EXISTS idx_leads_email_created ON public.leads(email, created_at DESC);

GRANT INSERT ON public.leads TO anon;
GRANT INSERT ON public.leads TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_public_insert_with_consent" ON public.leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (consentimento_lgpd = true);
CREATE POLICY "leads_super_admin_read" ON public.leads
  FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));
CREATE POLICY "leads_super_admin_manage" ON public.leads
  FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "leads_super_admin_delete" ON public.leads
  FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- throttle: max 3 envios por e-mail por hora
CREATE OR REPLACE FUNCTION public.leads_throttle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT count(*) INTO recent_count
  FROM public.leads
  WHERE lower(email) = lower(NEW.email)
    AND created_at > now() - interval '1 hour';

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Muitos envios recentes. Tente novamente mais tarde.';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.leads_throttle() FROM PUBLIC;

CREATE TRIGGER leads_throttle_before_insert BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.leads_throttle();

-- 7) FUNÇÕES DE GATING
CREATE OR REPLACE FUNCTION public.has_module(_slug TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_subscriptions ts
    JOIN public.modules m ON m.id = ts.module_id
    WHERE ts.tenant_id = public.get_user_company_id()
      AND m.slug = _slug
      AND ts.status IN ('active','trial')
      AND (ts.expires_at IS NULL OR ts.expires_at > now())
  );
$$;

CREATE OR REPLACE FUNCTION public.get_tenant_modules()
RETURNS TABLE(slug TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.slug
  FROM public.tenant_subscriptions ts
  JOIN public.modules m ON m.id = ts.module_id
  WHERE ts.tenant_id = public.get_user_company_id()
    AND ts.status IN ('active','trial')
    AND (ts.expires_at IS NULL OR ts.expires_at > now());
$$;

REVOKE EXECUTE ON FUNCTION public.has_module(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_tenant_modules() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_module(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_modules() TO authenticated;

-- 8) SEED DOS 9 MÓDULOS
INSERT INTO public.modules (slug, nome, nome_agente, categoria, is_legal_product, is_negotiable, descricao, icone, ordem)
VALUES
  ('core','Gestão Estratégica de Remuneração e Desempenho','Remu','remuneracao',false,false,'Cargos, níveis, faixas, curvas salariais e avaliação de desempenho.','Briefcase',1),
  ('insight','Insight de Mercado','Insight','remuneracao',false,false,'Benchmark de mercado, compa-ratio, defasagem e IA preditiva.','TrendingUp',2),
  ('match','Job Match','Match','remuneracao',false,false,'Descrição de cargos CBO, job matching e metodologias de pontos.','Target',3),
  ('nr1','Saúde Mental & Bem-Estar (NR-1)','Psi','saude',true,false,'Riscos psicossociais, COPSOQ-III, Portaria MTE 1.419/2024 e laudos.','Brain',4),
  ('clima','Clima Organizacional','Clima','cultura',false,false,'Pesquisa de clima, eNPS, engajamento e cultura.','Users',5),
  ('talent','Seleção & Recrutamento','Talent','talentos',false,false,'Vagas, candidatos, triagem e match de perfil.','UserSearch',6),
  ('evolve','Treinamento & PDI','Evolve','talentos',false,false,'Trilhas, PDI autogerados a partir de gaps e acompanhamento.','GraduationCap',7),
  ('potencial-sucessao','Avaliação de Potencial e Sucessão','Potencial','talentos',false,false,'Matriz 9-Box, key potential people e planos de sucessão.','Grid3x3',8),
  ('rh-service','RH Service','Consultores Seniores','servicos',false,true,'Consultoria de RH com consultores seniores — preço negociado por projeto.','Handshake',9)
ON CONFLICT (slug) DO UPDATE SET
  nome = EXCLUDED.nome,
  nome_agente = EXCLUDED.nome_agente,
  categoria = EXCLUDED.categoria,
  is_legal_product = EXCLUDED.is_legal_product,
  is_negotiable = EXCLUDED.is_negotiable,
  descricao = EXCLUDED.descricao,
  icone = EXCLUDED.icone,
  ordem = EXCLUDED.ordem,
  updated_at = now();

-- 9) SEED DAS FAIXAS DE PREÇO (NULL = a configurar; rh-service sem faixas)
INSERT INTO public.module_pricing (module_id, faixa_min_colaboradores, faixa_max_colaboradores, preco_mensal)
SELECT m.id, f.min_c, f.max_c, NULL::numeric
FROM public.modules m
CROSS JOIN (VALUES (0,50),(51,200),(201,500),(501,1000),(1001,NULL)) AS f(min_c, max_c)
WHERE m.is_negotiable = false
ON CONFLICT (module_id, faixa_min_colaboradores) DO NOTHING;

-- core: herda a base atual
UPDATE public.module_pricing mp SET preco_mensal = 299.00, updated_at = now()
FROM public.modules m WHERE m.id = mp.module_id AND m.slug = 'core' AND mp.faixa_min_colaboradores = 0;
UPDATE public.module_pricing mp SET preco_mensal = 899.00, updated_at = now()
FROM public.modules m WHERE m.id = mp.module_id AND m.slug = 'core' AND mp.faixa_min_colaboradores = 51;
UPDATE public.module_pricing mp SET preco_mensal = 1900.00, updated_at = now()
FROM public.modules m WHERE m.id = mp.module_id AND m.slug = 'core' AND mp.faixa_min_colaboradores = 201;

-- nr1: faixa Essencial travada
UPDATE public.module_pricing mp SET preco_mensal = 225.00, updated_at = now()
FROM public.modules m WHERE m.id = mp.module_id AND m.slug = 'nr1' AND mp.faixa_min_colaboradores = 0;

-- 10) BACKFILL: flags atuais de add-on -> contratações modulares
INSERT INTO public.tenant_subscriptions (tenant_id, module_id, status)
SELECT os.id, m.id, 'active'
FROM public.organizational_structure os
JOIN public.modules m ON m.slug = 'nr1'
WHERE os.nr1_addon_enabled = true AND os.parent_id IS NULL
ON CONFLICT (tenant_id, module_id) DO NOTHING;

INSERT INTO public.tenant_subscriptions (tenant_id, module_id, status)
SELECT os.id, m.id, 'active'
FROM public.organizational_structure os
JOIN public.modules m ON m.slug = 'clima'
WHERE os.clima_addon_enabled = true AND os.parent_id IS NULL
ON CONFLICT (tenant_id, module_id) DO NOTHING;

INSERT INTO public.tenant_subscriptions (tenant_id, module_id, status)
SELECT os.id, m.id, 'active'
FROM public.organizational_structure os
JOIN public.modules m ON m.slug = 'nr1'
WHERE (os.fib_addon_enabled = true OR os.psicossociais_addon_enabled = true OR os.checkup_addon_enabled = true)
  AND os.parent_id IS NULL
ON CONFLICT (tenant_id, module_id) DO NOTHING;