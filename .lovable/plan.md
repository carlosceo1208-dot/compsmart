
## Objetivo
Fazer com que a tela **Avaliações** mostre o **nome dos colaboradores** (e do avaliador) corretamente, sem abrir acesso indevido a dados sensíveis. Hoje o nome aparece como “Colaborador não carregado” porque o front tenta buscar `profiles` diretamente via relacionamento, mas a tabela `profiles` está corretamente restrita (PII) e o relacionamento volta `null`.

## O que está acontecendo (causa raiz)
- A lista de avaliações está vindo do backend (os 8 registros existem).
- O embed/relacionamento no `usePerformanceEvaluations()` usa:
  - `employee:profiles!...(full_name, ...)`
  - `evaluator:profiles!...(full_name, ...)`
- Porém, por política de segurança, usuários que não são Admin/RH **não conseguem ler a tabela `profiles`** (para evitar exposição de PII). Resultado: o PostgREST retorna `employee: null` e `evaluator: null`.
- Já existe a estrutura correta para isso no banco:
  - `profiles_directory` (tabela “diretório”, sem PII, com RLS por empresa)
  - `profiles_compensation_directory` (view para cenários de remuneração/gestores)

Conclusão: a UI está correta em exibir fallback, mas precisamos mudar a fonte dos nomes para o **diretório seguro**, e não para `profiles`.

## Estratégia de correção (segura)
Criar uma **view segura** para “Avaliações + Nomes”, que:
- Lê avaliações de `performance_evaluations`
- Faz JOIN com `profiles_directory` para obter `full_name`, `avatar_url`, `job_title`, `grade` (sem email/telefone/CPF)
- Faz JOIN com `performance_cycles` e `performance_templates` (como já faz hoje)
- Usa `WITH (security_invoker=on)` para respeitar isolamento por RLS das tabelas subjacentes

Depois, no front:
- Para listagem/consulta: buscar dados na view (com nomes já resolvidos)
- Para criar/editar/aprovar/excluir: continuar usando `performance_evaluations` (tabela original), sem mudanças no fluxo de escrita

## Mudanças no backend (Lovable Cloud / banco de dados)
1) Criar view `v_performance_evaluations_directory` (nome sugerido)
- Campos sugeridos (exemplos):
  - Todos os campos de `performance_evaluations` (ou os necessários)
  - `employee_full_name`, `employee_avatar_url`, `employee_job_title`, `employee_grade`
  - `evaluator_full_name`, `evaluator_avatar_url`
  - `cycle_name`, `cycle_fiscal_year`
  - `template_name`, `template_type`

2) Garantir que a view não inclua PII (email, phone, cpf, birth_date etc.)
- Somente os campos “de diretório” já presentes em `profiles_directory`

3) Verificar se a RLS atual permite:
- Ler `profiles_directory` para membros da mesma empresa (`root_company_id = get_user_company_id()`)
- Ler `performance_evaluations` conforme regras já existentes

## Mudanças no frontend (código)
### A) Hook de listagem: `src/hooks/usePerformanceEvaluations.ts`
1) Alterar **apenas a query de listagem** (useQuery) para:
- `from("v_performance_evaluations_directory")`
- Selecionar campos já “flattened” (employee_full_name etc.)

2) Manter mutations (create/update/submit/approve/delete) apontando para a tabela original `performance_evaluations`

3) Atualizar os tipos locais:
- Criar um type/interface local para o retorno da view (ex.: `PerformanceEvaluationDirectoryRow`)
- Ajustar `get9BoxData()` para usar `employee_full_name` (quando existir) e manter fallback

### B) Página: `src/pages/performance/PerformanceEvaluations.tsx`
1) Substituir o uso de `evaluation.employee?.full_name` por:
- `evaluation.employee_full_name` (vindo da view)
2) Substituir avaliador por:
- `evaluation.evaluator_full_name`
3) Manter o fallback com ID (como está), mas ele deve passar a ser raro (apenas se o diretório não tiver o registro, o que indicaria problema de sincronização)

### C) (Opcional, mas recomendado) Log/Indicador de integridade
Adicionar uma mensagem discreta quando `employee_full_name` vier vazio, indicando:
- “Dados do diretório não sincronizados” (ajuda a diagnosticar se o trigger de sync falhar)

## Validação (passo a passo)
1) Recarregar `/performance/evaluations`
2) Confirmar que as 8 avaliações aparecem com:
- Nome do colaborador preenchido
- Nome do avaliador preenchido (no seu teste é autoavaliação, então deve ser o mesmo nome)
3) Testar busca:
- Buscar por nome (deve filtrar)
- Buscar por ID (ainda pode funcionar se mantivermos a lógica atual)
4) Confirmar que scroll funciona agora com lista maior (se necessário, podemos gerar mais 20-50 avaliações de teste depois)

## Riscos e como evitamos
- Risco: “Liberar acesso ao `profiles`” seria perigoso (PII).
  - Mitigação: não mexer em `profiles` e usar apenas `profiles_directory`.
- Risco: view não aparecer no client types imediatamente.
  - Mitigação: no front, tipar o retorno localmente (TS interface) sem depender do autogen para a view.

## Entregáveis
- 1 migration criando `v_performance_evaluations_directory` (security_invoker=on) com JOIN no `profiles_directory`
- Atualização do hook `usePerformanceEvaluations` para ler da view na listagem
- Ajustes da página `PerformanceEvaluations` para exibir campos da view

## Observação sobre a imagem enviada
A tela já está listando linhas (o filtro foi corrigido), mas os nomes não aparecem porque o relacionamento com `profiles` está bloqueado por segurança. A correção acima resolve exatamente isso, sem abrir dados sensíveis.

