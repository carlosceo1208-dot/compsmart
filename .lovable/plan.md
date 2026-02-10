
# Melhorias no Modulo de Avaliacao de Desempenho -- Inspirado pela Mereo

## Resumo

Analisei as telas da Mereo e comparei com o CompSmart atual. Identifiquei 5 melhorias principais que agregam valor estrategico ao modulo de Desempenho, sem replicar a Mereo, mas incorporando os conceitos mais fortes.

---

## Melhorias Propostas

### 1. Avaliacao de Potencial Estruturada (Competencias)

**O que a Mereo faz:** Avalia potencial por dimensoes especificas (Agilidade de autoconhecimento, Mental, com Pessoas, com Mudancas, com Resultados) com nota e comentario por item.

**O que o CompSmart faz hoje:** Score de potencial e um unico slider (0-5).

**Melhoria:** Adicionar uma secao de "Avaliacao de Potencial por Dimensao" dentro do EvaluationDialog, com 5 dimensoes de agilidade e campo de comentario por dimensao. O score final de potencial sera calculado automaticamente como media das dimensoes.

**Impacto:** Avaliacao mais fundamentada e comparavel entre colaboradores.

### 2. Indicador de Risco de Perda (Retention Risk)

**O que a Mereo faz:** Card "Risco de Perda" com fatores como Remuneracao, Adaptacao a localidade, Carreira, Outros (Sim/Nao).

**O que o CompSmart faz hoje:** Nao possui avaliacao de risco de retencao.

**Melhoria:** Adicionar secao "Risco de Perda" no EvaluationDialog com:
- Score geral de risco (Baixo/Medio/Alto)
- Fatores de risco com toggle: Remuneracao, Localizacao, Carreira, Clima, Mercado
- Campo de observacao

**Impacto:** Permite ao gestor e RH antecipar turnover e agir preventivamente.

### 3. Resumo Executivo da Avaliacao (Evaluation Summary Card)

**O que a Mereo faz:** Card "Resumo da Avaliacao" com foto do colaborador, cargo, scores grandes de Potencial e Desempenho, nivel de risco e impacto, e preview da posicao no 9Box.

**O que o CompSmart faz hoje:** O EvaluationDialog mostra os dados, mas sem um resumo visual executivo compacto.

**Melhoria:** Redesenhar o cabecalho do EvaluationDialog para incluir:
- Foto e dados do colaborador (ja existe)
- Scores de Desempenho e Potencial em destaque grande com classificacao textual (ex: "Alta Performance", "Medio Potencial")
- Mini 9Box inline mostrando a posicao do colaborador
- Badges de Nivel de Risco e Nivel de Impacto

**Impacto:** Visao executiva imediata ao abrir uma avaliacao.

### 4. Arvore de Sucessao Hierarquica (Succession Org Tree)

**O que a Mereo faz:** Visualizacao em formato de organograma com cards de posicao (CEO -> Diretor Comercial -> Diretor Operacoes), cada um mostrando o titular + carrossel de avatares de sucessores com prontidao.

**O que o CompSmart faz hoje:** Layout mestre-detalhe (split 40/60) com cards por posicao e painel lateral com detalhes e IA.

**Melhoria:** Adicionar uma opcao de visualizacao alternativa "Arvore" na pagina de Sucessao com:
- Toggle entre "Lista" (atual) e "Arvore" (nova)
- Cards hierarquicos verticais mostrando: titular, avatar, cargo, sucessores (com avatares navegaveis)
- Badge de prontidao e tempo estimado ao lado de cada sucessor
- Conectores visuais entre niveis hierarquicos

**Impacto:** Visao estrategica do pipeline de lideranca em formato intuitivo.

### 5. Indicacao de Sucessores na Avaliacao

**O que a Mereo faz:** Dentro da tela de avaliacao, ha uma secao "Indicacao de Sucessores" onde o avaliador pode indicar cargo + colaborador + prontidao.

**O que o CompSmart faz hoje:** Sucessao e avaliacao sao modulos separados, conectados apenas via comentarios do gestor.

**Melhoria:** Adicionar secao "Indicacao de Sucessores" no EvaluationDialog para que o gestor possa, durante a avaliacao:
- Ver posicoes-chave vinculadas ao avaliado
- Indicar se o avaliado pode ser sucessor de alguma posicao
- Definir prontidao estimada
- Salvar automaticamente no modulo de Sucessao

**Impacto:** Integra os dois processos no momento mais natural -- a avaliacao.

---

## Detalhes Tecnicos

### Banco de dados

**Nova tabela: `evaluation_potential_dimensions`**
- `id` (uuid PK)
- `evaluation_id` (FK -> performance_evaluations)
- `dimension` (text: learning_agility, mental_agility, people_agility, change_agility, results_agility)
- `score` (numeric 0-5)
- `comment` (text)
- `root_company_id` (FK para isolamento multi-tenant)
- RLS: mesmas politicas da tabela performance_evaluations

**Novas colunas em `performance_evaluations`:**
- `retention_risk_level` (enum: low, medium, high)
- `retention_risk_factors` (jsonb: array de fatores marcados)
- `retention_risk_notes` (text)
- `impact_level` (enum: low, medium, high)

### Componentes a criar/modificar

1. **`PotentialDimensionsSection.tsx`** -- Secao de dimensoes de potencial com 5 sliders + comentarios
2. **`RetentionRiskSection.tsx`** -- Card de risco de perda com toggles e score
3. **`EvaluationSummaryHeader.tsx`** -- Cabecalho executivo com mini 9Box inline
4. **`SuccessionOrgTree.tsx`** -- Arvore hierarquica para pagina de Sucessao
5. **`EvaluationSuccessionSection.tsx`** -- Secao de indicacao de sucessores dentro da avaliacao
6. **Modificar `EvaluationDialog.tsx`** -- Integrar as novas secoes
7. **Modificar `PerformanceSuccession.tsx`** -- Adicionar toggle Lista/Arvore

### Sequencia de implementacao

1. Migracao de banco (tabela + colunas + RLS)
2. PotentialDimensionsSection + RetentionRiskSection
3. EvaluationSummaryHeader com mini 9Box
4. Integrar tudo no EvaluationDialog
5. SuccessionOrgTree
6. EvaluationSuccessionSection

### Riscos e consideracoes

- As dimensoes de potencial sao opcionais -- o slider geral continua disponivel para empresas que preferem avaliacoes simplificadas
- A arvore de sucessao depende dos dados de organizational_structure para montar a hierarquia; sera necessario cruzar posicoes-chave com a estrutura organizacional
- O risco de perda e um campo subjetivo do gestor, nao calculado automaticamente
