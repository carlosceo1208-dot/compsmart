## Plano de correção do item 3 em diante

### Diagnóstico do travamento
O item 3 não foi concluído de fato. Hoje existem peças parciais, mas elas não fecham o fluxo prometido:

- A tela `Nr1ClimaCorrelacao.tsx` faz uma correlação apenas no frontend, usando os últimos resultados de clima e NR-1.
- O “Plano de Ação Unificado” é apenas visual; ele não cria ações unificadas no banco.
- A tela `Nr1PlanosAcao.tsx` ainda usa o modelo antigo e não exibe `origem`, `aprovacao_status`, `clima_pesquisa_id` nem dimensões relacionadas.
- A migration existente adicionou governança (`origem`, aprovação etc.), mas não criou a view de correlação nem os campos prometidos para o plano unificado.
- Há inconsistência de nomenclatura: a governança usa `origem = 'copsoq'`, enquanto o plano anterior previa `nr1` / `clima` / `unificado`.

Conclusão: o bug não está só no item 3; o fluxo ficou incompleto entre os itens 1, 2 e 3. Faz sentido revisar e consolidar a arquitetura antes de seguir.

### O que vou corrigir

#### 1. Consolidar o modelo de dados dos planos de ação
Vou revisar `nr1_planos_acao` para suportar corretamente o fluxo final:
- padronizar `origem` para valores coerentes com o produto: `manual`, `nr1`, `clima`, `unificado`
- adicionar `dimensoes_relacionadas text[]` para registrar vínculos múltiplos entre clima e NR-1
- manter compatibilidade com o que já foi criado na governança
- preservar multi-tenant e RLS por `company_id`

Se necessário, a migration também normaliza registros antigos que hoje estejam como `copsoq`.

#### 2. Criar a camada de correlação no backend
Em vez de depender só de cálculo no frontend, vou criar a estrutura correta no banco:
- view SQL de correlação Clima × COPSOQ por `company_id`
- uso da pesquisa de clima respondida mais recente + diagnóstico NR-1 concluído mais recente
- cálculo de severidade combinada, convergência/divergência e gap entre instrumentos
- ordenação pronta para consumo pelo dashboard e pela página de correlação

Isso reduz fragilidade do frontend e resolve a base do item 3.

#### 3. Refatorar o acesso frontend à correlação
Vou substituir a lógica solta da página por um hook dedicado, para o fluxo ficar estável e reutilizável:
- criar `useClimaCopsoqCorrelacao`
- consumir a view do banco
- devolver lista pronta com scores, status, prioridade e sugestão de ação

Assim o dashboard, a página de correlação e a geração de plano passam a falar a mesma linguagem.

#### 4. Finalizar a página de correlação
Em `Nr1ClimaCorrelacao.tsx`, vou concluir o que foi prometido:
- manter a leitura analítica da correlação
- mostrar causas raiz priorizadas
- trocar o CTA genérico por ação real de “Gerar plano de ação unificado”
- permitir gerar plano já vinculado às dimensões correlacionadas

#### 5. Corrigir a tela Plano de Ação para o modelo novo
Em `Nr1PlanosAcao.tsx` e `useNr1PlanosAcao.ts`, vou atualizar a tela para refletir o estado real do produto:
- incluir `origem` nos cards
- incluir `aprovacao_status` quando houver
- incluir referência a pesquisa de clima / vínculo unificado
- incluir `dimensoes_relacionadas`
- ajustar criação/edição para não quebrar o fluxo atual

Isso fecha a parte que hoje ficou “travada” ao abrir `/nr1/planos-acao` depois da expansão do módulo.

#### 6. Adicionar o card no dashboard NR-1
Em `Nr1Dashboard.tsx`, vou inserir o card “Correlações de Risco” com:
- top 3 correlações prioritárias
- destaque visual para convergência crítica
- atalho para `/nr1/clima/correlacao`

#### 7. Garantir compatibilidade com os itens 1 e 2 já entregues
Vou revisar os pontos anteriores para não quebrar o que já funciona:
- links públicos e convites de clima permanecem como estão
- dashboard e listagem de pesquisas continuam funcionando
- governança continua operando sobre `nr1_planos_acao`
- se houver conflito de nomenclatura/estado herdado, faço migração de compatibilidade em vez de sobrescrever do zero

### Arquivos que devo alterar
- `supabase/migrations/<nova_migration>.sql`
- `src/hooks/useNr1PlanosAcao.ts`
- `src/pages/nr1/Nr1PlanosAcao.tsx`
- `src/pages/nr1/Nr1ClimaCorrelacao.tsx`
- `src/pages/nr1/Nr1Dashboard.tsx`
- `src/hooks/useClimaCopsoqCorrelacao.ts` (novo)
- possivelmente um componente novo para o card de correlação no dashboard

### Resultado esperado
Ao final:
- a correlação Clima × COPSOQ deixa de ser apenas visual e passa a ter base consistente
- o botão/CTA de plano unificado cria ações reais
- `/nr1/planos-acao` volta a representar corretamente o fluxo completo
- a governança continua compatível
- o item 3 deixa de travar e os próximos itens passam a ter base segura para continuação

### Observação técnica
Não vou refazer os itens 1 e 2 do zero, a menos que encontre incompatibilidade estrutural grave. A abordagem será de correção incremental com compatibilidade, porque já existe valor implementado e o problema principal está na integração e no fechamento do fluxo.