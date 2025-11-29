-- 1. Atualizar trigger handle_new_user para aceitar root_company_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, root_company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.email,
    (NEW.raw_user_meta_data->>'root_company_id')::uuid
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  RETURN NEW;
END;
$$;

-- 2. Criar tabela site_content para edição da landing page
CREATE TABLE IF NOT EXISTS public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  section_name text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- RLS: Todos podem visualizar conteúdo ativo
CREATE POLICY "Everyone can view active site content" ON public.site_content
  FOR SELECT USING (is_active = true);

-- RLS: Apenas admins podem gerenciar
CREATE POLICY "Admins can manage site content" ON public.site_content
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Inserir conteúdo inicial da landing page
INSERT INTO public.site_content (section_key, section_name, content) VALUES
('hero', 'Hero Section', '{
  "title": "Gestão Inteligente em Remuneração para decisões mais rápidas, justas e estratégicas.",
  "subtitle": "Estruture salários, Programas de Incentivos, Benefícios, PLR e todo o orçamento de pessoas com precisão e inteligência. Uma plataforma completa que leva empresas de qualquer porte — de startups a grandes corporações — a uma gestão de remuneração verdadeiramente estratégica e em total compliance com a legislação vigente.",
  "ctaPrimary": "Comece Gratuitamente",
  "ctaSecondary": "Ver Demonstração"
}'::jsonb),
('pain_points', 'Seção de Dores', '{
  "title": "Ainda improvisa na gestão de remuneração?",
  "description": "Empresas líderes exigem mais que planilhas. Com a CompSmart, você e a inteligência artificial orquestram no detalhe toda a gestão de Cargos, Salários, Benefícios, Programas de Incentivos e outros, garantindo a atração e retenção dos melhores talentos com total equidade. Transforme sua remuneração em uma vantagem estratégica decisiva para o seu negócio.",
  "items": [
    {"icon": "Calculator", "title": "Planilhas Desconectadas", "description": "Dados espalhados sem visão consolidada"},
    {"icon": "Clock", "title": "Processos Manuais", "description": "Horas perdidas em tarefas repetitivas"},
    {"icon": "AlertTriangle", "title": "Riscos de Compliance", "description": "Dificuldade em manter conformidade legal"},
    {"icon": "TrendingDown", "title": "Decisões Sem Dados", "description": "Falta de insights para decisões estratégicas"}
  ]
}'::jsonb),
('smart_agents', 'Agentes Inteligentes', '{
  "title": "Agentes Inteligentes COM Você",
  "subtitle": "Três especialistas de IA trabalhando ao seu lado para transformar decisões complexas em ações estratégicas.",
  "agents": [
    {"type": "legal", "title": "Assistente Jurídico Smart", "badge": "Compliance", "description": "Especialista em legislação trabalhista brasileira, gerando contratos, políticas e documentos em conformidade com a CLT."},
    {"type": "salary", "title": "Agente de Análise Salarial", "badge": "Análise", "description": "Analisa equidade interna, compara com mercado, calcula compa-ratio e identifica distorções salariais."},
    {"type": "benefits", "title": "Assistente de R&B", "badge": "Consultoria", "description": "Consultor especializado em programas de incentivos, benefícios e políticas de remuneração variável."}
  ]
}'::jsonb),
('pricing', 'Seção de Preços', '{
  "title": "Planos que crescem com sua empresa",
  "subtitle": "Escolha o plano ideal para o tamanho da sua equipe. Todos incluem acesso aos Agentes Inteligentes.",
  "annualDiscount": "Economize até 17% no plano anual"
}'::jsonb),
('testimonials', 'Depoimentos', '{
  "title": "O que nossos clientes dizem",
  "items": [
    {"name": "Marina Santos", "role": "Diretora de RH", "company": "TechCorp Brasil", "content": "A CompSmart revolucionou nossa gestão de remuneração. Os agentes de IA economizam horas de trabalho manual toda semana."},
    {"name": "Carlos Oliveira", "role": "CEO", "company": "Startup Inovadora", "content": "Finalmente uma plataforma que entende as necessidades de empresas em crescimento. A análise de equidade nos ajudou a reter talentos-chave."},
    {"name": "Ana Paula Silva", "role": "Gerente de Compensação", "company": "Grande Indústria", "content": "O compliance jurídico integrado nos dá tranquilidade. Reduzimos riscos trabalhistas significativamente."}
  ]
}'::jsonb),
('faq', 'Perguntas Frequentes', '{
  "title": "Perguntas Frequentes",
  "items": [
    {"question": "A CompSmart é adequada para empresas de qualquer porte?", "answer": "Sim! Nossa plataforma foi desenvolvida para atender desde startups até grandes corporações, com planos flexíveis que se adaptam ao tamanho da sua equipe."},
    {"question": "Os dados da minha empresa estão seguros?", "answer": "Absolutamente. Utilizamos criptografia de ponta a ponta e estamos em total conformidade com a LGPD. Seus dados nunca são compartilhados com terceiros."},
    {"question": "Quanto tempo leva para implementar?", "answer": "A implementação é rápida! Você pode começar a usar a plataforma em minutos. Nossa equipe de sucesso do cliente está disponível para ajudar na migração de dados."},
    {"question": "Posso cancelar a qualquer momento?", "answer": "Sim, você pode cancelar sua assinatura a qualquer momento sem multas ou taxas adicionais. Oferecemos também 14 dias de teste gratuito."}
  ]
}'::jsonb),
('cta_final', 'CTA Final', '{
  "title": "Pronto para transformar sua gestão de remuneração?",
  "subtitle": "Junte-se a centenas de empresas que já estão economizando tempo e tomando decisões mais inteligentes.",
  "ctaPrimary": "Começar Teste Gratuito",
  "ctaSecondary": "Falar com Especialista"
}'::jsonb),
('footer', 'Rodapé', '{
  "copyright": "© 2024 CompSmart. Todos os direitos reservados.",
  "description": "Gestão inteligente de remuneração para empresas de todos os portes.",
  "links": {
    "product": ["Recursos", "Preços", "Integrações", "API"],
    "company": ["Sobre", "Blog", "Carreiras", "Contato"],
    "legal": ["Termos de Uso", "Política de Privacidade", "LGPD"]
  }
}'::jsonb)
ON CONFLICT (section_key) DO NOTHING;