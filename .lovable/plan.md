# Módulo Seleção & R&S (agente Talent) — Fase 1: Vagas e Perfil Inteligente

## O que o RH vai ter
- Nova página **Vagas** (`/selecao/vagas`), bloqueada para empresas sem o módulo Seleção & Recrutamento contratado. O card "Seleção & Recrutamento" do painel passa a abrir essa página (hoje abre o próprio painel).
- **Lista de vagas** da empresa: filtros por status, área e senioridade; cada card mostra título, badges pílula (status, senioridade, modelo), nº de candidatos (0 nesta fase), etapa e dias em aberto.
- **Criar / editar vaga**: título, área, senioridade (júnior/pleno/sênior/especialista), CBO, modelo de trabalho (remoto/híbrido/presencial), localização, contratação (CLT/PJ/estágio), faixa salarial mín/máx, quantidade de vagas, status (rascunho/publicada/pausada/fechada).
- **Buscar na biblioteca de cargos**: campo com sugestões por nome ou CBO, usando os cargos já cadastrados no Plano de Cargos. Ao escolher, preenche responsabilidades, requisitos e competências.
- **"Gerar perfil da vaga com IA"**: o agente Talent monta responsabilidades, requisitos obrigatórios e desejáveis e competências a partir de título + área + senioridade (e o texto parcial, se houver). Tudo fica editável; nada é salvo sem o RH clicar em Salvar.
- Portal público, candidatos e ranking ficam para as próximas fases.

## Detalhes técnicos
- **Tabela `vagas`** (migração): colunas do pedido, com `root_company_id` como tenant (padrão do projeto, no lugar de `tenant_id`), `descricao_cargo_id` → `job_titles(id)` (a biblioteca de descrições existente), `requisitos_obrigatorios`/`requisitos_desejaveis`, `competencias text[]`; enums validados por CHECK fixo; trigger de `updated_at`; GRANT para authenticated/service_role; RLS: leitura/escrita só da própria empresa (`get_user_company_id()`) e apenas se `has_module('talent')` + papel admin/hr_manager (super_admin via regra atual).
- O slug do módulo no catálogo é **`talent`** (não `selecao`); será usado ele para não criar um segundo slug.
- **Edge function `agent-talent`**: valida JWT e acesso ao módulo, valida entrada com Zod, envia ao modelo apenas título/área/senioridade/CBO/texto parcial (sem dado pessoal — LGPD), usa Lovable AI (`openai/gpt-6-astra`, Responses API em streaming, saída estruturada) e retorna o perfil em JSON. Trata 402/429 com mensagem clara na tela.
- Front: `src/pages/selecao/Vagas.tsx`, `src/components/selecao/VagaDialog.tsx`, `VagaCard.tsx`, `CargoLibrarySearch.tsx` (reaproveita padrão do `CBOSearchInput`), hook `useVagas.ts` filtrando por `activeCompanyId`. Rota envolta em `ModuleGate moduleSlug="talent"`; ajuste só do `path` no `ModuleGrid`.
- Visual com os tokens atuais do app (cards 16-20px, badges pílula), responsivo; nenhuma outra página muda.
- Registrar em `roadmap.md` e `AGENTS.md`; rodar lint, typecheck, test, dead-code e build; testar no navegador (desktop e celular) incluindo uma geração real de perfil.
