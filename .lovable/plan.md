
# Plano: Adicionar Busca com Digitacao em Todas as Selecoes de Colaboradores

## Contexto do Problema

Em empresas com muitos colaboradores (500+), usar dropdowns com scroll para encontrar um nome e impraticavel. O usuario precisa digitar e ver opcoes filtradas instantaneamente.

## Solucao: Componente Combobox Reutilizavel

Criaremos um componente `EmployeeCombobox` que:
- Permite digitar para filtrar
- Mostra avatar, nome e cargo do colaborador
- Usa Command/Popover (mesmo padrao do UserDialog que ja funciona)
- Substitui os Selects atuais

---

## Arquivos a Criar

### 1. `src/components/EmployeeCombobox.tsx` (NOVO)

Componente reutilizavel que encapsula a logica de busca de colaboradores:

```typescript
interface EmployeeComboboxProps {
  employees: Employee[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  excludeIds?: string[];  // Para excluir usuario atual, por exemplo
}
```

Caracteristicas:
- Campo de busca com icone
- Lista filtrada por digitacao
- Avatar + Nome + Cargo em cada item
- Suporte a altura maxima com scroll
- Estado "Nenhum encontrado" informativo

---

## Arquivos a Modificar

### 2. `src/components/performance/KudosDialog.tsx`

**Antes (linhas 91-113):**
- Select tradicional com todos colaboradores
- Precisa rolar para encontrar

**Depois:**
- Usar `EmployeeCombobox`
- Digitar para filtrar
- Manter preview do selecionado

### 3. `src/components/performance/GoalDialog.tsx`

**Antes (linhas 260-275):**
- Select para metas individuais

**Depois:**
- EmployeeCombobox para selecao de colaborador

### 4. `src/components/performance/PDIDialog.tsx`

**Antes (linhas 147-170):**
- Select para associar PDI a colaborador

**Depois:**
- EmployeeCombobox com busca

### 5. `src/components/performance/OneOnOneDialog.tsx`

**Antes (linhas 139-161):**
- Select para agendar One-on-One

**Depois:**
- EmployeeCombobox com busca

### 6. `src/components/performance/SuccessionDialog.tsx`

**Antes (linhas 159-186):**
- Select para mapear sucessor

**Depois:**
- EmployeeCombobox com busca
- Manter exibicao do grade junto ao nome

### 7. `src/components/UserDialog.tsx`

**Antes (linhas 1177-1192):**
- `<select>` nativo HTML para gestor direto

**Depois:**
- EmployeeCombobox para gestor
- Consistencia com o campo de funcionario que ja usa Command

---

## Estrutura do Componente EmployeeCombobox

```
+----------------------------------------+
| [🔍] Digite para buscar...       [▼]   |
+----------------------------------------+
        |
        v (ao clicar ou digitar)
+----------------------------------------+
| [🔍] Maria Sil...                      |
+----------------------------------------+
| 👤 Maria Silva                         |
|    Analista de RH                      |
+----------------------------------------+
| 👤 Maria Santos                        |
|    Gerente Financeiro                  |
+----------------------------------------+
| 👤 Mariana Costa                       |
|    Desenvolvedora                      |
+----------------------------------------+
| ... (max 10 resultados visíveis)       |
+----------------------------------------+
```

---

## Beneficios da Solucao

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Busca | Scroll manual | Digitacao instantanea |
| Tempo | ~30s em listas grandes | ~2s |
| UX | Frustrante | Fluida |
| Consistencia | Varios padroes | Padrao unico |
| Manutencao | Codigo duplicado | Componente reutilizavel |

---

## Detalhes Tecnicos

### Componentes Utilizados
- `Popover` + `PopoverTrigger` + `PopoverContent` (Radix)
- `Command` + `CommandInput` + `CommandList` + `CommandItem` (cmdk)
- `Avatar` + `AvatarImage` + `AvatarFallback`

### Logica de Filtragem
- Case-insensitive
- Busca por nome, matricula ou cargo
- Limite de 20 resultados para performance
- Ordenacao alfabetica

### Acessibilidade
- Navegacao por teclado (setas, Enter, Escape)
- Labels ARIA apropriados
- Foco gerenciado corretamente

---

## Resumo de Alteracoes

| Arquivo | Tipo | Complexidade |
|---------|------|--------------|
| `EmployeeCombobox.tsx` | Novo | Media |
| `KudosDialog.tsx` | Modificar | Baixa |
| `GoalDialog.tsx` | Modificar | Baixa |
| `PDIDialog.tsx` | Modificar | Baixa |
| `OneOnOneDialog.tsx` | Modificar | Baixa |
| `SuccessionDialog.tsx` | Modificar | Baixa |
| `UserDialog.tsx` | Modificar | Baixa |

**Total: 1 arquivo novo + 6 arquivos modificados**

---

## Resultado Final

Todos os locais onde o usuario precisa selecionar um colaborador terao:
1. Campo de busca com digitacao
2. Filtragem instantanea
3. Avatar e informacoes do colaborador visiveis
4. Experiencia consistente em toda plataforma
5. Suporte a empresas com centenas ou milhares de colaboradores
