
# Plano: Sistema de Notificação e Celebração de Kudos

## Problema Identificado

Atualmente, quando alguém envia um Kudos:
- O colaborador só descobre quando abre manualmente a página de Kudos ou na avaliação de desempenho
- Reconhecimento tardio perde o impacto emocional
- Não há celebração visual que estimule o colaborador

## Solução Proposta

Criar um sistema completo de notificação em tempo real com celebração visual (confetes) quando o colaborador recebe um Kudos.

---

## Arquivos a Criar

### 1. `src/components/kudos/KudosConfetti.tsx` (NOVO)

Componente de confetes específico para Kudos, com cores temáticas (roxo/índigo do módulo de performance):

- Partículas coloridas caindo da tela
- Estrelas douradas como no LaunchConfetti
- Animação de 4-5 segundos
- Aparece automaticamente ao receber Kudos

### 2. `src/components/kudos/KudosNotificationPopup.tsx` (NOVO)

Modal/Toast especial que aparece quando recebe um Kudos:

```
+----------------------------------------+
| 🎉  Você recebeu um Kudos!            |
+----------------------------------------+
|                                        |
|   👤 De: Maria Silva                   |
|       Analista de RH                   |
|                                        |
|   🤝 Trabalho em Equipe                |
|                                        |
|   "Parabéns pelo excelente trabalho    |
|    na entrega do projeto..."           |
|                                        |
|   [Ver Todos]      [Fechar]            |
+----------------------------------------+
```

Características:
- Aparece centralizado na tela
- Animação de entrada suave
- Botão para ver todos os Kudos recebidos
- Auto-fecha após 10 segundos ou ao clicar

### 3. `src/hooks/useKudosNotifications.ts` (NOVO)

Hook que:
- Escuta em tempo real a tabela `performance_kudos` via Supabase Realtime
- Detecta novos Kudos onde `to_employee_id` = usuário atual
- Dispara estado para mostrar confetes + popup
- Armazena Kudos não lidos para o badge no header

---

## Arquivos a Modificar

### 4. `src/hooks/useHeaderNotifications.ts`

Adicionar contagem de Kudos não visualizados:

```typescript
// Adicionar no useQuery
const { count: unreadKudos } = await supabase
  .from('performance_kudos')
  .select('*', { count: 'exact', head: true })
  .eq('to_employee_id', userId)
  .eq('is_read', false);
```

E adicionar subscription para `performance_kudos` no canal realtime existente.

### 5. `src/components/dashboard/HeaderNotifications.tsx`

Adicionar seção de Kudos pendentes no dropdown:

```
+----------------------------------------+
| 🔔 Notificações                        |
+----------------------------------------+
| 🎉 Kudos Recebidos                     |
|    2 novos reconhecimentos             |  [2]
+----------------------------------------+
| 📋 Aprovações Pendentes                |
|    3 orçamentos aguardando             |  [3]
+----------------------------------------+
```

Ao clicar, navega para `/performance/kudos?tab=received`.

### 6. `src/components/DashboardLayout.tsx`

Integrar o provider de notificações de Kudos:
- Importar `KudosConfetti` e `KudosNotificationPopup`
- Renderizar condicionalmente quando houver novo Kudos
- Os componentes ficam em camada superior (z-index alto)

### 7. `src/pages/performance/PerformanceKudos.tsx`

Marcar Kudos como "lidos" quando o usuário visualiza a aba "Recebidos":
- Chamar função para atualizar `is_read = true`
- Limpar contador do header

---

## Alteração no Banco de Dados

### Adicionar coluna `is_read` na tabela `performance_kudos`

```sql
ALTER TABLE performance_kudos 
ADD COLUMN is_read BOOLEAN DEFAULT false;

-- Atualizar kudos existentes como já lidos
UPDATE performance_kudos SET is_read = true;

-- Habilitar realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE public.performance_kudos;
```

---

## Fluxo de Funcionamento

```
1. Colaborador A envia Kudos para B
           |
           v
2. Supabase insere registro com is_read=false
           |
           v
3. Realtime dispara evento para todos listeners
           |
           v
4. Browser do Colaborador B recebe o evento
           |
           v
5. Hook detecta to_employee_id = usuário atual
           |
           v
6. Dispara: Confetes + Popup celebratório
           |
           v
7. Badge no header mostra "1" novo Kudos
           |
           v
8. Ao abrir /performance/kudos (Recebidos)
           |
           v
9. Marca is_read=true, limpa badge
```

---

## Componentes Visuais

### Confetes (cores temáticas Kudos)
- Roxo indigo: `hsl(245, 58%, 51%)`
- Roxo claro: `hsl(245, 58%, 70%)`
- Dourado: `hsl(45, 93%, 47%)`
- Rosa: `hsl(330, 80%, 60%)`
- Branco: `hsl(0, 0%, 100%)`

### Toast/Popup
- Borda gradiente roxo/dourado
- Ícone animado (pulso)
- Emoji da categoria do Kudos
- Avatar do remetente

---

## Resumo de Alterações

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `KudosConfetti.tsx` | Novo | Animação de confetes |
| `KudosNotificationPopup.tsx` | Novo | Popup celebratório |
| `useKudosNotifications.ts` | Novo | Hook realtime |
| `useHeaderNotifications.ts` | Modificar | Adicionar contagem Kudos |
| `HeaderNotifications.tsx` | Modificar | Adicionar item Kudos |
| `DashboardLayout.tsx` | Modificar | Integrar componentes |
| `PerformanceKudos.tsx` | Modificar | Marcar como lidos |
| Migração SQL | Novo | Coluna is_read + realtime |

**Total: 3 arquivos novos + 4 arquivos modificados + 1 migração**

---

## Resultado Final

1. Colaborador recebe Kudos -> confetes aparecem instantaneamente
2. Popup mostra quem enviou e a mensagem
3. Badge no sino do header indica quantos não lidos
4. Ao visitar a página de Kudos, marca como lidos
5. Experiência de reconhecimento imediata e celebratória
