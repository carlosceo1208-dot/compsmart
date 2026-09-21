# Módulo RH Service (Consultores Seniores) — somente backend

Objetivo: criar no banco a estrutura do RH Service (consultoria sênior negociada por projeto) e o diagnóstico de maturidade de RH que recomenda módulos da plataforma. Nada de frontend, landing, checkout ou dashboards nesta etapa. Nada do que já funciona é reconstruído: papéis/permissões, agentes de IA, funções do NR-1, pagamentos, alertas, e-mails, indicadores e as tabelas de compra modular (`modules`, `module_pricing`, `bundles`, `tenant_subscriptions`, `leads`) permanecem intactos. O módulo `rh-service` já está no catálogo como negociável e não será recriado.

## Novo papel: Consultor

Será criado o papel `consultor` na lista de papéis do sistema. Ele é usado apenas pela equipe CompSmart e libera somente as tabelas do RH Service — não dá acesso a salários, desempenho, NR-1 ou qualquer outro dado do cliente.

## O que será criado

**Consultores vinculados ao cliente**
Nome, e-mail, especialidade (remuneração, NR-1, clima, cargos, etc.), mini biografia e situação (ativo/inativo), sempre ligados à empresa atendida.

**Projetos de consultoria**
Título, descrição, escopo, consultor responsável, situação (proposta / em andamento / concluído), horas estimadas, valor negociado (pode ficar em branco enquanto a negociação não fecha), data de início e de fim. Sem cobrança automática — a negociação é conduzida por consultor/vendas.

**Registro de horas**
Horas lançadas pelo consultor por projeto, com descrição e data. Serve para o cliente acompanhar o consumo do pacote contratado.

**Questionário de maturidade de RH (versionado no banco)**
Um conjunto de perguntas por prática de RH, agrupado em versões, para poder ajustar perguntas depois sem mexer no aplicativo. Práticas cobertas: estrutura de cargos, remuneração, desempenho, clima, NR-1, seleção, T&D e sucessão. Cada prática já vem associada ao módulo correspondente da plataforma.

**Diagnósticos de maturidade**
Um diagnóstico por empresa/projeto, com as respostas, o score de cada prática (0–100) e o nível resultante: inicial (0–29), em desenvolvimento (30–59), estruturado (60–84), avançado (85–100). O diagnóstico guarda também o resumo geral e a situação (rascunho / concluído).

**Módulos recomendados**
Para cada prática com score abaixo de 60, o sistema sugere automaticamente o módulo correspondente. O consultor revisa: pode remover, acrescentar módulos ou reescrever a justificativa. Cada recomendação guarda sua origem — automática, editada ou manual — para auditoria e calibragem futura do limiar.

## Quem vê o quê

- Equipe CompSmart (super admin e consultor): cria e edita consultores, projetos, horas e diagnósticos.
- Admin/RH da empresa cliente: apenas visualiza consultores vinculados, projetos, horas consumidas e o diagnóstico final (score + módulos recomendados + justificativa).
- Colaboradores e gestores de linha: nenhum acesso ao módulo, por confidencialidade da consultoria.
- Tudo isolado por empresa: ninguém vê dados de outro cliente.
- O questionário (perguntas e pesos) é catálogo interno: leitura para equipe CompSmart, escrita só para super admin.

## Detalhes técnicos

- Novo valor `consultor` em `public.app_role` (`ALTER TYPE ... ADD VALUE IF NOT EXISTS`), em migração separada da que o usa, para evitar erro de enum não comitado.
- Tabelas novas em `public`, todas com `tenant_id UUID NOT NULL REFERENCES organizational_structure(id) ON DELETE CASCADE`, `created_at`/`updated_at` e trigger `public.update_updated_at_column()`:
  `consultores`, `rh_service_projetos`, `rh_service_horas`, `rh_service_maturidade_versoes`, `rh_service_maturidade_questoes`, `rh_service_diagnosticos`, `rh_service_diagnostico_scores`, `rh_service_recomendacoes`.
  `rh_service_maturidade_versoes`/`_questoes` são globais (sem `tenant_id`).
- Cada `CREATE TABLE` seguido de `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated` e `GRANT ALL ... TO service_role`; nada para `anon`. Depois `ENABLE ROW LEVEL SECURITY` e as policies.
- Policies por tabela do RH Service:
  - leitura: `public.is_super_admin(auth.uid()) OR (tenant_id = public.get_user_company_id() AND (public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_manager')))`;
  - escrita (insert/update/delete): apenas `is_super_admin(...)` ou `has_role(auth.uid(),'consultor')` com `tenant_id = get_user_company_id()`.
- `rh_service_diagnosticos`: `modulo_avaliado` slug opcional, `diagnostico JSONB`, `recomendacoes JSONB` mantidos para compatibilidade com o pedido; os scores por prática ficam normalizados em `rh_service_diagnostico_scores` (`pratica`, `module_slug`, `score NUMERIC CHECK 0..100`, `nivel TEXT`).
- `rh_service_recomendacoes`: `diagnostico_id`, `module_slug REFERENCES modules(slug)`, `justificativa`, `origem TEXT CHECK (origem IN ('auto','editada','manual'))`, `UNIQUE (diagnostico_id, module_slug)`.
- Funções `SECURITY DEFINER` com `search_path = public`, `REVOKE EXECUTE ... FROM PUBLIC` e `GRANT EXECUTE ... TO authenticated` (nunca `anon`), no mesmo padrão de `has_module`:
  - `rh_service_calcular_nivel(numeric)` → texto do nível;
  - `rh_service_gerar_recomendacoes(_diagnostico_id uuid, _limiar numeric DEFAULT 60)` → insere recomendações `origem='auto'` para práticas abaixo do limiar, com `ON CONFLICT DO NOTHING` para não sobrescrever edição do consultor.
- Trigger em `rh_service_diagnostico_scores` preenchendo `nivel` a partir do score; trigger em `rh_service_recomendacoes` marcando `origem='editada'` quando uma linha `auto` é alterada.
- Validações dependentes de data (ex.: `data_fim >= data_inicio`) via trigger, não `CHECK`.
- Índices por `tenant_id`, por `projeto_id` e por `diagnostico_id`.
- Seed idempotente da versão 1 do questionário e das 8 práticas com seus slugs de módulo (`core`, `core`, `core`, `clima`, `nr1`, `talent`, `evolve`, `potencial-sucessao`), usando `ON CONFLICT DO NOTHING`.
- Gating segue o padrão existente: `has_module('rh-service')` e `get_tenant_modules()` — nenhuma alteração nessas funções.

## Fora do escopo

Frontend, landing page, checkout, agendamento de reuniões e dashboards. Nenhuma mudança em pagamentos, RBAC existente, edge functions ou nas tabelas da compra modular.
