
## Sincronizar Nota de Avaliacao Aprovada com Cadastro do Colaborador + Renomear Terminologia

### Objetivo
Quando uma avaliacao de desempenho for aprovada, a nota final (final_score) deve ser automaticamente gravada no campo `performance_rating` do perfil do colaborador. Alem disso, toda a terminologia "Funcionario" sera substituida por "Colaborador" no dialogo de cadastro.

---

### 1. Atualizar automaticamente a nota no perfil ao aprovar avaliacao

**Arquivo: `src/hooks/usePerformanceEvaluations.ts`**

Na mutacao `approveEvaluation`, apos atualizar o status da avaliacao para "approved", buscar o `employee_id` e o `final_score` da avaliacao e gravar o `final_score` no campo `performance_rating` da tabela `profiles` do colaborador avaliado.

A escala de avaliacao e 0-5, e o campo `performance_rating` aceita 0-10. O valor sera gravado diretamente (escala 0-5), mantendo consistencia com o que o sistema ja exibe.

Fluxo:
1. Atualizar status da avaliacao para "approved"
2. Com os dados retornados (employee_id, final_score), fazer um update no profiles
3. `profiles.performance_rating = evaluation.final_score`

---

### 2. Renomear "Funcionario" para "Colaborador"

**Arquivo: `src/components/UserDialog.tsx`**

Substituir todas as ocorrencias de "Funcionario" e "funcionario" por "Colaborador" e "colaborador" respectivamente nos textos da interface:

- Titulo do dialogo: "Editar Colaborador" / "Novo Colaborador"
- Descricao: "Atualize as informacoes do colaborador e suas permissoes"
- Toasts de sucesso/erro
- Placeholders e textos auxiliares
- Aproximadamente 15+ ocorrencias no arquivo

---

### Secao Tecnica

| Arquivo | Alteracao |
|---|---|
| `src/hooks/usePerformanceEvaluations.ts` | Na mutacao `approveEvaluation`, apos aprovar, gravar `final_score` no `profiles.performance_rating` do `employee_id` |
| `src/components/UserDialog.tsx` | Substituir todas as ocorrencias de "Funcionario/funcionario" por "Colaborador/colaborador" |
