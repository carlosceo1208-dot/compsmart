
## Auditoria de Isolamento Multi-Tenant -- Modulo de Avaliacao de Desempenho

### Resultado Geral
Todas as 18 tabelas de desempenho possuem RLS habilitado e politicas ativas. A grande maioria utiliza corretamente a funcao `get_user_company_id()` para isolamento multi-tenant. Porem, foram identificados **2 pontos de correcao** e **1 ponto de atencao**.

---

### Tabelas com Isolamento Correto (sem acao necessaria)
As seguintes tabelas ja utilizam `get_user_company_id()` em todas as politicas:

| Tabela | Isolamento |
|--------|-----------|
| performance_evaluations | root_company_id = get_user_company_id() |
| performance_cycles | root_company_id = get_user_company_id() |
| performance_goals | root_company_id = get_user_company_id() |
| performance_pdi | root_company_id = get_user_company_id() |
| performance_one_on_ones | root_company_id = get_user_company_id() |
| performance_kudos | root_company_id = get_user_company_id() |
| performance_alerts | root_company_id = get_user_company_id() |
| performance_merit_rules | root_company_id = get_user_company_id() |
| performance_merit_recommendations | via evaluation join com get_user_company_id() |
| performance_competency_scores | via evaluation join com get_user_company_id() |
| performance_variable_link | via evaluation join com get_user_company_id() |
| performance_succession | root_company_id = get_user_company_id() |
| performance_templates | root_company_id = get_user_company_id() OR is_global |
| external_feedback_requests | root_company_id = get_user_company_id() |
| external_feedback_responses | via request join com get_user_company_id() |
| user_feedback | isolado por user_id (dados pessoais) |

---

### Correcao 1: `evaluation_potential_dimensions` -- Padrao inconsistente

**Problema:** A politica SELECT usa subquery em `profiles.root_company_id` ao inves de `get_user_company_id()`. Isso nao respeita a troca de empresa pelo super_admin e utiliza um padrao diferente do resto do sistema.

**Politica atual:**
```sql
root_company_id IN (SELECT profiles.root_company_id FROM profiles WHERE profiles.id = auth.uid())
```

**Correcao:** Substituir por:
```sql
root_company_id = get_user_company_id()
```

Mesma correcao para a politica ALL de Admin/HR que tambem usa o padrao antigo.

---

### Correcao 2: `performance_glossary_terms` -- Sem isolamento por empresa

**Problema:** Esta tabela nao possui coluna `root_company_id`. Qualquer admin de qualquer empresa pode inserir/editar/deletar termos do glossario, e todos os termos ativos sao visiveis globalmente.

**Opcoes:**
- **Opcao A (recomendada):** Adicionar coluna `root_company_id` e isolar termos por empresa, mantendo termos globais (root_company_id IS NULL) visiveis a todos.
- **Opcao B:** Manter como glossario global da plataforma, mas restringir gestao apenas ao super_admin.

---

### Ponto de Atencao: Roles `{public}` vs `{authenticated}`

Varias politicas usam role `{public}` ao inves de `{authenticated}`. Embora o RLS ainda exija `auth.uid()` nas condicoes (o que impede acesso anonimo na pratica), o padrao correto seria usar `{authenticated}` para garantir defesa em profundidade. Tabelas afetadas: evaluation_potential_dimensions, performance_competency_scores, performance_goals, performance_kudos, performance_pdi, entre outras.

---

### Secao Tecnica -- Acoes

1. **Migration SQL** para `evaluation_potential_dimensions`:
   - DROP das 3 politicas existentes
   - Recriar SELECT com `root_company_id = get_user_company_id()`
   - Recriar ALL (Admin/HR) com `root_company_id = get_user_company_id()`
   - Recriar ALL (Managers) mantendo join com evaluations + adicionando `root_company_id = get_user_company_id()`
   - Alterar roles de `{public}` para `{authenticated}`

2. **Migration SQL** para `performance_glossary_terms` (Opcao A):
   - Adicionar coluna `root_company_id UUID REFERENCES organizational_structure(id)`
   - DROP das 2 politicas existentes
   - Recriar SELECT: `(root_company_id = get_user_company_id() OR root_company_id IS NULL) AND is_active = true`
   - Recriar ALL (Admin): `root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin', 'hr_manager'])`
   - Super admin pode gerenciar termos globais via `is_super_admin()`

3. **Migration SQL** para padronizar roles em todas as demais tabelas de `{public}` para `{authenticated}` (defesa em profundidade).
