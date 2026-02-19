
## Analise de Alinhamento: Dashboard/Modulos vs Landing Page

### Metodologia
Cruzei todas as funcionalidades reais do produto (Dashboard de Remuneracao, Modulo de Performance com 14 sub-paginas, 23 modulos no ModuleGrid, 4 Agentes Smart, KPIs do dashboard) com o que a landing page comunica atualmente, e confrontei com o posicionamento dos concorrentes diretos.

---

### O que JA esta bem coberto na Landing Page

| Funcionalidade do Produto | Secao da Landing Page |
|---|---|
| Tabelas Salariais, Curvas, Faixas | SolutionSection (Remuneracao Estrategica) |
| Avaliacao 360, 9Box, PDI, Sucessao | SolutionSection (Avaliacao de Desempenho) |
| 4 Agentes Smart (Juridico, Salary, R&B, PerformAI) | SmartAgentsSection |
| Demo interativa (Distorcao + Merito + Simulacao) | InteractiveDemoSection |
| Orcamento e Headcount | SolutionSection (Planejamento Inteligente) |
| Comparacao competitiva | CompetitiveComparisonSection |
| Desempenho integrado a remuneracao | DifferentialsSection + BeforeAfterSection |
| Portes de empresa (PE, ME, GE) | TargetAudienceSection |

---

### GAPS identificados -- Funcionalidades reais NAO comunicadas na Landing Page

#### 1. Reconhecimento e Kudos (Performance)
O modulo tem uma pagina dedicada de Reconhecimento/Kudos com cards e secao de "Employee Kudos". Nenhum concorrente de remuneracao oferece isso nativamente. E um diferencial nao comunicado.

#### 2. Reunioes 1:1 Estruturadas (Performance)
Sub-modulo completo de One-on-Ones com dialogo dedicado. Concorrentes como Impulse Up e Qulture.Rocks oferecem isso, mas separado da remuneracao.

#### 3. Feedback 360 com Avaliadores Externos
O sistema suporta `ExternalFeedbackRequestDialog` -- avaliadores de fora da empresa podem participar do ciclo. Isto e raro e nao esta mencionado.

#### 4. Metricas de RH no Dashboard (People Analytics)
Rotatividade, tempo medio de empresa, distribuicao etaria com graficos de pizza -- tudo calculado automaticamente. A landing menciona "People Analytics" superficialmente.

#### 5. Gestao de Beneficios com Elegibilidade por Grade
Card funcional com custo mensal/anual. A SolutionSection nao detalha isso.

#### 6. ICP/ILP com Detalhamento (Stock Options, RSU, Phantom, Previdencia)
O IncentivesCard mostra curto e longo prazo. A base de conhecimento detalha 6+ instrumentos. A landing so menciona "ICP + ILP" genericamente na tabela comparativa.

#### 7. Auditoria de Equidade (Data Audit)
Modulo dedicado para verificar inconsistencias -- genero, area, nivel. A landing menciona "equidade auditavel" mas sem detalhar.

#### 8. Alertas Automaticos de Performance
Sistema de alertas proativos (attention/neutral/positive) baseado em scores. Nenhum concorrente comunica isso.

---

### Insights Competitivos (baseado no scraping anterior)

- **Solides/Gupy**: Vendem ecossistema completo de RH (recrutamento + performance), mas SEM remuneracao integrada
- **Impulse Up/Qulture.Rocks**: Focam em performance isolada, cobram R$ 9+/colab so para AVD
- **CompSmart**: Unico que oferece Remuneracao + Performance + IA por menos de R$ 6/colab

Os gaps 1, 2, 3 e 8 sao diferenciais que esses concorrentes vendem separadamente. Comunicar na landing reforça o posicionamento "tudo-em-um".

---

### Plano de Implementacao

**Arquivo: `src/components/landing/SolutionSection.tsx`**

Expandir o pilar "Avaliacao de Desempenho" de 3 para 6 cards (2 linhas de 3):
- Manter: Avaliacao 360, Matriz 9Box & PDI, Plano de Sucessao
- Adicionar: **Reconhecimento & Kudos**, **Reunioes 1:1**, **Feedback Externo 360**

**Arquivo: `src/components/landing/SolutionSection.tsx`**

Expandir o pilar "Planejamento Inteligente" adicionando:
- **Gestao de Beneficios** -- "Configure beneficios por grade, calcule custos mensais/anuais e gerencie elegibilidade automaticamente"

**Arquivo: `src/components/landing/SolutionSection.tsx`**

Expandir o pilar "IA" adicionando:
- **Alertas Proativos** -- "Sistema inteligente que identifica riscos de retencao, avaliacoes pendentes e distorcoes salariais antes que virem problemas"

**Arquivo: `src/components/landing/CompetitiveComparisonSection.tsx`**

Adicionar 2 novas linhas na tabela comparativa:
- "Reconhecimento & 1:1s" -- CompSmart: "Integrado", Trad A: "Nao tem", Trad B: "Modulo separado R$ 5+/colab"
- "Alertas Proativos de Performance" -- CompSmart: "Automatico com IA", Trad A: "Nao tem", Trad B: "Nao tem"

**Arquivo: `src/components/landing/DifferentialsSection.tsx`**

Substituir um diferencial generico por:
- **"Feedback Externo 360"** -- "Avaliadores de fora da empresa participam dos ciclos de feedback, ampliando a visao sobre o colaborador"

---

### Secao Tecnica

| Arquivo | Alteracao |
|---|---|
| `src/components/landing/SolutionSection.tsx` | Adicionar 3 cards ao pilar Desempenho (Kudos, 1:1, Feedback Externo), 1 card ao pilar Planejamento (Beneficios), 1 card ao pilar IA (Alertas). Ajustar grid para 2 linhas quando >3 cards |
| `src/components/landing/CompetitiveComparisonSection.tsx` | Adicionar 2 linhas: "Reconhecimento & 1:1s" e "Alertas Proativos" |
| `src/components/landing/DifferentialsSection.tsx` | Trocar diferencial "Metodologias de Mercado" (ja coberto em SolutionSection) por "Feedback Externo 360" |

### Resultado Esperado

A landing page passara a comunicar 100% das funcionalidades reais do produto, eliminando gaps entre o que o usuario ve no dashboard e o que e prometido na venda. Isso reforça o posicionamento de "plataforma completa" frente a concorrentes que vendem modulos separados.
