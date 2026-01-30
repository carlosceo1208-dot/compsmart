
# Plano: Corrigir Botões do Dialog de Kudos Cortados

## Problema Identificado

O `DialogContent` tem `max-h-[90vh]` e `overflow-hidden`, o que significa que quando o conteúdo do dialog excede a altura máxima, ele é simplesmente cortado. Como o formulário de Kudos agora inclui:
- Campo de busca de colaborador
- Preview do colaborador selecionado
- 5 categorias em grid
- Textarea de mensagem
- Checkbox de visibilidade

O `DialogFooter` com os botões "Cancelar" e "Enviar Kudos" fica fora da área visível.

---

## Solução

Reestruturar o KudosDialog para ter:
1. **Header fixo** (título)
2. **Área de conteúdo com scroll** (formulário)
3. **Footer fixo** (botões)

---

## Alteração no Arquivo

**Arquivo:** `src/components/performance/KudosDialog.tsx`

**Mudanças:**
1. Mover o `DialogFooter` para **fora** do `<form>`
2. Adicionar classes de layout flexível ao formulário
3. Adicionar `overflow-y-auto` e `max-h` ao conteúdo scrollável
4. Manter os botões sempre visíveis na parte inferior

---

## Estrutura Visual Proposta

```
+----------------------------------------+
| 🎉 Enviar Kudos                   [X]  |  <- Header fixo
+----------------------------------------+
|                                        |
| [Campo de busca...]                    |
|                                        |
| [Preview do colaborador]               |  <- Área com scroll
|                                        |
| Categoria: ○ ○ ○ ○ ○                   |
|                                        |
| Mensagem: [textarea]                   |
|                                        |
| ☑ Visível para todos                   |
|                                        |  ↕ scroll se necessário
+----------------------------------------+
| [Cancelar]          [Enviar Kudos]     |  <- Footer fixo
+----------------------------------------+
```

---

## Código a Modificar

Linha 81: Adicionar classes para layout flex com altura máxima

```tsx
<DialogContent className="max-w-md flex flex-col max-h-[85vh]">
```

Reorganizar o formulário:
- Adicionar wrapper com `flex-1 overflow-y-auto` para o conteúdo do form
- Mover `DialogFooter` para depois do form ou estruturar com flex

---

## Resultado

- Os botões "Cancelar" e "Enviar Kudos" ficarão sempre visíveis
- Se o conteúdo for grande, apenas a área do formulário terá scroll
- Funciona em telas pequenas e grandes
