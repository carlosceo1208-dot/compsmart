-- Tabela para armazenar conversas de suporte
CREATE TABLE IF NOT EXISTS public.support_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_context TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  helpful BOOLEAN,
  feedback_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para ações rápidas contextuais
CREATE TABLE IF NOT EXISTS public.support_quick_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  question_text TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_support_conversations_user_id ON public.support_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_created_at ON public.support_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_quick_actions_page_path ON public.support_quick_actions(page_path);
CREATE INDEX IF NOT EXISTS idx_support_quick_actions_priority ON public.support_quick_actions(priority DESC);

-- RLS Policies
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_quick_actions ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias conversas
CREATE POLICY "Users can view own support conversations"
  ON public.support_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem inserir suas próprias conversas
CREATE POLICY "Users can insert own support conversations"
  ON public.support_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias conversas (feedback)
CREATE POLICY "Users can update own support conversations"
  ON public.support_conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Todos podem ver quick actions ativas
CREATE POLICY "Everyone can view active quick actions"
  ON public.support_quick_actions
  FOR SELECT
  USING (is_active = true);

-- Admins podem gerenciar quick actions
CREATE POLICY "Admins can manage quick actions"
  ON public.support_quick_actions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_support_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_support_conversations_updated_at
  BEFORE UPDATE ON public.support_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_support_conversations_updated_at();

-- Popular quick actions iniciais
INSERT INTO public.support_quick_actions (page_path, question_text, priority) VALUES
  -- Globais (todas as páginas)
  ('*', 'Como funciona o CompSmart?', 100),
  ('*', 'Preciso de ajuda com login ou senha', 90),
  ('*', 'Como posso exportar dados?', 80),
  
  -- Dashboard
  ('/dashboard', 'Como interpretar os indicadores econômicos?', 100),
  ('/dashboard', 'O que significa INPC e como ele é calculado?', 90),
  ('/dashboard', 'Como alterar a moeda de visualização?', 80),
  
  -- Colaboradores
  ('/employees', 'Como cadastrar um novo colaborador?', 100),
  ('/employees', 'Como importar colaboradores em lote?', 90),
  ('/employees', 'Como adicionar foto ao perfil do colaborador?', 80),
  ('/employees', 'Como calcular o percentual de faixa salarial?', 70),
  
  -- Tabelas Salariais
  ('/salary-ranges', 'Como criar uma tabela salarial?', 100),
  ('/salary-ranges', 'Como funcionam as faixas salariais?', 90),
  ('/salary-ranges', 'O que são Grades e Níveis?', 80),
  
  -- Cargos
  ('/job-titles', 'Como criar um cargo?', 100),
  ('/job-titles', 'Como vincular cargo a faixa salarial?', 90),
  ('/job-titles', 'O que é CBO e como usar?', 80),
  
  -- Benefícios
  ('/benefits', 'Como cadastrar um benefício?', 100),
  ('/benefits', 'Como definir elegibilidade por Grade?', 90),
  ('/benefits', 'Como atribuir benefícios aos colaboradores?', 80),
  
  -- Orçamento
  ('/budget', 'Como funciona o planejamento de orçamento?', 100),
  ('/budget', 'Como simular mudanças salariais?', 90),
  
  -- Organograma
  ('/organogram', 'Como visualizar a estrutura organizacional?', 100),
  ('/organogram', 'Como adicionar unidades organizacionais?', 90),
  
  -- Estrutura Organizacional
  ('/organization', 'Como criar áreas, departamentos e setores?', 100),
  ('/organization', 'Qual a hierarquia correta das unidades?', 90)
ON CONFLICT DO NOTHING;