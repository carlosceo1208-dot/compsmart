# Módulo Recrutamento & Seleção (Aquisição de talentos) — agente Talent — Fase 1: Vagas e Perfil Inteligente

## O que o RH vai ter
- O card do painel passa a se chamar **"Recrutamento & Seleção (Aquisição de talentos)"** (antes "Seleção & Recrutamento") e abre a nova página **Vagas** (`/recrutamento/vagas`), bloqueada para empresas sem o módulo contratado. O mesmo nome vale no título da página e no nome do módulo exibido nos avisos de bloqueio.
- **Lista de vagas** da empresa: filtros por status, área e senioridade; cada card mostra título, badges pílula (status, senioridade, modelo), nº de candidatos (0 nesta fase), etapa e dias em aberto.
- **Criar / editar vaga**: título, área, senioridade (júnior/pleno/sênior/especialista), CBO, modelo de trabalho (remoto/híbrido/presencial), localização, contratação (CLT/PJ/estágio), faixa salarial mín/máx, quantidade de vagas, status (rascunho/publicada/pausada/fechada).
- **Buscar cargo (nome ou CBO)** em toda a biblioteca, não só no Plano de Cargos da empresa:
  - cargos já descritos pela empresa (preenchem responsabilidades, requisitos e competências);
  - **catálogo CBO completo** (qualquer ocupação oficial, mesmo fora do plano da empresa) — preenche título e CBO, e oferece "Completar perfil com IA".
- **"Gerar perfil da vaga com IA"**: o agente Talent monta responsabilidades, requisitos obrigatórios e desejáveis e competências. Tudo editável; nada é salvo sem clicar em Salvar.
  - Durante a geração: botão em carregamento e campos bloqueados.
  - Créditos de IA esgotados ou excesso de pedidos: mensagem clara explicando o motivo.
  - Falha do modelo: mensagem de erro com botão **"Tentar novamente"**.
- **Reaproveitar o cargo (opcional)**: quando a vaga veio do catálogo CBO (cargo fora do plano da empresa), ao salvar aparece a opção "Cadastrar também este cargo na biblioteca da empresa". Se marcada, o sistema pede só o que falta ao Plano de Cargos (família e nível) e salva o cargo com o perfil gerado, deixando-o pronto para as próximas vagas. Desmarcada, só a vaga é salva.
  - **Sem duplicidade**: antes de cadastrar, o sistema confere se a empresa já tem um cargo com o mesmo CBO ou o mesmo nome (sem diferenciar maiúsculas/acentos). Se tiver, não cria outro: avisa "Este cargo já existe na biblioteca" e liga a vaga ao cargo existente. A mesma checagem é feita no servidor, para valer mesmo com dois cliques rápidos.
- Portal público, candidatos e ranking ficam para as próximas fases.

## Detalhes técnicos
- **Tabela `vagas`** (migração): colunas do pedido, tenant em `root_company_id` (padrão do projeto), `descricao_cargo_id` → `job_titles(id)` opcional, `cbo`, `requisitos_obrigatorios`/`requisitos_desejaveis`, `competencias text[]`; valores fixos validados; trigger de `updated_at`; GRANT authenticated/service_role; RLS: só a própria empresa (`get_user_company_id()`), com `has_module('talent')` e papel admin/hr_manager.
- Slug do módulo continua **`talent`** (já existe no catálogo); atualiza-se apenas o nome exibido (`modules.nome` + fallback em `useModuleAccess`) e o `ModuleGrid`.
- **Busca**: consulta paralela em `job_titles` (empresa ativa) e `cbo_codes` (catálogo global, mesmo usado por `CBOSearchInput`), resultados agrupados por origem.
- **Edge function `agent-talent`**, alinhada aos agentes existentes (ex.: `generate-job-description`): mesmo Lovable AI Gateway, validação de JWT e do módulo no servidor, Zod na entrada. Envia ao modelo **somente** título, área, senioridade, CBO e texto parcial da vaga — nenhum campo de pessoa existe nesta fase; um filtro remove e-mail/CPF/telefone de textos livres antes do envio. Modelo padrão `openai/gpt-6-astra` em streaming com saída estruturada. Repassa 402/429 com mensagem segura para a tela.
- Front: `src/pages/recrutamento/Vagas.tsx`, `src/components/recrutamento/VagaDialog.tsx`, `VagaCard.tsx`, `CargoLibrarySearch.tsx`, hook `useVagas.ts` filtrando por `activeCompanyId`; rota em `ModuleGate moduleSlug="talent"`.
- Visual com os tokens atuais do app; responsivo; nenhuma outra página muda.
- Registrar em `roadmap.md` e `AGENTS.md`; rodar lint, typecheck, test, dead-code e build; testar no navegador (desktop e celular), incluindo geração real de perfil e o estado de erro.
