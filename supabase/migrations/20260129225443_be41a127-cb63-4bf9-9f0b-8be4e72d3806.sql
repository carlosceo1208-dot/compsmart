-- Insert default global performance templates
-- These templates serve as starting points for companies

INSERT INTO performance_templates (
  id,
  root_company_id,
  name,
  description,
  template_type,
  indicators,
  is_global,
  is_active,
  created_by
) VALUES 
-- Template Operacional
(
  gen_random_uuid(),
  (SELECT id FROM organizational_structure WHERE parent_id IS NULL LIMIT 1),
  'Modelo Operacional',
  'Template padrão para avaliação de colaboradores em funções operacionais, focando em produtividade, qualidade e segurança.',
  'operational',
  '[
    {"id": "prod_001", "name": "Produtividade", "description": "Capacidade de atingir metas de produção dentro dos prazos estabelecidos", "weight": 25},
    {"id": "qual_001", "name": "Qualidade do Trabalho", "description": "Precisão e conformidade com padrões de qualidade", "weight": 25},
    {"id": "seg_001", "name": "Segurança no Trabalho", "description": "Cumprimento das normas de segurança e prevenção de acidentes", "weight": 20},
    {"id": "pres_001", "name": "Assiduidade e Pontualidade", "description": "Frequência e cumprimento de horários", "weight": 15},
    {"id": "colab_001", "name": "Trabalho em Equipe", "description": "Cooperação com colegas e contribuição para o ambiente de trabalho", "weight": 15}
  ]'::jsonb,
  true,
  true,
  NULL
),
-- Template Administrativo
(
  gen_random_uuid(),
  (SELECT id FROM organizational_structure WHERE parent_id IS NULL LIMIT 1),
  'Modelo Administrativo',
  'Template para avaliação de colaboradores em funções administrativas, focando em organização, comunicação e processos.',
  'administrative',
  '[
    {"id": "org_001", "name": "Organização e Planejamento", "description": "Capacidade de organizar tarefas e planejar atividades de forma eficiente", "weight": 20},
    {"id": "com_001", "name": "Comunicação", "description": "Clareza na comunicação escrita e verbal", "weight": 20},
    {"id": "proc_001", "name": "Gestão de Processos", "description": "Cumprimento e melhoria de processos administrativos", "weight": 20},
    {"id": "prob_001", "name": "Resolução de Problemas", "description": "Capacidade de identificar e resolver problemas de forma proativa", "weight": 20},
    {"id": "tec_001", "name": "Conhecimento Técnico", "description": "Domínio das ferramentas e sistemas utilizados", "weight": 20}
  ]'::jsonb,
  true,
  true,
  NULL
),
-- Template Técnico
(
  gen_random_uuid(),
  (SELECT id FROM organizational_structure WHERE parent_id IS NULL LIMIT 1),
  'Modelo Técnico',
  'Template para avaliação de profissionais técnicos, focando em expertise, inovação e documentação.',
  'technical',
  '[
    {"id": "exp_001", "name": "Expertise Técnica", "description": "Profundidade de conhecimento técnico na área de atuação", "weight": 30},
    {"id": "ino_001", "name": "Inovação e Melhoria Contínua", "description": "Proposição de melhorias e soluções inovadoras", "weight": 20},
    {"id": "doc_001", "name": "Documentação", "description": "Qualidade e atualização da documentação técnica", "weight": 15},
    {"id": "ment_001", "name": "Mentoria Técnica", "description": "Capacidade de transferir conhecimento para a equipe", "weight": 15},
    {"id": "ent_001", "name": "Entrega de Projetos", "description": "Cumprimento de prazos e qualidade nas entregas", "weight": 20}
  ]'::jsonb,
  true,
  true,
  NULL
),
-- Template Vendas
(
  gen_random_uuid(),
  (SELECT id FROM organizational_structure WHERE parent_id IS NULL LIMIT 1),
  'Modelo Vendas',
  'Template para avaliação de profissionais de vendas, focando em resultados, relacionamento e conhecimento de produto.',
  'sales',
  '[
    {"id": "met_001", "name": "Atingimento de Metas", "description": "Cumprimento das metas de vendas estabelecidas", "weight": 30},
    {"id": "rel_001", "name": "Relacionamento com Clientes", "description": "Qualidade do atendimento e fidelização de clientes", "weight": 25},
    {"id": "neg_001", "name": "Habilidade de Negociação", "description": "Capacidade de negociar e fechar acordos vantajosos", "weight": 20},
    {"id": "prod_002", "name": "Conhecimento de Produto", "description": "Domínio das características e benefícios dos produtos/serviços", "weight": 15},
    {"id": "pipe_001", "name": "Gestão de Pipeline", "description": "Organização e acompanhamento do funil de vendas", "weight": 10}
  ]'::jsonb,
  true,
  true,
  NULL
),
-- Template Liderança
(
  gen_random_uuid(),
  (SELECT id FROM organizational_structure WHERE parent_id IS NULL LIMIT 1),
  'Modelo Liderança',
  'Template para avaliação de gestores e líderes, focando em gestão de pessoas, resultados e desenvolvimento.',
  'leadership',
  '[
    {"id": "ges_001", "name": "Gestão de Pessoas", "description": "Capacidade de liderar, motivar e desenvolver a equipe", "weight": 25},
    {"id": "res_001", "name": "Entrega de Resultados", "description": "Atingimento de metas e objetivos da área", "weight": 25},
    {"id": "dev_001", "name": "Desenvolvimento da Equipe", "description": "Investimento no crescimento e capacitação dos liderados", "weight": 20},
    {"id": "estr_001", "name": "Visão Estratégica", "description": "Alinhamento com a estratégia da empresa e tomada de decisão", "weight": 15},
    {"id": "feed_001", "name": "Feedback e Comunicação", "description": "Qualidade e frequência do feedback à equipe", "weight": 15}
  ]'::jsonb,
  true,
  true,
  NULL
),
-- Template Padrão/Geral
(
  gen_random_uuid(),
  (SELECT id FROM organizational_structure WHERE parent_id IS NULL LIMIT 1),
  'Modelo Padrão',
  'Template genérico aplicável a qualquer função, com indicadores equilibrados de desempenho.',
  'standard',
  '[
    {"id": "ent_002", "name": "Entrega de Resultados", "description": "Cumprimento de metas e qualidade das entregas", "weight": 25},
    {"id": "comp_001", "name": "Competências Técnicas", "description": "Domínio das habilidades necessárias para a função", "weight": 20},
    {"id": "colab_002", "name": "Colaboração", "description": "Trabalho em equipe e contribuição para objetivos coletivos", "weight": 20},
    {"id": "ini_001", "name": "Iniciativa e Proatividade", "description": "Capacidade de agir de forma autônoma e antecipar necessidades", "weight": 20},
    {"id": "adap_001", "name": "Adaptabilidade", "description": "Flexibilidade para lidar com mudanças e novos desafios", "weight": 15}
  ]'::jsonb,
  true,
  true,
  NULL
)
ON CONFLICT DO NOTHING;