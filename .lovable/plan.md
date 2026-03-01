
## Corrigir Cards de Planos na Landing Page

### Problema Identificado
A tabela `subscription_plans` tem RLS (Row Level Security) ativado, mas a unica politica de leitura (`subscription_plans_authenticated_read`) exige que o usuario esteja autenticado (`authenticated` role). Visitantes da landing page usam o role `anon`, por isso a query retorna array vazio e os 4 cards de planos somem.

### Evidencia
- A requisicao `GET /subscription_plans?is_active=eq.true&is_public=eq.true` retorna `[]` (array vazio)
- A politica atual: `SELECT` com `roles: {authenticated}` e condicao `is_active = true AND is_public = true`
- Os 4 planos existem no banco (Starter R$299, Medium R$899, Pro R$1900, Enterprise sob consulta)

### Solucao
Adicionar uma politica RLS que permita leitura publica (`anon`) para planos ativos e publicos.

### Alteracao tecnica

**Migracao SQL:**
```sql
CREATE POLICY "subscription_plans_public_read"
ON public.subscription_plans
FOR SELECT
TO anon
USING (is_active = true AND is_public = true);
```

Isso permite que visitantes nao autenticados vejam os planos marcados como `is_active = true` e `is_public = true`, que e exatamente o comportamento esperado na landing page. Nenhuma alteracao de codigo frontend e necessaria -- o componente `PricingSection.tsx` ja esta correto.

| Item | Detalhe |
|------|---------|
| Tabela | `subscription_plans` |
| Nova politica | `subscription_plans_public_read` |
| Role | `anon` |
| Operacao | `SELECT` apenas |
| Condicao | `is_active = true AND is_public = true` |
| Arquivos alterados | Nenhum (apenas migracao SQL) |
