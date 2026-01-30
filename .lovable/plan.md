
# Plano: Múltiplos Sucessores com Ranking e Plano de Desenvolvimento

## Visão Geral

Expandir o módulo de Plano de Sucessão para permitir:
- Até **3 sucessores** por posição-chave
- **Ranking** de prioridade (1º, 2º, 3º)
- **Plano de desenvolvimento** baseado em gaps de competências

---

## Alterações no Banco de Dados

### Nova coluna na tabela `performance_succession`

```sql
ALTER TABLE performance_succession 
ADD COLUMN rank INTEGER DEFAULT 1 CHECK (rank >= 1 AND rank <= 3);

-- Índice único para evitar duplicação de rank por posição
CREATE UNIQUE INDEX idx_succession_position_rank 
ON performance_succession (key_position_id, rank) 
WHERE rank IS NOT NULL;

-- Comentário para documentação
COMMENT ON COLUMN performance_succession.rank IS 'Ranking do sucessor (1=primeiro, 2=segundo, 3=terceiro)';
```

---

## Arquivos a Modificar

### 1. `src/hooks/usePerformanceSuccession.ts`

**Alterações:**
- Atualizar interface `SuccessionWithRelations` para incluir `rank`
- Modificar a query para ordenar por `rank` dentro de cada posição
- Adicionar validação para limitar 3 sucessores por posição
- Atualizar a função `getSuccessionsByPosition()` para ordenar por rank

**Código:**
```typescript
// Adicionar ao interface
export interface SuccessionWithRelations extends PerformanceSuccession {
  rank: number; // Novo campo
  // ... campos existentes
}

// Modificar a query para ordenar por rank
.order("key_position_id")
.order("rank", { ascending: true })
```

### 2. `src/components/performance/SuccessionDialog.tsx`

**Alterações:**
- Adicionar campo para seleção de **Ranking** (1º, 2º, 3º)
- Adicionar seção para **Gaps de Competências** entre cargo atual e posição-chave
- Melhorar layout para acomodar novos campos
- Validar que não existam mais de 3 sucessores para a mesma posição

**Novos campos no formulário:**
```tsx
// Campo de Ranking
<div className="space-y-2">
  <Label>Ranking de Prioridade *</Label>
  <Select value={formData.rank} onValueChange={...}>
    <SelectItem value="1">1º - Primeiro na Linha</SelectItem>
    <SelectItem value="2">2º - Segunda Opção</SelectItem>
    <SelectItem value="3">3º - Terceira Opção</SelectItem>
  </Select>
</div>

// Seção de Gaps (quando colaborador e posição selecionados)
<div className="space-y-2">
  <Label>Gaps Identificados</Label>
  <Card className="p-3">
    {gaps.map(gap => (
      <div className="flex items-center gap-2">
        <Badge variant="outline">{gap.competency}</Badge>
        <span>{gap.current} → {gap.required}</span>
      </div>
    ))}
  </Card>
</div>
```

### 3. `src/pages/performance/PerformanceSuccession.tsx`

**Alterações:**
- Agrupar visualização por **posição-chave** (card por posição)
- Mostrar até 3 sucessores rankeados dentro de cada card
- Adicionar **medalhas visuais** para 1º, 2º, 3º lugar
- Melhorar a exibição do plano de desenvolvimento

**Nova estrutura visual:**
```
┌─────────────────────────────────────────────────┐
│  Gerente de Mídia (346 • Grade 007)             │
├─────────────────────────────────────────────────┤
│ 🥇 1º José Anzois Pereira                       │
│    Analista Sênior • Grade 005                  │
│    Prontidão: Pronto em 2 Anos                  │
│    Gaps: Liderança, Gestão de Projetos          │
│    [Editar] [Remover]                           │
├─────────────────────────────────────────────────┤
│ 🥈 2º Maria Silva                               │
│    Analista Pleno • Grade 004                   │
│    Prontidão: Em Desenvolvimento                │
│    Gaps: Comunicação Executiva, Excel Avançado  │
│    [Editar] [Remover]                           │
├─────────────────────────────────────────────────┤
│ [+ Adicionar 3º Sucessor]                       │
└─────────────────────────────────────────────────┘
```

---

## Lógica de Gaps de Competências

### Query para identificar gaps

```typescript
// Buscar competências do cargo-alvo (posição-chave)
const positionCompetencies = await supabase
  .from("job_title_competencies")
  .select(`
    competency:competencies(id, name, type),
    required_level
  `)
  .eq("job_title_id", keyPositionId);

// Comparar com cargo atual do colaborador
// Gap = competência requerida no cargo-alvo que não está no cargo atual
// ou tem nível inferior
```

### Sugestão automática de plano de desenvolvimento

Baseado nos gaps identificados, sugerir ações:
- **Gap técnico** → Cursos, certificações, treinamentos
- **Gap comportamental** → Mentoria, coaching, feedback 360º
- **Gap experiência** → Projetos especiais, job rotation

---

## Validações de Negócio

1. **Máximo 3 sucessores por posição**: Validar antes de inserir
2. **Rank único por posição**: Não permitir duplicação (1º, 1º)
3. **Colaborador não pode ser sucessor de si mesmo**
4. **Colaborador não pode estar rankeado em múltiplas posições-chave** (opcional, discutir)

---

## Resumo de Alterações

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Banco de dados | Migration | Adicionar coluna `rank` + índice único |
| `usePerformanceSuccession.ts` | Hook | Incluir rank, ordenação, validação |
| `SuccessionDialog.tsx` | Dialog | Campo rank, seção gaps, plano desenvolvimento |
| `PerformanceSuccession.tsx` | Page | Visualização agrupada por posição com cards |

---

## Seção Técnica

### Estrutura de dados atualizada

```typescript
interface SuccessionWithRelations {
  id: string;
  key_position_id: string;
  successor_employee_id: string;
  rank: number; // NOVO: 1, 2, ou 3
  readiness: Readiness;
  development_plan: string | null;
  notes: string | null;
  key_position?: { title: string; grade: string; code: string };
  successor?: { full_name: string; avatar_url: string | null; job_title: string | null; grade: string | null };
  gaps?: CompetencyGap[]; // NOVO: gaps identificados
}

interface CompetencyGap {
  competency_id: string;
  competency_name: string;
  current_level: number | null;
  required_level: number;
  gap_type: 'technical' | 'behavioral' | 'leadership';
}
```

### Labels para ranking

```typescript
export const rankLabels: Record<number, string> = {
  1: "1º - Primeiro na Linha",
  2: "2º - Segunda Opção",
  3: "3º - Terceira Opção",
};

export const rankIcons: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};
```
