
## Diagnóstico (o que ocorreu)
- As **avaliações de teste foram criadas** e estão sendo retornadas pelo backend (vi na requisição `GET /performance_evaluations ...` com status 200 e vários registros).
- Porém, na resposta, os relacionamentos `employee` e `evaluator` estão vindo como **null** (ex.: `"employee": null`).
- No front, a tela `/performance/evaluations` faz um filtro assim:

  - `matchesSearch` hoje é calculado como:
    - `(evaluation.employee?.full_name?.includes(searchTerm) ?? false)`
  - Quando `employee` vem `null`, isso vira **false**.
  - Mesmo quando `searchTerm` está vazio, esse `matchesSearch` continua **false** (porque `?? false`).
  - Resultado: `filteredEvaluations` fica **vazio**, e a UI mostra “Nenhuma avaliação...”.

Em resumo: **os dados existem**, mas o filtro atual elimina tudo quando `employee` não vem populado.

## Objetivo
1) Fazer as avaliações aparecerem mesmo quando `employee`/`evaluator` estiverem null.  
2) Manter a busca funcionando corretamente.  
3) Confirmar o scroll só depois que a lista estiver visível (porque hoje nem chega a renderizar a tabela).

## Mudanças planejadas (frontend)
### 1) Corrigir a regra de filtro de busca (principal)
Arquivo: `src/pages/performance/PerformanceEvaluations.tsx`

- Ajustar `matchesSearch` para:
  - Se `searchTerm` estiver vazio → `matchesSearch = true` (não filtra).
  - Se `searchTerm` tiver texto → tenta buscar por `employee.full_name` (se existir); se não existir, não faz match.

Exemplo de regra (conceito):
- `const matchesSearch = !searchTerm ? true : (employeeName.includes(searchTerm))`

Isso sozinho já fará as avaliações aparecerem.

### 2) Melhorar fallback de exibição quando employee/evaluator estiver null
Arquivo: `src/pages/performance/PerformanceEvaluations.tsx`

- Onde hoje aparece `"Colaborador"`, trocar para algo mais informativo:
  - “Colaborador (sem acesso ao nome)” ou “Colaborador não carregado”
- Mostrar também `employee_id` de forma discreta (ex.: em texto menor) apenas se o nome não estiver disponível, para facilitar auditoria interna.

### 3) Tornar a busca mais resiliente (opcional, mas recomendado)
Arquivo: `src/pages/performance/PerformanceEvaluations.tsx`

- Permitir buscar também por:
  - `employee_id` (quando o nome estiver indisponível)
  - nome do ciclo (`cycle?.name`) se você quiser (ajuda a encontrar rapidamente)

### 4) Verificar por que `employee` está vindo null (causa raiz provável)
Isso é secundário para “mostrar a lista”, mas é o que impede aparecer “colaboradores”/nomes.

Hipóteses mais prováveis:
- Política de acesso (RLS) na tabela `profiles` está impedindo o usuário atual de ler o perfil daqueles colaboradores.
- Ou as avaliações foram criadas com `employee_id` apontando para perfis que o usuário não tem permissão de visualizar.

Plano de checagem (sem alterar nada ainda):
- Conferir a página de “Colaboradores” do módulo (que usa `usePerformanceEmployees`) para ver se ela também está vazia.
- Se “Colaboradores” estiver vazia para um usuário que deveria ver pessoas, aí sim o problema é permissão/política, e a correção será no backend (políticas e/ou view segura de colaboradores).

Se confirmar que é permissão:
- Ajustar as políticas de leitura de `profiles`/view `v_performance_employees` (se existir) para garantir:
  - Colaborador vê a si mesmo
  - Gestor vê subordinados
  - RH/Admin vê a empresa
- Importante: não abrir dados sensíveis; apenas os campos necessários (full_name, avatar_url, job_title, grade).

## Sequência de implementação
1) Ajustar o filtro de busca em `PerformanceEvaluations.tsx` para não eliminar registros quando `searchTerm` está vazio.
2) Ajustar os fallbacks de UI (mostrar texto amigável e opcionalmente `employee_id`).
3) Testar a tela `/performance/evaluations`:
   - Sem busca → deve listar as 8 avaliações
   - Com busca por nome → deve filtrar quando houver nome disponível
   - Com busca por `employee_id` (se implementarmos) → deve filtrar mesmo sem nome
4) Se os nomes continuarem null:
   - Validar tela “Colaboradores”
   - Se necessário, partir para correção de permissões no backend para liberar leitura mínima dos perfis dentro da empresa.

## Critérios de aceite (o que você deve ver)
- Ao abrir `/performance/evaluations`, a lista aparece com as 8 avaliações de teste.
- O scroll passa a funcionar (porque a tabela realmente renderiza).
- A busca não “some” com tudo quando o campo de busca está vazio.
- Mesmo se não carregar o nome do colaborador, a linha aparece com um fallback claro.

## Arquivos envolvidos
- `src/pages/performance/PerformanceEvaluations.tsx` (mudança principal)
- (Possível etapa 2, se confirmado) políticas/view relacionadas a leitura de colaboradores/perfis.
