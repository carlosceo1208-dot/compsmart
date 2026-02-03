# Plano: Página de Colaboradores no Módulo Performance ✅ IMPLEMENTADO

## Status: CONCLUÍDO

A página de Colaboradores foi implementada com visibilidade segmentada por papel.

---

## O que foi implementado:

### 1. Banco de Dados
- ✅ Função `get_visible_employees(p_user_id, p_company_id)` - SECURITY DEFINER
- ✅ View `v_performance_employees` com security_invoker=on
- ✅ Isolamento multi-tenant via root_company_id

### 2. Regras de Visibilidade
| Papel | O que vê |
|-------|----------|
| employee | Apenas próprio perfil |
| manager | Subordinados diretos (via manager_id) + próprio |
| hr_manager | Todos da empresa |
| admin | Todos da empresa |

### 3. Frontend
- ✅ Hook `usePerformanceEmployees.ts` com lógica de visibilidade
- ✅ Hook `usePerformanceEmployeesKPIs` para métricas agregadas
- ✅ Componente `EmployeeCard.tsx` - Card com indicadores
- ✅ Componente `EmployeeKPIBar.tsx` - Barra de KPIs
- ✅ Componente `EmployeeFilters.tsx` - Filtros por unidade/status
- ✅ Componente `EmployeeDrawer.tsx` - Drawer com 6 tabs (Resumo, Metas, Avaliações, PDI, 1:1s, 360)
- ✅ Página `PerformanceEmployees.tsx`

### 4. Navegação
- ✅ Rota `/performance/employees` adicionada
- ✅ Item "Colaboradores" no PerformanceNav (após Dashboard)

---

## Arquivos Criados/Modificados

```text
src/
  hooks/
    usePerformanceEmployees.ts          # NOVO
  
  components/
    performance/
      employees/
        EmployeeCard.tsx                 # NOVO
        EmployeeKPIBar.tsx               # NOVO  
        EmployeeFilters.tsx              # NOVO
        EmployeeDrawer.tsx               # NOVO
      PerformanceNav.tsx                 # MODIFICADO

  pages/
    performance/
      PerformanceEmployees.tsx           # NOVO

App.tsx                                  # MODIFICADO (rota adicionada)

supabase/
  migrations/
    *_get_visible_employees.sql          # NOVO
    *_v_performance_employees.sql        # NOVO
```

---

## Segurança Implementada

1. **RLS no banco**: Função `get_visible_employees` com SECURITY DEFINER
2. **View segura**: `v_performance_employees` com security_invoker=on
3. **Filtro no frontend**: Hook aplica regras baseadas em roles
4. **Isolamento multi-tenant**: Sempre filtra por root_company_id
5. **Sem PII para gestores**: View não expõe CPF, telefone, email pessoal
