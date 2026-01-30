

# Plano: Ajustar Botão de Voltar no Módulo de Desempenho

## Alteração Solicitada

Baseado na imagem de referência, modificar o texto e estilo do botão "Voltar ao Dashboard" para:
- **Texto**: "Voltar ao Dashboard Gestão Remuneração"
- **Cor**: Verde (igual à página principal do CompSmart)
- **Peso**: Negrito (font-bold)

---

## Arquivo a Modificar

**Arquivo:** `src/components/performance/PerformanceLayout.tsx`

**Linhas 16-19**: Alterar classes CSS e texto do botão

---

## Mudanças Específicas

### Código Atual:
```tsx
<Button variant="ghost" size="sm" className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-900/30">
  <ArrowLeft className="h-4 w-4" />
  Voltar ao Dashboard
</Button>
```

### Código Novo:
```tsx
<Button variant="ghost" size="sm" className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30 font-bold">
  <ArrowLeft className="h-4 w-4" />
  Voltar ao Dashboard Gestão Remuneração
</Button>
```

---

## Detalhes das Alterações de Estilo

| Propriedade | Antes | Depois |
|-------------|-------|--------|
| Cor do texto | `text-indigo-600` | `text-green-600` |
| Hover cor texto | `hover:text-indigo-700` | `hover:text-green-700` |
| Hover fundo | `hover:bg-indigo-100` | `hover:bg-green-100` |
| Dark mode texto | `dark:text-indigo-400` | `dark:text-green-400` |
| Dark hover fundo | `dark:hover:bg-indigo-900/30` | `dark:hover:bg-green-900/30` |
| Peso da fonte | (normal) | `font-bold` |
| Texto do botão | "Voltar ao Dashboard" | "Voltar ao Dashboard Gestão Remuneração" |

---

## Resultado Visual Esperado

O botão ficará:
- Com texto verde vibrante (`green-600`) em destaque
- Em **negrito** para maior visibilidade
- Indicando claramente que retorna ao módulo de **Gestão de Remuneração**
- Consistente com o tema verde da página principal do CompSmart

