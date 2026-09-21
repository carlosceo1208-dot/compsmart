# Acesso condicional do consultor ao módulo Core

O consultor CompSmart passa a acessar o Core (importação de colaboradores e leitura de dados) apenas quando existe um projeto de RH Service em andamento na empresa cliente. Fora dessa condição, o Core continua bloqueado para ele.

## Situação atual (verificada)

- O consultor já é aceito na importação de colaboradores sem nenhuma condição: a regra de permissão da importação libera admin, RH **e consultor** apenas por pertencer à empresa.
- As tabelas do Core (colaboradores, cargos, faixas salariais, avaliações) não mencionam consultor — ele hoje não lê esses dados.
- Registro de auditoria: a tabela de auditoria bloqueia inserções diretas; qualquer novo registro precisa passar por uma função interna.

## O que muda

### 1. Regra de liberação condicional

Nova função de verificação que devolve "liberado" somente quando todas as condições valem ao mesmo tempo:

1. o usuário logado é consultor;
2. a empresa tem assinatura ativa do RH Service;
3. existe projeto de RH Service com status "em andamento" nessa empresa, vinculado a um consultor;
4. o módulo pedido está na lista permitida para consultoria — hoje apenas o Core.

Assim que o projeto sai de "em andamento" (concluído ou cancelado), a liberação cai sozinha, sem nenhuma ação manual: a verificação é feita a cada consulta.

### 2. Permissões de dados do Core

- Importação de colaboradores: o consultor deixa de ter acesso livre e passa a depender da nova regra.
- Leitura: o consultor ganha leitura de colaboradores, cargos, faixas salariais e avaliações da empresa, condicionada à mesma regra.
- Edição de dados sensíveis (cargos, salários, faixas, avaliações) continua restrita a admin e RH do cliente. O consultor só grava colaboradores pelo fluxo de importação.

### 3. Tela

- O botão "Atualizar Colaboradores" e a navegação do Core aparecem para o consultor somente quando a regra devolve "liberado".
- Sem projeto ativo, ele continua vendo o Core com cadeado e a mensagem de acesso restrito já usada hoje.

### 4. Auditoria

Cada importação e cada abertura do Core feita por consultor gera um registro de auditoria com usuário, empresa, data e ação, visível na tela de Logs de Auditoria já existente.

## Detalhes técnicos

- Migração:
  - `has_consultor_modulo_access(_tenant_id uuid, _module_slug text)` — SQL STABLE SECURITY DEFINER, `search_path = public`, `GRANT EXECUTE` só para `authenticated`. Condições: `has_role(auth.uid(),'consultor')`, `EXISTS` em `tenant_subscriptions` join `modules` com `slug='rh-service'` e `status='active'` (e `expires_at` nulo ou futuro), `EXISTS` em `rh_service_projetos` com `tenant_id=_tenant_id`, `status='em_andamento'` e `consultor_id IS NOT NULL`, e `_module_slug = ANY(ARRAY['core'])`.
  - `employee_import_can_manage(_tenant_id)`: troca `has_role(...,'consultor')` por `has_consultor_modulo_access(_tenant_id,'core')`, preservando super_admin/admin/hr_manager.
  - Políticas de leitura com `OR has_consultor_modulo_access(<tenant>, 'core')`: `profiles` (nova policy SELECT usando `root_company_id`), `job_titles` (SELECT), `salary_ranges` (SELECT via `salary_tables.root_company_id`), `performance_evaluations` (SELECT). Nenhuma policy de INSERT/UPDATE/DELETE é ampliada.
  - `log_consultor_core_access(_action text, _tenant_id uuid, _details jsonb)` — SECURITY DEFINER, insere em `audit_logs` (`user_id=auth.uid()`, `action`, `table_name='core_access'`, `new_data`, `root_company_id=_tenant_id`) apenas quando `has_consultor_modulo_access` é verdadeiro; `GRANT EXECUTE` para `authenticated`. Contorna o bloqueio de inserção direta sem afrouxar a policy.
  - `import_employees_batch` passa a chamar esse log quando o autor é consultor.
- Frontend:
  - `src/hooks/useRhService.ts`: novo hook local `useConsultorCoreAccess()` que consulta a nova função por RPC para a empresa ativa; permanece restrito ao escopo RH Service/Core, sem alterar `useCurrentUserRole` nem `useFeatureAccess`.
  - `src/hooks/useEmployeeImport.ts`: `useEmployeeImportAccess` deixa de liberar consultor direto e passa a exigir esse hook.
  - `src/pages/Employees.tsx`: botão "Atualizar Colaboradores" e navegação do Core respeitam a mesma condição; sem acesso, mantém cadeado/CTA atual.
  - Ao abrir o Core como consultor liberado, dispara `log_consultor_core_access` uma vez por sessão de acesso.
- Sem mudanças em landing, checkout, pagamentos, folha, nem nas Etapas 3, 3.5 e 4.
