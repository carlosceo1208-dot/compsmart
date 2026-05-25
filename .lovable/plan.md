## Objetivo

Aplicar no questionário de Clima (60 perguntas) o mesmo critério já usado no diagnóstico NR-1 (40 perguntas): **ocultar o nome da dimensão** durante a resposta e **embaralhar as perguntas** para evitar indução de respostas. O link pergunta ↔ dimensão continua existindo internamente (via `dimensao_num`) e é usado normalmente no cálculo dos scores por dimensão e nos relatórios.

## Arquivos afetados

1. `src/pages/nr1/Nr1ClimaResponder.tsx` — fluxo interno (colaborador logado)
2. `src/pages/public/ClimaPublico.tsx` — fluxo público (link anônimo)

## Mudanças

Em ambas as telas, na seção de resposta:

- Remover o agrupamento atual por dimensão (loop `DIMENSOES.map → QUESTOES.filter(dimensao)` com `<CardTitle>{DIMENSAO_LABEL[dim]}</CardTitle>`).
- Gerar uma **lista única embaralhada** de 60 perguntas usando Fisher–Yates dentro de um `useMemo([])` (embaralhamento estável por sessão, novo a cada abertura).
- Renderizar cada pergunta com cabeçalho neutro: **"Pergunta X de 60"** + barra de progresso, sem citar a dimensão.
- Manter a `key` interna `${q.dimensao}_${q.num}` para que o cálculo dos scores por dimensão (`calcularScores`) e o envio das respostas continuem 100% funcionais.

## O que NÃO muda

- `src/lib/climaQuestoes.ts` (perguntas, dimensões, função `calcularScores`).
- Resultados, dashboards, correlação Clima × COPSOQ — continuam mostrando as dimensões normalmente, pois o vínculo é preservado nos dados gravados.
- Schema do banco.

## Validação

1. Abrir `/nr1/clima/responder/:id` e o link público de clima → confirmar que não aparece nome de dimensão e a ordem das perguntas muda entre acessos.
2. Submeter um questionário de teste e conferir que `scores_dimensao` é calculado corretamente nas 10 dimensões.