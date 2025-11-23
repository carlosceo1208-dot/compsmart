-- =====================================================
-- FASE 1: KNOWLEDGE BASE + CONVERSATIONS TABLES
-- =====================================================

-- 1.1 Tabela Knowledge Base (Base de Conhecimento Centralizada)
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identificação
  title TEXT NOT NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('legal', 'incentive', 'both')),
  category TEXT NOT NULL,
  subcategory TEXT,
  
  -- Conteúdo
  content TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  
  -- Metadados
  is_global BOOLEAN DEFAULT true,
  root_company_id UUID REFERENCES public.organizational_structure(id),
  source_document TEXT,
  
  -- Controle
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Índices para performance
CREATE INDEX idx_kb_agent_type ON public.knowledge_base(agent_type);
CREATE INDEX idx_kb_category ON public.knowledge_base(category);
CREATE INDEX idx_kb_active ON public.knowledge_base(is_active);
CREATE INDEX idx_kb_keywords ON public.knowledge_base USING GIN(keywords);
CREATE INDEX idx_kb_company ON public.knowledge_base(root_company_id);

-- RLS Policies
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Global content is viewable by all"
  ON public.knowledge_base FOR SELECT
  USING (is_global = true AND is_active = true);

CREATE POLICY "Company-specific content viewable by members"
  ON public.knowledge_base FOR SELECT
  USING (
    NOT is_global AND 
    is_active = true AND
    root_company_id IN (
      SELECT root_company_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins and HR can manage knowledge base"
  ON public.knowledge_base FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'hr_manager')
    )
  );

-- 1.2 Tabela Conversations - Agente R&B
CREATE TABLE IF NOT EXISTS public.incentive_assistant_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Conteúdo
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  
  -- Contexto
  document_text TEXT,
  document_name TEXT,
  context_data JSONB DEFAULT '{}'::jsonb,
  operation_mode TEXT DEFAULT 'consulta',
  
  -- Métricas
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER DEFAULT 0,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX idx_incentive_conv_user ON public.incentive_assistant_conversations(user_id);
CREATE INDEX idx_incentive_conv_created ON public.incentive_assistant_conversations(created_at DESC);
CREATE INDEX idx_incentive_conv_mode ON public.incentive_assistant_conversations(operation_mode);

-- RLS Policies
ALTER TABLE public.incentive_assistant_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON public.incentive_assistant_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON public.incentive_assistant_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations"
  ON public.incentive_assistant_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 1.3 Atualizar Tabela Legal Conversations
ALTER TABLE public.legal_assistant_conversations 
  ADD COLUMN IF NOT EXISTS document_text TEXT,
  ADD COLUMN IF NOT EXISTS document_name TEXT,
  ADD COLUMN IF NOT EXISTS operation_mode TEXT DEFAULT 'consulta';

CREATE INDEX IF NOT EXISTS idx_legal_conv_mode 
  ON public.legal_assistant_conversations(operation_mode);

-- 1.4 Seeds Iniciais da Knowledge Base
INSERT INTO public.knowledge_base (title, agent_type, category, subcategory, content, keywords, is_global) VALUES
-- Base Jurídica
(
  'CLT Resumida - Jornada e Descanso',
  'legal',
  'leis',
  'jornada_trabalho',
  E'# Jornada de Trabalho - CLT\n\n## Art. 58 - Duração Normal\nDuração normal: não superior a 8 horas diárias e 44 horas semanais.\n\n## Art. 59 - Horas Extras\n- Limite: 2 horas extras por dia\n- Adicional mínimo: 50%\n- Acordo individual ou coletivo\n\n## Art. 66 a 72 - Intervalos\n- Interjornada: 11 horas\n- Intrajornada: mínimo 1 hora (jornadas > 6h)\n\n## Art. 67 - Descanso Semanal\nDescanso semanal remunerado de 24 horas consecutivas, preferencialmente aos domingos.',
  ARRAY['jornada', 'horas extras', 'descanso', 'intervalo', 'CLT', 'art 58', 'art 59'],
  true
),
(
  'Férias - CLT Completo',
  'legal',
  'leis',
  'ferias',
  E'# Férias - CLT Art. 129 a 153\n\n## Aquisição (Art. 130)\nApós cada período de 12 meses (período aquisitivo).\n\n## Concessão (Art. 134)\n- Nos 12 meses subsequentes (período concessivo)\n- Comunicação com 30 dias de antecedência\n- Pagamento até 2 dias antes do início\n\n## Duração (Art. 130)\n- 30 dias corridos: sem faltas injustificadas\n- 24 dias: 6 a 14 faltas\n- 18 dias: 15 a 23 faltas\n- 12 dias: 24 a 32 faltas\n\n## Fracionamento (Art. 134, §1º)\n- 1 período mínimo: 14 dias\n- Demais períodos: não inferior a 5 dias\n- Permitido em até 3 períodos',
  ARRAY['férias', 'período aquisitivo', 'período concessivo', 'fracionamento', 'CLT', 'art 130', 'art 134'],
  true
),
-- Base Remuneração
(
  'Metodologia Hay - Fundamentos',
  'incentive',
  'metodologias',
  'avaliacao_cargos',
  E'# Metodologia Hay de Avaliação de Cargos\n\n## Princípios\nMétodo de pontos fatoriais que avalia:\n\n### 1. Know-How (Conhecimento)\n- Conhecimentos técnicos\n- Habilidades de gestão\n- Habilidades de relacionamento humano\n\n### 2. Problem Solving (Solução de Problemas)\n- Ambiente de pensamento\n- Desafio de pensamento\n\n### 3. Accountability (Responsabilidade)\n- Liberdade para agir\n- Impacto dos resultados\n- Magnitude do cargo\n\n## Fórmula de Pontuação\nPontuação Total = Know-How + Problem Solving + Accountability\n\n## Aplicação\nUsada para criar estrutura salarial baseada em complexidade e responsabilidade dos cargos.',
  ARRAY['Hay', 'metodologia', 'avaliação de cargos', 'pontuação', 'know-how', 'accountability', 'estrutura salarial'],
  true
),
(
  'PLR - Lei 10.101/2000 Resumida',
  'incentive',
  'leis',
  'plr',
  E'# Participação nos Lucros e Resultados - Lei 10.101/2000\n\n## Características Principais\n\n### Natureza Jurídica\n- NÃO tem natureza salarial\n- Não sofre incidência de encargos trabalhistas\n- Não integra salário para nenhum efeito\n\n### Requisitos Legais\n1. Negociação com sindicato ou comissão de empregados\n2. Regras claras e objetivas\n3. Periodicidade máxima: semestral\n4. Metas e indicadores mensuráveis\n\n### Critérios Permitidos\n- Índices de produtividade\n- Qualidade\n- Lucratividade\n- Critérios objetivos e mensuráveis\n\n### Pagamento\n- Máximo: 2 vezes por ano\n- Intervalo mínimo: trimestre civil\n\n### Tributação\n- Isento de contribuição previdenciária\n- Sujeito a Imposto de Renda (tabela progressiva)',
  ARRAY['PLR', 'participação lucros', 'lei 10101', 'remuneração variável', 'bônus', 'sem natureza salarial'],
  true
),
-- Glossário Compartilhado
(
  'Glossário CompSmart - Termos Essenciais',
  'both',
  'glossario',
  'termos_comuns',
  E'# Glossário CompSmart\n\n## Termos de Remuneração\n\n**Midpoint**: Ponto médio de uma faixa salarial, representa o valor de mercado.\n\n**Amplitude**: Diferença percentual entre mínimo e máximo de uma faixa salarial.\n\n**Compa-Ratio**: Relação entre salário real e midpoint (Salário / Midpoint × 100).\n\n**Grade / Nível**: Posição na estrutura salarial (ex: A, B, C ou 1, 2, 3).\n\n**Job Family**: Família de cargos com natureza de trabalho similar.\n\n## Termos Jurídicos\n\n**CLT**: Consolidação das Leis do Trabalho (Decreto-Lei 5.452/1943).\n\n**INSS**: Instituto Nacional do Seguro Social.\n\n**FGTS**: Fundo de Garantia do Tempo de Serviço (8% do salário).\n\n**CCT**: Convenção Coletiva de Trabalho.\n\n**ACT**: Acordo Coletivo de Trabalho.\n\n**FAP**: Fator Acidentário de Prevenção.\n\n**RAT**: Risco Ambiental do Trabalho (antiga SAT).\n\n## Termos de Incentivos\n\n**ICP**: Incentivo de Curto Prazo (bônus anual, PLR).\n\n**ILP**: Incentivo de Longo Prazo (stock options, ações).\n\n**LTI**: Long-Term Incentive (incentivo de longo prazo).',
  ARRAY['glossário', 'midpoint', 'amplitude', 'CLT', 'INSS', 'PLR', 'ICP', 'ILP', 'compa-ratio', 'faixa salarial'],
  true
);