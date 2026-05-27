## Objetivo

Transformar a aba "Bem-Estar Integral" em **"Matriz de Risco"** (5×5 Severidade × Probabilidade) baseada nas 40 perguntas do questionário COPSOQ-III adaptado, e mover para dentro dela os botões **Gerar PGR** e **Plano de Ação** (hoje no topo do painel NR-1).

## Mudanças

### 1. Navegação (`src/components/nr1/Nr1Layout.tsx`)
- Renomear item `{ to: '/nr1/fib', label: 'Bem-Estar Integral' }` para `label: 'Matriz de Risco'` e trocar ícone `Radar` por `Grid3x3` (mais aderente à matriz).
- Manter rota `/nr1/fib` para não quebrar links existentes (o conteúdo FIB clássico vira uma seção secundária dentro da nova página).

### 2. Painel NR-1 (`src/pages/nr1/Nr1Dashboard.tsx`)
- **Remover** o botão `<GerarPgrButton />` do card "Plano NR-1 Essencial/Pro" (linha 59).
- **Remover** o botão "Plano de Ação" do `GrauRiscoInssCard` (deixar apenas Alterar grau).
- Substituir por um único CTA "Abrir Matriz de Risco" → `/nr1/fib`.

### 3. Nova página Matriz de Risco (`src/pages/nr1/Nr1FIB.tsx`)

Reestruturar em 3 seções, nesta ordem:

**A) Ações de Conformidade (topo)**
- Botão `Gerar PGR` (componente existente `GerarPgrButton`)
- Botão `Plano de Ação` → `/nr1/planos-acao`
- Badge "Conformidade Ativa"

**B) Matriz 5×5 Severidade × Probabilidade** (novo componente `Nr1MatrizRisco`)

Eixos:
- **Probabilidade (X)**: 1 Raro · 2 Improvável · 3 Possível · 4 Provável · 5 Quase certo
- **Severidade (Y)**: 1 Insignificante · 2 Menor · 3 Moderada · 4 Maior · 5 Catastrófica

Cálculo a partir do último diagnóstico (40 perguntas, 6 dimensões em `scores_dimensao`):

```text
Para cada um dos 13 fatores de risco NR-1:
  dimensões_correlatas = CORRELACAO_FATORES_COPSOQ[fator].dimensoes
  score_médio = média(scores_dimensao[dim] para dim em dimensões_correlatas)   // 0–100

  probabilidade = ceil(score_médio / 20)        // 1–5 (quanto maior o score COPSOQ, maior a chance)
  severidade    = severidade_base[fator]        // 1–5 (tabela fixa por gravidade legal/clínica)
  risco         = probabilidade × severidade    // 1–25
```

Tabela `severidade_base` (constante no código, derivada da NR-1 e literatura clínica):
- Catastrófica (5): Eventos violentos/traumáticos, Assédio
- Maior (4): Sobrecarga, Baixa justiça organizacional, Baixo controle/autonomia
- Moderada (3): Falta de suporte, Maus relacionamentos, Baixas recompensas, Má gestão de mudanças
- Menor (2): Clareza de papel, Comunicação difícil, Trabalho remoto isolado
- Insignificante (1): Subcarga

Faixas de risco (cor da célula):
- 1–4 Baixo (verde) · 5–9 Moderado (amarelo) · 10–15 Alto (laranja) · 16–25 Crítico (vermelho)

Render:
- Grid 5×5 com contagem de fatores em cada célula (badges clicáveis abrem painel lateral com a lista de fatores naquela célula).
- Legenda + tabela auxiliar abaixo listando todos os 13 fatores com S, P, R×S e classificação.
- Empty state quando não há diagnóstico concluído.

**C) Seções existentes (mantidas, mais abaixo)**
- KPIs Colaborador/Empresa/Gap, Radar FIB, Detalhe por dimensão, tabelas de correlação, instrumentos.
- Atualizar o título da página de "Bem-Estar Integral (FIB)" para **"Matriz de Risco NR-1"**, com subtítulo explicando que a matriz é alimentada pelo questionário de 40 perguntas e complementada pelas dimensões FIB.

### 4. Não muda
- Schema do banco (todo cálculo vem de `nr1_diagnosticos.scores_dimensao` já existente).
- Rotas, hooks, demais páginas.

## Dúvidas para confirmar antes de implementar

1. **Severidade base** — está OK eu definir a tabela acima a partir da NR-1 + literatura, ou você prefere fornecer/ajustar manualmente os pesos de cada um dos 13 fatores?
2. **Mover Gerar PGR**: confirma remover **completamente** do header do painel principal `/nr1/painel`, ou deixar também um atalho lá?
3. **Rota**: manter `/nr1/fib` (mais simples, sem quebrar links) ou prefere renomear para `/nr1/matriz-risco` (com redirect da antiga)?
