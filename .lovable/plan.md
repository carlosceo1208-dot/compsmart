
# Plano: Implementar Pagina de Colaboradores no Modulo de Performance com Visibilidade Segmentada

## Problema Identificado

O modulo de Avaliacao de Desempenho nao possui uma pagina centralizada de "Colaboradores" que permita ao gestor visualizar e acessar rapidamente informacoes de desempenho da sua equipe. Alem disso, a visibilidade dos dados precisa seguir regras estritas:

- **Colaborador comum**: Acessa APENAS seus proprios dados
- **Gestor**: Acessa dados dos seus subordinados diretos (via `manager_id`)
- **RH/Admin**: Acessa todos os colaboradores da empresa
- **Isolamento multi-tenant**: Dados de diferentes empresas NUNCA se misturam

---

## Solucao Proposta

### Arquitetura de Visibilidade

```text
+------------------+     +------------------+     +------------------+
|   COLABORADOR    |     |     GESTOR       |     |    RH/ADMIN      |
|                  |     |                  |     |                  |
|  Ve apenas       |     |  Ve subordinados |     |  Ve todos da     |
|  proprio perfil  |     |  diretos         |     |  empresa         |
+------------------+     +------------------+     +------------------+
        |                        |                        |
        v                        v                        v
+--------------------------------------------------------------+
|                    FILTROS POR HIERARQUIA                    |
|  Area > Departamento > Setor > Projeto                       |
+--------------------------------------------------------------+
                                |
                                v
                  +------------------------+
                  | ROOT_COMPANY_ID FILTER |
                  | (Isolamento Multi-tenant)|
                  +------------------------+
```

---

## Fase 1: Novo Hook - usePerformanceEmployees

Criar hook centralizado que aplica regras de visibilidade automaticamente:

| Role | Regra de Visibilidade |
|------|----------------------|
| employee | `.eq("id", auth.uid())` - Apenas proprio perfil |
| manager | `.eq("manager_id", auth.uid())` - Subordinados diretos |
| hr_manager | `.eq("root_company_id", activeCompanyId)` - Todos da empresa |
| admin | `.eq("root_company_id", activeCompanyId)` - Todos da empresa |

### Recursos do Hook:

- Busca de colaboradores com filtros por unidade organizacional
- Dados agregados de desempenho (avaliacao atual, metas, PDIs)
- Paginacao e busca por nome
- Indicadores visuais (foto, cargo, grade, status de avaliacao)

---

## Fase 2: Nova Pagina - PerformanceEmployees.tsx

### 2.1 Layout da Pagina

Pagina com visao de cards/lista de colaboradores:

- **Header**: Titulo + Botao de filtros + Busca
- **KPIs**: Total de colaboradores, % com avaliacao concluida, % com PDI ativo
- **Cards de Colaboradores**: Foto, nome, cargo, grade, indicadores de performance
- **Filtros**: Area, Departamento, Setor, Status de avaliacao

### 2.2 Card do Colaborador

Cada card exibe:
- Avatar + Nome + Cargo
- Grade
- Status da avaliacao atual (badge colorido)
- Icones de acesso rapido: Metas, 1:1, PDI, Avaliacao
- Indicador de feedbacks externos pendentes

### 2.3 Acoes por Card

- Clicar no card abre drawer lateral com detalhes
- Botoes de acao: Ver Metas, Agendar 1:1, Ver PDI, Iniciar Avaliacao

---

## Fase 3: Drawer de Detalhes do Colaborador

Quando gestor clica em um colaborador, abre drawer lateral com:

### Tabs:
1. **Resumo**: Dados cadastrais + ultimas avaliacoes + 9Box
2. **Metas**: Metas individuais do colaborador + progresso
3. **Avaliacoes**: Historico de avaliacoes + notas
4. **PDI**: Planos de desenvolvimento ativos
5. **1:1s**: Historico de reunioes 1:1
6. **Feedbacks 360**: Externos recebidos

---

## Fase 4: Atualizacao da Navegacao

Adicionar item "Colaboradores" no PerformanceNav:

```javascript
{ path: "/performance/employees", label: "Colaboradores", icon: Users }
```

**Posicao**: Logo apos "Dashboard", antes de "Ciclos"

---

## Fase 5: RLS e Seguranca (Banco de Dados)

### 5.1 Nova Funcao: get_visible_employees()

Funcao SQL que retorna IDs de colaboradores visiveis para o usuario atual:

```sql
CREATE FUNCTION get_visible_employees(p_user_id UUID, p_company_id UUID)
RETURNS TABLE(employee_id UUID)
AS $$
BEGIN
  -- Se Admin ou HR, retorna todos da empresa
  IF has_any_role(p_user_id, ARRAY['admin', 'hr_manager']) THEN
    RETURN QUERY
    SELECT id FROM profiles WHERE root_company_id = p_company_id;
  
  -- Se Manager, retorna subordinados diretos + proprio
  ELSIF has_role(p_user_id, 'manager') THEN
    RETURN QUERY
    SELECT id FROM profiles 
    WHERE (manager_id = p_user_id OR id = p_user_id)
    AND root_company_id = p_company_id;
  
  -- Senao, apenas proprio perfil
  ELSE
    RETURN QUERY
    SELECT id FROM profiles WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.2 View: v_performance_employees

View segura que expoe apenas dados permitidos:

- Dados cadastrais basicos (sem PII sensivel para gestores)
- Ultima nota de avaliacao
- Contagem de metas/PDIs
- Status de feedbacks pendentes

---

## Fase 6: Filtros Hierarquicos

### Componente: PerformanceEmployeeFilters

Filtros em cascata baseados na estrutura organizacional:

1. **Matriz/Filial** (nivel 1)
2. **Area** (nivel 2)
3. **Departamento** (nivel 3)
4. **Setor** (nivel 4)
5. **Projeto** (nivel 5 - opcional)

Os filtros respeitam a visibilidade do usuario:
- Gestor ve apenas unidades dos seus subordinados
- RH/Admin ve todas as unidades da empresa

---

## Secao Tecnica

### Estrutura de Arquivos

```text
src/
  pages/
    performance/
      PerformanceEmployees.tsx        # Nova pagina principal
  
  components/
    performance/
      EmployeeCard.tsx                # Card de colaborador
      EmployeeDrawer.tsx              # Drawer de detalhes
      EmployeeFilters.tsx             # Filtros hierarquicos
      EmployeeKPIBar.tsx              # Barra de KPIs

  hooks/
    usePerformanceEmployees.ts        # Hook com visibilidade
    useSubordinates.ts                # Hook para subordinados diretos
```

### Rota

```javascript
// Dentro do PerformanceLayout
<Route path="/performance/employees" element={<PerformanceEmployees />} />
```

### Exemplo de Uso do Hook

```typescript
const { employees, isLoading, filters } = usePerformanceEmployees({
  unitId: selectedUnitId,
  evaluationStatus: 'pending',
  search: searchTerm,
});

// O hook automaticamente aplica:
// - Filtro por root_company_id (multi-tenant)
// - Filtro por visibilidade (colaborador/gestor/RH)
// - Paginacao
```

---

## Regras de Seguranca (Resumo)

| Papel | Ve Colaboradores | Ve Salarios | Ve PII |
|-------|-----------------|-------------|--------|
| Colaborador | Apenas proprio | Proprio | Proprio |
| Gestor | Subordinados | NAO | NAO |
| RH | Todos da empresa | SIM | SIM |
| Admin | Todos da empresa | SIM | SIM |

- **PII** = CPF, telefone, email pessoal, data nascimento
- Gestores veem: Nome, cargo, grade, foto, dados de performance
- RLS no banco de dados + filtros no frontend (dupla camada)

---

## Estimativa de Complexidade

| Componente | Complexidade | Motivo |
|------------|--------------|--------|
| Hook usePerformanceEmployees | Media | Logica de visibilidade + joins |
| Funcao SQL get_visible_employees | Media | Roles + hierarquia |
| Pagina PerformanceEmployees | Media | Lista + filtros + KPIs |
| EmployeeDrawer | Alta | 6 tabs com dados diferentes |
| Filtros Hierarquicos | Media | Cascata dinamica |
| Integracao Nav | Baixa | Adicionar 1 item |

---

## Proximos Passos Apos Aprovacao

1. Criar funcao SQL `get_visible_employees`
2. Criar hook `usePerformanceEmployees` com visibilidade
3. Criar componentes de UI (Card, Drawer, Filters)
4. Criar pagina `PerformanceEmployees.tsx`
5. Adicionar rota e navegacao
6. Testar visibilidade com diferentes roles
