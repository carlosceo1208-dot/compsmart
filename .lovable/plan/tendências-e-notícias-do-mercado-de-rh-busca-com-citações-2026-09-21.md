# Tendências e Notícias do Mercado de RH (busca com citações)

Widget de conteúdo vivo e citado sobre mercado de RH, remuneração, benefícios,
legislação trabalhista e NR-1, alimentado pelo serviço de busca do Perplexity
através do backend. Nenhum dado interno da empresa sai da plataforma.

## 1. Conexão com o Perplexity

Abro o cartão de conexão do Perplexity para você escolher a opção gerenciada
pela Lovable (sem precisar de conta própria). Nessa modalidade está disponível
apenas a busca na web — é exatamente o que o widget precisa. Cada busca consome
créditos da workspace.

Se você preferir usar sua própria chave do Perplexity, o valor fica guardado no
cofre de segredos e é usado só no backend.

## 2. Cache e auditoria (banco de dados)

Duas tabelas novas:

- **market_insights_cache** — pergunta normalizada, tema, resultado estruturado
  (título, resumo, fontes com link e data), momento da busca e validade
  (24 horas). Conteúdo é público de mercado, compartilhado entre empresas.
- **market_insights_usage** — quem pediu, de qual empresa, qual pergunta,
  quando, se veio do cache e se foi recusada. Serve para auditoria e controle
  de custo.

Leitura permitida a qualquer usuário autenticado; gravação só pelo backend.
O registro de uso é visível apenas para administradores da própria empresa.

## 3. Função de backend

Nova função `market-insights` (nenhuma função existente é alterada):

1. Exige usuário autenticado.
2. Aceita apenas temas da lista permitida: mercado de RH, remuneração,
   benefícios, legislação trabalhista/NR-1 e tendências. Pergunta fora da lista
   é recusada e registrada como negada.
3. Bloqueia qualquer pergunta com indício de dado interno (nome de pessoa, CPF,
   matrícula, valores de salário, nomes de colunas internas, e-mails).
4. Devolve o conteúdo do cache quando ainda está dentro das 24 horas.
5. Caso contrário busca no Perplexity, organiza os resultados em título, resumo
   e fontes com link e data, grava no cache e devolve.
6. Limite de 5 buscas novas por usuário por hora (o limitador atual do app é
   reaproveitado). Ao estourar, devolve o último conteúdo do cache com aviso.
7. A chave/conexão fica só no backend.

Observação: o app não tem um mecanismo padrão de limite de chamadas; será usado
o mesmo controle ad-hoc já empregado em outras funções.

## 4. Widget no frontend

Componente único "Tendências e Notícias do Mercado de RH", usado no painel
principal e no painel executivo:

- Lista de itens com título, resumo e, em cada um, a fonte com link e a data.
- Rodapé indicando quando o conteúdo foi atualizado.
- Botão "Atualizar" que força nova busca, desabilitado quando o limite por hora
  foi atingido (com aviso ao usuário).
- Estados de carregando, vazio ("nenhuma novidade encontrada") e erro com
  mensagem clara e opção de tentar de novo.
- Visual seguindo o padrão atual dos cartões do painel.

## 5. Fora deste escopo

Sem uso no módulo Insight (benchmark), sem Jurídico Smart, sem enriquecimento de
dados internos, sem alteração de outras funções do backend.

## Detalhes técnicos

- Conector via `standard_connectors--connect` (`perplexity`); modo gerenciado usa
  `POST /search` no gateway (`connector-gateway.lovable.dev/perplexity/search`)
  com `LOVABLE_API_KEY` + `X-Connection-Api-Key`; modo BYOK chama
  `api.perplexity.ai` direto. O código lê o modo e segue um caminho só.
- Síntese de título/resumo a partir dos resultados via Lovable AI Gateway
  (`openai/gpt-6-astra`, Responses API) — apenas texto público dos resultados.
- Tabelas: `public.market_insights_cache`, `public.market_insights_usage` com
  GRANTs para `authenticated`/`service_role`, RLS habilitada.
- Rate limit reutilizando a RPC `check_rate_limit` (5/60min,
  `p_function_name='market-insights'`).
- Novos arquivos: `supabase/functions/market-insights/index.ts`,
  `src/hooks/useMarketInsights.ts`,
  `src/components/dashboard/MarketInsightsCard.tsx`; inclusão em
  `src/pages/Dashboard.tsx` e `src/pages/ExecutiveDashboard.tsx`.
