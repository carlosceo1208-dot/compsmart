-- Criar extensão para busca por similaridade de texto
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Criar tabela de códigos CBO
CREATE TABLE cbo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(7) NOT NULL UNIQUE,
  title text NOT NULL,
  synonyms text[] DEFAULT '{}',
  family text,
  created_at timestamptz DEFAULT now()
);

-- Índices para busca rápida
CREATE INDEX idx_cbo_code ON cbo_codes(code);
CREATE INDEX idx_cbo_title_trgm ON cbo_codes USING gin(title gin_trgm_ops);

-- RLS: todos podem visualizar
ALTER TABLE cbo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view CBO codes" ON cbo_codes FOR SELECT USING (true);

-- Inserir códigos CBO mais comuns (amostra representativa)
INSERT INTO cbo_codes (code, title, family) VALUES
-- Diretores e Gerentes
('1210-05', 'Diretor geral', 'Diretores gerais'),
('1210-10', 'Diretor administrativo', 'Diretores gerais'),
('1210-15', 'Diretor financeiro', 'Diretores gerais'),
('1210-20', 'Diretor comercial', 'Diretores gerais'),
('1211-05', 'Diretor de recursos humanos', 'Diretores de áreas de apoio'),
('1212-05', 'Diretor de marketing', 'Diretores de áreas de apoio'),
('1212-10', 'Diretor de vendas', 'Diretores de áreas de apoio'),
('1213-05', 'Diretor de tecnologia', 'Diretores de áreas de apoio'),
('1421-05', 'Gerente administrativo', 'Gerentes administrativos, financeiros'),
('1421-10', 'Gerente financeiro', 'Gerentes administrativos, financeiros'),
('1422-05', 'Gerente de recursos humanos', 'Gerentes de recursos humanos'),
('1423-05', 'Gerente comercial', 'Gerentes de vendas e marketing'),
('1423-10', 'Gerente de vendas', 'Gerentes de vendas e marketing'),
('1423-15', 'Gerente de marketing', 'Gerentes de vendas e marketing'),
('1425-05', 'Gerente de operações', 'Gerentes de operações'),
('1425-10', 'Gerente de logística', 'Gerentes de operações'),
('1425-15', 'Gerente de produção', 'Gerentes de operações'),
('1425-20', 'Gerente de suprimentos', 'Gerentes de operações'),
('1426-05', 'Gerente de tecnologia da informação', 'Gerentes de TI'),

-- Profissionais das ciências e das artes
('2011-05', 'Biólogo', 'Biólogos e afins'),
('2012-05', 'Biomédico', 'Biólogos e afins'),
('2021-05', 'Engenheiro agrônomo', 'Engenheiros agrônomos'),
('2111-05', 'Físico', 'Físicos'),
('2122-05', 'Engenheiro civil', 'Engenheiros civis'),
('2122-10', 'Engenheiro de infraestrutura', 'Engenheiros civis'),
('2123-05', 'Engenheiro eletricista', 'Engenheiros eletricistas'),
('2124-05', 'Engenheiro eletrônico', 'Engenheiros eletrônicos'),
('2134-05', 'Engenheiro mecânico', 'Engenheiros mecânicos'),
('2142-05', 'Engenheiro químico', 'Engenheiros químicos'),
('2143-05', 'Engenheiro de produção', 'Engenheiros de produção'),
('2144-05', 'Engenheiro de segurança do trabalho', 'Engenheiros de segurança'),

-- Administração
('2521-05', 'Administrador', 'Administradores'),
('2521-10', 'Administrador de empresas', 'Administradores'),
('2521-15', 'Administrador público', 'Administradores'),
('2522-05', 'Contador', 'Contadores e auditores'),
('2522-10', 'Auditor', 'Contadores e auditores'),
('2523-05', 'Secretário executivo', 'Secretários executivos'),
('2524-05', 'Analista de recursos humanos', 'Profissionais de recursos humanos'),
('2524-10', 'Analista de cargos e salários', 'Profissionais de recursos humanos'),
('2524-15', 'Analista de treinamento', 'Profissionais de recursos humanos'),
('2524-20', 'Analista de recrutamento e seleção', 'Profissionais de recursos humanos'),
('2525-05', 'Analista financeiro', 'Profissionais de administração econômico-financeira'),
('2525-10', 'Analista de investimentos', 'Profissionais de administração econômico-financeira'),
('2525-15', 'Analista de crédito', 'Profissionais de administração econômico-financeira'),
('2531-05', 'Advogado', 'Advogados'),
('2531-10', 'Advogado trabalhista', 'Advogados'),
('2531-15', 'Advogado tributarista', 'Advogados'),
('2531-20', 'Advogado empresarial', 'Advogados'),

-- TI e Tecnologia
('2124-10', 'Engenheiro de sistemas', 'Engenheiros de sistemas'),
('2124-15', 'Analista de sistemas', 'Analistas de sistemas'),
('2124-20', 'Programador de sistemas', 'Analistas de sistemas'),
('2124-25', 'Desenvolvedor de software', 'Analistas de sistemas'),
('2124-30', 'Arquiteto de software', 'Analistas de sistemas'),
('2124-35', 'Analista de suporte', 'Analistas de sistemas'),
('2123-10', 'Engenheiro de dados', 'Engenheiros de dados'),
('2123-15', 'Cientista de dados', 'Cientistas de dados'),
('2123-20', 'Analista de business intelligence', 'Analistas de BI'),
('1425-25', 'Coordenador de TI', 'Coordenadores de TI'),
('3171-05', 'Técnico de informática', 'Técnicos de informática'),
('3171-10', 'Técnico de suporte', 'Técnicos de informática'),
('3172-05', 'Técnico de redes', 'Técnicos de redes'),

-- Vendas e Marketing
('2531-25', 'Analista de marketing', 'Profissionais de marketing'),
('2531-30', 'Analista de comunicação', 'Profissionais de marketing'),
('3541-05', 'Vendedor', 'Vendedores'),
('3541-10', 'Representante comercial', 'Vendedores'),
('3541-15', 'Consultor de vendas', 'Vendedores'),
('3541-20', 'Executivo de contas', 'Vendedores'),
('3541-25', 'Key account manager', 'Vendedores'),
('3542-05', 'Promotor de vendas', 'Promotores de vendas'),
('3543-05', 'Comprador', 'Compradores'),

-- Operações e Logística
('3421-05', 'Analista de logística', 'Profissionais de logística'),
('3421-10', 'Coordenador de logística', 'Profissionais de logística'),
('3421-15', 'Analista de supply chain', 'Profissionais de logística'),
('7841-05', 'Operador de empilhadeira', 'Operadores de empilhadeira'),
('7841-10', 'Conferente de carga', 'Operadores de empilhadeira'),
('4141-05', 'Almoxarife', 'Almoxarifes e armazenistas'),
('4141-10', 'Estoquista', 'Almoxarifes e armazenistas'),

-- Saúde
('2231-05', 'Médico', 'Médicos'),
('2231-10', 'Médico do trabalho', 'Médicos'),
('2232-05', 'Cirurgião dentista', 'Cirurgiões dentistas'),
('2234-05', 'Farmacêutico', 'Farmacêuticos'),
('2235-05', 'Enfermeiro', 'Enfermeiros'),
('2236-05', 'Fisioterapeuta', 'Fisioterapeutas'),
('2237-05', 'Nutricionista', 'Nutricionistas'),
('2238-05', 'Fonoaudiólogo', 'Fonoaudiólogos'),
('2239-05', 'Terapeuta ocupacional', 'Terapeutas ocupacionais'),
('2241-05', 'Psicólogo', 'Psicólogos'),
('2241-10', 'Psicólogo organizacional', 'Psicólogos'),
('3222-05', 'Técnico de enfermagem', 'Técnicos de enfermagem'),

-- Educação
('2311-05', 'Professor universitário', 'Professores do ensino superior'),
('2312-05', 'Professor de ensino médio', 'Professores do ensino médio'),
('2313-05', 'Professor de ensino fundamental', 'Professores do ensino fundamental'),
('2394-05', 'Pedagogo', 'Pedagogos'),

-- Finanças e Contabilidade
('4131-05', 'Assistente financeiro', 'Assistentes financeiros'),
('4131-10', 'Assistente de cobrança', 'Assistentes financeiros'),
('4131-15', 'Assistente de contas a pagar', 'Assistentes financeiros'),
('4131-20', 'Assistente de contas a receber', 'Assistentes financeiros'),
('4132-05', 'Assistente contábil', 'Assistentes contábeis'),
('4132-10', 'Auxiliar de contabilidade', 'Assistentes contábeis'),

-- Administrativo
('4110-05', 'Assistente administrativo', 'Assistentes administrativos'),
('4110-10', 'Auxiliar administrativo', 'Assistentes administrativos'),
('4110-15', 'Assistente de departamento pessoal', 'Assistentes administrativos'),
('4110-20', 'Recepcionista', 'Assistentes administrativos'),
('4110-25', 'Secretário', 'Assistentes administrativos'),
('4221-05', 'Operador de telemarketing', 'Operadores de telemarketing'),
('4222-05', 'Atendente', 'Atendentes'),

-- Segurança e Serviços Gerais
('5151-05', 'Agente de segurança', 'Vigilantes e porteiros'),
('5151-10', 'Vigilante', 'Vigilantes e porteiros'),
('5151-15', 'Porteiro', 'Vigilantes e porteiros'),
('5143-05', 'Auxiliar de serviços gerais', 'Trabalhadores de serviços gerais'),
('5143-10', 'Copeiro', 'Trabalhadores de serviços gerais'),
('5143-15', 'Zelador', 'Trabalhadores de serviços gerais'),

-- Engenharia e Manutenção
('3131-05', 'Técnico em eletrotécnica', 'Técnicos em eletrotécnica'),
('3131-10', 'Técnico em eletrônica', 'Técnicos em eletrotécnica'),
('3131-15', 'Técnico de manutenção elétrica', 'Técnicos em eletrotécnica'),
('9113-05', 'Eletricista', 'Eletricistas'),
('9113-10', 'Eletricista de manutenção', 'Eletricistas'),
('7241-05', 'Mecânico de manutenção', 'Mecânicos de manutenção'),
('7241-10', 'Mecânico industrial', 'Mecânicos de manutenção'),
('7244-05', 'Soldador', 'Soldadores'),

-- Produção e Qualidade
('3912-05', 'Analista de qualidade', 'Profissionais de qualidade'),
('3912-10', 'Coordenador de qualidade', 'Profissionais de qualidade'),
('3912-15', 'Inspetor de qualidade', 'Profissionais de qualidade'),
('3911-05', 'Técnico de planejamento', 'Técnicos de planejamento'),
('3911-10', 'Analista de PCP', 'Técnicos de planejamento'),
('7211-05', 'Operador de produção', 'Operadores de produção'),
('7211-10', 'Auxiliar de produção', 'Operadores de produção'),
('7212-05', 'Supervisor de produção', 'Supervisores de produção'),

-- Projetos e Consultoria
('2041-05', 'Gerente de projetos', 'Gerentes de projetos'),
('2041-10', 'Coordenador de projetos', 'Gerentes de projetos'),
('2041-15', 'Analista de projetos', 'Gerentes de projetos'),
('2042-05', 'Consultor empresarial', 'Consultores'),
('2042-10', 'Consultor de gestão', 'Consultores'),
('2042-15', 'Consultor de negócios', 'Consultores');

-- Criar comentário explicativo
COMMENT ON TABLE cbo_codes IS 'Classificação Brasileira de Ocupações - códigos oficiais do Ministério do Trabalho';