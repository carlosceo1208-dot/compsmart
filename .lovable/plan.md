

# Plano: Tornar os Badges do Módulo de Desempenho Clicáveis

## Problema Identificado

O card "Módulo de Avaliação de Desempenho" na parte inferior do dashboard contém badges (Metas Cascateadas, 9Box, Kudos, 1:1s, PerformAI) que são **apenas visuais** e não navegam para lugar nenhum.

Isso causa confusão porque:
- Visualmente parecem botões clicáveis
- O usuário espera interatividade
- Não há feedback ou ação ao clicar

---

## Solução Proposta

Transformar os badges em **links navegáveis** que levam às respectivas páginas do módulo.

---

## Arquivo a Modificar

**Arquivo:** `src/pages/PerformanceDashboard.tsx`

**Linhas 220-236**: Substituir badges estáticos por links clicáveis

---

## Mudanças Específicas

### Código Atual (linhas 220-236):
```tsx
<div className="flex flex-wrap gap-2">
  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
    Metas Cascateadas
  </Badge>
  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
    9Box
  </Badge>
  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
    Kudos
  </Badge>
  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
    1:1s
  </Badge>
  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
    PerformAI
  </Badge>
</div>
```

### Código Novo:
```tsx
<div className="flex flex-wrap gap-2">
  <Link to="/performance/goals">
    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 cursor-pointer transition-colors">
      Metas Cascateadas
    </Badge>
  </Link>
  <Link to="/performance/9box">
    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 cursor-pointer transition-colors">
      9Box
    </Badge>
  </Link>
  <Link to="/performance/kudos">
    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 cursor-pointer transition-colors">
      Kudos
    </Badge>
  </Link>
  <Link to="/performance/one-on-ones">
    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 cursor-pointer transition-colors">
      1:1s
    </Badge>
  </Link>
  <Link to="/performance/assistant">
    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 cursor-pointer transition-colors">
      PerformAI
    </Badge>
  </Link>
</div>
```

---

## Alterações Necessárias

### 1. Adicionar import do Link (linha 1)
```tsx
import { Link } from "react-router-dom";
```

### 2. Mapeamento de badges para rotas

| Badge | Rota de Destino |
|-------|-----------------|
| Metas Cascateadas | `/performance/goals` |
| 9Box | `/performance/9box` |
| Kudos | `/performance/kudos` |
| 1:1s | `/performance/one-on-ones` |
| PerformAI | `/performance/assistant` |

### 3. Adicionar estilos de hover
- `hover:bg-indigo-100` - feedback visual ao passar o mouse
- `cursor-pointer` - indica que é clicável
- `transition-colors` - animação suave

---

## Resultado Esperado

Após a alteração:
- Cada badge será um link funcional
- Ao clicar em "9Box", navega para `/performance/9box`
- Ao clicar em "Kudos", navega para `/performance/kudos`
- Efeito hover indica interatividade
- UX consistente com expectativa do usuário

---

## Resumo

| Item | Ação |
|------|------|
| Arquivo | `src/pages/PerformanceDashboard.tsx` |
| Tipo | Modificação |
| Linhas afetadas | 1 (import) + 220-236 (badges) |
| Impacto | 5 badges tornam-se navegáveis |

