

## Corrigir Tour do Dashboard para Reexibir Apos Atualizacao

### Problema
O tour salva `compsmart_tour_completed = true` no localStorage. Como o usuario ja completou a versao antiga, o tour atualizado (com Avaliacao de Desempenho e PerformAI) nunca aparece.

### Solucao
Versionar a chave do localStorage para que cada atualizacao de conteudo force a reexibicao do tour.

### Alteracoes tecnicas

**Arquivo:** `src/components/dashboard/DashboardTour.tsx`

1. Mudar a constante `TOUR_STORAGE_KEY` de `'compsmart_tour_completed'` para `'compsmart_tour_completed_v2'`
2. Atualizar a funcao `resetDashboardTour` para limpar a nova chave
3. Nenhuma outra alteracao necessaria -- o restante da logica ja funciona corretamente

Isso garante que:
- Usuarios que completaram a v1 verao o tour v2 automaticamente
- Futuras atualizacoes de conteudo podem incrementar para v3, v4, etc.
- A funcao `resetDashboardTour` continua funcionando para reset manual

