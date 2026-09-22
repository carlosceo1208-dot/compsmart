# Perplexity no módulo Insight (tendências de mercado citadas)

Reaproveita integralmente a busca com citações já entregue no painel: mesma
função de backend, mesmo cache de 24 horas, mesmo bloqueio de dados internos,
mesmo limite de 5 atualizações por hora e mesmo registro de uso. Nada do widget
do painel é alterado.

## 1. Novos temas permitidos

A lista de temas aceitos pela busca ganha quatro entradas voltadas ao Insight:

- Movimentações salariais e dissídios por setor
- Inflação e impacto em remuneração
- Tendências de benefícios e remuneração total
- Práticas de mercado por cargo e região

O filtro de assuntos permitidos passa a reconhecer também palavras como
dissídio, piso salarial, IPCA/INPC, reajuste por setor, remuneração total e
prática de mercado. As regras de recusa continuam idênticas: qualquer pergunta
com nome de pessoa, CPF, e-mail, matrícula, valor de salário, faixa salarial ou
referência a dados internos é recusada e registrada.

## 2. Widget "Tendências de Mercado" na página do Insight

Novo cartão na página Insight — Market Benchmark, abaixo dos indicadores:

- Seletor de tema entre os quatro novos temas (padrão: movimentações salariais
  e dissídios).
- Cada item com título, resumo, fonte com link clicável e data.
- Botão "Atualizar" sujeito ao limite por hora; quando o limite é atingido,
  mostra o conteúdo mais recente já buscado com aviso.
- Estados de carregando, vazio e erro com opção de tentar de novo.
- Visual igual ao cartão do painel (cartões arredondados, badges pílula).

## 3. Referência de mercado citada nas análises

Nos alertas de defasagem e no posicionamento competitivo, uma única linha de
referência externa é exibida no topo de cada aba, rotulada como
"Referência externa de mercado (conteúdo público)", com o texto do resumo, a
fonte com link e a data.

- A referência vem do mesmo conteúdo público em cache; nenhum dado da empresa é
  enviado para obtê-la.
- O rótulo deixa explícito que é conteúdo público externo, separado dos números
  internos exibidos na tabela.
- Sem referência confiável em cache, a linha simplesmente não aparece — nada é
  inventado.

## 4. Fora deste escopo

A base de benchmark comprada/importada do Insight não é substituída nem
complementada pela busca. O widget do painel e as demais funções de backend
ficam inalterados. Nenhum dado de cliente sai da plataforma.

## Detalhes técnicos

- `supabase/functions/market-insights/index.ts`: acrescentar ao mapa `TOPICS` as
  chaves `dissidios_setor`, `inflacao_remuneracao`, `beneficios_total`,
  `praticas_cargo_regiao` e ampliar o regex `ALLOWED_TERMS`. Redeploy da função.
  `FORBIDDEN_PATTERNS`, cache, `check_rate_limit` e `market_insights_usage` sem
  alteração.
- `src/hooks/useMarketInsights.ts`: já aceita `topic`; adicionar apenas a lista
  de temas do Insight exportada como constante (rótulos legíveis).
- Novos componentes: `src/components/insight/MarketTrendsCard.tsx` (widget com
  seletor de tema, reutilizando a estrutura visual de `MarketInsightsCard`) e
  `src/components/insight/MarketReferenceNote.tsx` (uma referência citada,
  recebe `topic`, renderiza nada quando não há item).
- `src/pages/MarketBenchmark.tsx`: inserir o widget após os cartões de resumo e
  a nota de referência no topo de cada `TabsContent`.
- Sem migração de banco e sem alteração de RLS.
