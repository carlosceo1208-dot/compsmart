# Plano: Módulo de Avaliação de Desempenho Estratégico (v2.0)

## Visão Geral

Módulo completo e independente de Avaliação de Desempenho para o CompSmart, com identidade visual **Azul Índigo**, inspirado nas melhores práticas de mercado (Sólides, Qulture.Rocks, Gupy).

---

## Diferenciais Competitivos Incorporados

| Fonte | Funcionalidade | Status |
|-------|----------------|--------|
| Sólides | Matriz 9Box (Performance x Potencial) | ✅ Incluído |
| Sólides | PDI integrado | ✅ Incluído |
| Qulture.Rocks | Ciclo visual integrado (4 etapas) | ✅ Incluído |
| Qulture.Rocks | 1:1s Guiados | ✅ Incluído |
| Gupy | IA Devolutiva (feedback automático) | ✅ Incluído |
| Gupy | Pesos configuráveis | ✅ Incluído |
| Novo | Reconhecimento/Kudos | ✅ Incluído |
| Novo | Avaliação de Experiência (probatório) | ✅ Incluído |
| Novo | Sucessão básica | ✅ Incluído |
| Novo | Exportar PDF / Imprimir | ✅ Incluído |

---

## 1. Tema Visual: Azul Índigo

| Elemento | Cor |
|----------|-----|
| Primária | indigo-600 (#4F46E5) |
| Gradiente Header | from-indigo-50 via-white to-indigo-50 |
| Botões Ativos | indigo-500 |
| Badges/Destaques | indigo-100/indigo-700 |
| Cards KPI | Borda indigo-200 |

---

## 2. Estrutura de Navegação

```text
+------------------------------------------------------------------+
|              PERFORMANCE DASHBOARD (Azul Índigo)                  |
+------------------------------------------------------------------+
| Ciclos | Metas | Avaliações | 9Box | 1:1s | Kudos | PDI | IA     |
+------------------------------------------------------------------+
```

### Ciclo Visual Integrado (inspirado Qulture.Rocks)
```text
[ 1. METAS ]  →  [ 2. ACOMPANHAMENTO ]  →  [ 3. INSIGHTS ]  →  [ 4. FECHAMENTO ]
   Definir         Feedback contínuo        9Box/Análise        Devolutiva
```

---

## 3. Tabelas de Banco de Dados

### 3.1 performance_cycles
```sql
- id: uuid PK
- root_company_id: uuid FK
- name: text
- year: integer
- start_date, end_date: date
- evaluation_type: enum (individual, shared, collective, hybrid)
- evaluator_types: jsonb
- evaluation_angle: enum (90, 180, 360)
- scale_type: enum (numeric_1_5, conceptual, percentage)
- status: enum (draft, goals, monitoring, insights, closing, closed)
- include_competencies: boolean DEFAULT false
- competencies_weight: numeric DEFAULT 0
- goals_weight: numeric DEFAULT 100
- include_probation: boolean DEFAULT false
- created_by: uuid
- created_at, updated_at: timestamp
```

### 3.2 performance_goals
```sql
- id: uuid PK
- cycle_id: uuid FK
- parent_goal_id: uuid FK nullable (cascateamento)
- goal_level: enum (company, area, department, position, individual)
- title, description: text
- target_value, current_value, weight: numeric
- unit_id, job_title_id, employee_id: uuid FK nullable
- status: enum (pending, in_progress, achieved, not_achieved)
- created_at, updated_at: timestamp
```

### 3.3 performance_templates
```sql
- id: uuid PK
- root_company_id: uuid FK nullable
- template_type: enum (operational, administrative, technical, sales, management, probation)
- name, description: text
- indicators: jsonb
- suggested_competencies: jsonb
- is_active: boolean
- created_at, updated_at: timestamp
```

### 3.4 performance_evaluations
```sql
- id: uuid PK
- cycle_id: uuid FK
- employee_id, evaluator_id: uuid FK
- evaluator_type: enum (self, manager, superior, peer, hr)
- template_id: uuid FK nullable
- is_probation: boolean DEFAULT false
- probation_end_date: date nullable
- status: enum (draft, pending_review, reviewed, approved, returned)
- overall_score, goals_score, competencies_score: numeric
- potential_score: numeric (para 9Box)
- scores_detail: jsonb
- strengths, improvements: text
- ai_feedback: text (IA Devolutiva)
- submitted_at, reviewed_at, approved_at: timestamp
- reviewed_by, approved_by: uuid FK nullable
- return_notes: text
- created_at, updated_at: timestamp
```

### 3.5 performance_competency_scores
```sql
- id: uuid PK
- evaluation_id: uuid FK
- competency_id: uuid FK
- expected_level, evaluated_level: enum (basic, intermediate, advanced, expert)
- score: numeric
- comments: text
- created_at: timestamp
```

### 3.6 performance_one_on_ones (1:1s Guiados)
```sql
- id: uuid PK
- manager_id, employee_id: uuid FK
- cycle_id: uuid FK nullable
- scheduled_at: timestamp
- completed_at: timestamp nullable
- status: enum (scheduled, completed, cancelled)
- agenda: text
- notes: text
- action_items: jsonb
- created_at, updated_at: timestamp
```

### 3.7 performance_kudos (Reconhecimento)
```sql
- id: uuid PK
- from_user_id, to_user_id: uuid FK
- root_company_id: uuid FK
- message: text
- category: enum (teamwork, innovation, leadership, customer_focus, excellence)
- is_public: boolean DEFAULT true
- created_at: timestamp
```

### 3.8 performance_pdi (Plano de Desenvolvimento Individual)
```sql
- id: uuid PK
- employee_id: uuid FK
- evaluation_id: uuid FK nullable
- title, description: text
- development_area: text
- actions: jsonb
- target_date: date
- status: enum (pending, in_progress, completed, cancelled)
- progress_percentage: numeric DEFAULT 0
- created_by: uuid FK
- created_at, updated_at: timestamp
```

### 3.9 performance_succession (Sucessão Básica)
```sql
- id: uuid PK
- position_id: uuid FK (job_title_id)
- root_company_id: uuid FK
- current_holder_id: uuid FK nullable
- successor_id: uuid FK
- readiness: enum (ready_now, ready_1_year, ready_2_years, development)
- notes: text
- created_by: uuid FK
- created_at, updated_at: timestamp
```

### 3.10 performance_variable_link
```sql
- id: uuid PK
- evaluation_id: uuid FK
- incentive_program_id: uuid FK
- weight_percentage: numeric
- calculated_multiplier: numeric
- created_at: timestamp
```

### 3.11 performance_glossary_terms
```sql
- id: uuid PK
- term, definition, category: text
- synonyms: text[]
- is_active: boolean
- created_at, updated_at: timestamp
```

---

## 4. Funcionalidades Principais

### 4.1 Matriz 9Box (Performance x Potencial)
```text
         POTENCIAL
         Alto    │ Enigma      │ Forte Desempenho │ Alto Potencial │
         Médio   │ Questionável│ Mantenedor       │ Promessa       │
         Baixo   │ Insuficiente│ Eficaz           │ Profissional   │
                 └─────────────┴──────────────────┴────────────────┘
                      Baixo          Médio              Alto
                              DESEMPENHO
```

- Clique no quadrante para ver colaboradores
- Drill-down por área/departamento
- Ações sugeridas por quadrante

### 4.2 1:1s Guiados
- Agenda pré-definida com tópicos sugeridos
- Histórico de reuniões anteriores
- Action items com follow-up
- Integração com PDI

### 4.3 Reconhecimento/Kudos
- Enviar reconhecimento público ou privado
- Categorias: Trabalho em Equipe, Inovação, Liderança, Foco no Cliente, Excelência
- Feed de reconhecimentos na empresa
- Badge de reconhecimento no perfil

### 4.4 Avaliação de Experiência (Probatório)
- Template específico para período de experiência
- Alertas automáticos 30/60/90 dias
- Decisão: Efetivar / Estender / Desligar
- Histórico para compliance

### 4.5 PDI Integrado
- Criação automática após avaliação
- Baseado em gaps de competências
- Ações com prazos e responsáveis
- Acompanhamento de progresso

### 4.6 IA Devolutiva
- Botão "Gerar Devolutiva IA" na avaliação
- Narrativa automática do desempenho
- Pontos fortes e oportunidades
- Sugestões de desenvolvimento
- Tom profissional e empático

### 4.7 Exportar PDF / Imprimir
- Botão "Exportar PDF" na avaliação
- Botão "Imprimir" na avaliação
- Layout otimizado para impressão
- Inclui: dados do colaborador, scores, competências, feedback
- Cabeçalho com logo da empresa
- Rodapé com data/hora e página

### 4.8 Sucessão Básica
- Identificar posições-chave
- Mapear potenciais sucessores
- Prontidão: Agora / 1 ano / 2 anos / Desenvolvimento
- Visualização por organograma

---

## 5. Formulário de Avaliação

### Cabeçalho do Colaborador
```text
+-------------------------------------------------------------+
| [FOTO]  Nome Completo do Colaborador                        |
|         Cargo: Analista Financeiro Sr | Grade: P3           |
|         Admissão: 15/03/2021 | Pontos: 425                  |
|         Área: Financeiro > Tesouraria                       |
|         Gestor: Maria Silva                                 |
|         Última Avaliação: 4.2/5 (Supera)                    |
+-------------------------------------------------------------+
| [📄 Exportar PDF]  [🖨️ Imprimir]  [🤖 Gerar Devolutiva IA]  |
+-------------------------------------------------------------+
```

### Seções do Formulário
1. **Metas/Resultados** (peso configurável)
2. **Competências Técnicas** (opcional)
3. **Competências Comportamentais** (opcional)
4. **Potencial** (para 9Box)
5. **Pontos Fortes** (texto)
6. **Oportunidades de Melhoria** (texto)
7. **Devolutiva IA** (gerada automaticamente)

---

## 6. Escalas de Avaliação

### Numérica (1-5)
| Valor | Descrição |
|-------|-----------|
| 1 | Não Atende |
| 2 | Atende Parcialmente |
| 3 | Atende |
| 4 | Supera |
| 5 | Excepcional |

### Conceitual
- Não Atende Expectativas
- Atende Parcialmente
- Atende Expectativas
- Supera Expectativas
- Excepcional

### Percentual
- 0-100% de atingimento

---

## 7. Workflow de Aprovação

```text
1. Gestor preenche avaliação
       ↓
2. Gestor Superior revisa → Aprova / Devolve
       ↓
3. RH valida e calibra (se necessário)
       ↓
4. Colaborador visualiza resultado
       ↓
5. PDI criado automaticamente
       ↓
6. Peso enviado para PLR (se configurado)
```

---

## 8. Dashboards

### Para RH/Gestão
- Ciclo visual (4 etapas)
- Taxa de conclusão
- Distribuição de notas (histograma)
- Heatmap por área
- Matriz 9Box interativa
- Top/Low performers
- Radar de competências agregado
- Gaps mais comuns

### Para Colaborador
- Progresso das metas (gauge)
- Status: 🟢 No ritmo / 🟡 Atenção / 🔴 Risco
- Radar pessoal de competências
- Histórico de avaliações
- Kudos recebidos
- PDI e progresso

---

## 9. Componentes a Criar

```text
src/pages/
  - PerformanceDashboard.tsx
  - PerformanceCycles.tsx
  - PerformanceGoals.tsx
  - PerformanceEvaluations.tsx
  - PerformanceTemplates.tsx
  - Performance9Box.tsx
  - PerformanceOneOnOnes.tsx
  - PerformanceKudos.tsx
  - PerformancePDI.tsx
  - PerformanceSuccession.tsx
  - PerformanceGlossary.tsx
  - PerformanceAssistant.tsx

src/components/performance/
  - PerformanceLayout.tsx
  - PerformanceNav.tsx
  - PerformanceKPIDashboard.tsx
  - CycleVisualProgress.tsx (4 etapas)
  - CycleDialog.tsx / CycleCard.tsx
  - GoalDialog.tsx / GoalCard.tsx / GoalCascadeTree.tsx
  - TemplateDialog.tsx / TemplateEditor.tsx
  - EvaluationDialog.tsx / EvaluationForm.tsx / EvaluationCard.tsx
  - EmployeeEvaluationHeader.tsx
  - ScaleSelector.tsx
  - ApprovalWorkflow.tsx
  - NineBoxMatrix.tsx / NineBoxQuadrant.tsx
  - OneOnOneDialog.tsx / OneOnOneCard.tsx
  - KudosDialog.tsx / KudosFeed.tsx / KudosBadge.tsx
  - PDIDialog.tsx / PDICard.tsx / PDIProgress.tsx
  - SuccessionDialog.tsx / SuccessionTree.tsx
  - CompetencyEvaluationSection.tsx
  - CompetencyScoreCard.tsx
  - CompetencyRadar.tsx
  - CompetencyGapAnalysis.tsx
  - HeatmapChart.tsx
  - ProgressGauge.tsx
  - EvaluationPDFExport.tsx
  - EvaluationPrintView.tsx
  - AIFeedbackGenerator.tsx

src/hooks/
  - usePerformanceCycles.ts
  - usePerformanceGoals.ts
  - usePerformanceEvaluations.ts
  - usePerformanceKPIs.ts
  - usePerformanceTemplates.ts
  - usePerformance9Box.ts
  - useOneOnOnes.ts
  - useKudos.ts
  - usePDI.ts
  - useSuccession.ts
  - useCompetencyScores.ts
  - useEvaluationPDF.ts

supabase/functions/
  - performance-assistant/index.ts
```

---

## 10. Fases de Implementação

### Fase 1: Infraestrutura
1. Migrations (todas as tabelas)
2. PerformanceLayout com tema índigo
3. Rotas no App.tsx
4. Botão "Performance" no Dashboard

### Fase 2: Ciclos e Modelos
5. PerformanceCycles (CRUD + visual 4 etapas)
6. PerformanceTemplates (5 modelos + probatório)
7. ScaleSelector

### Fase 3: Metas
8. PerformanceGoals
9. GoalCascadeTree
10. Cascateamento empresa → colaborador

### Fase 4: Avaliações
11. PerformanceEvaluations
12. EvaluationForm + cabeçalho
13. CompetencyEvaluationSection
14. ApprovalWorkflow
15. Avaliação de Experiência

### Fase 5: 9Box + Sucessão
16. Performance9Box (matriz interativa)
17. PerformanceSuccession

### Fase 6: 1:1s + Kudos + PDI
18. PerformanceOneOnOnes
19. PerformanceKudos + KudosFeed
20. PerformancePDI

### Fase 7: Dashboards
21. PerformanceKPIDashboard
22. CycleVisualProgress
23. HeatmapChart
24. CompetencyRadar
25. Dashboard do colaborador

### Fase 8: IA + Exportação
26. Edge function performance-assistant
27. AIFeedbackGenerator (IA Devolutiva)
28. EvaluationPDFExport (jsPDF)
29. EvaluationPrintView (CSS print)

### Fase 9: Integração PLR
30. Configuração de peso por ciclo
31. Cálculo de multiplicador
32. Vínculo com incentive_programs

### Fase 10: Glossário e Polimento
33. PerformanceGlossary
34. Seeds dos termos
35. Notificações
36. Testes finais

---

## 11. Exportação PDF / Impressão

### Estrutura do PDF
```text
+----------------------------------------------------------+
| [LOGO EMPRESA]                    Avaliação de Desempenho |
|                                   Ciclo: 2026 - Anual     |
+----------------------------------------------------------+
| DADOS DO COLABORADOR                                      |
| Nome: João Silva          Cargo: Analista Sr              |
| Área: Financeiro          Admissão: 15/03/2021            |
| Gestor: Maria Santos      Grade: P3                       |
+----------------------------------------------------------+
| RESUMO DA AVALIAÇÃO                                       |
| Score Final: 4.2 / 5.0    Classificação: Supera           |
| Metas: 4.0 (70%)          Competências: 4.5 (30%)         |
+----------------------------------------------------------+
| DETALHAMENTO DE METAS                                     |
| • Meta 1: Reduzir custos 10% .......... 100% atingido     |
| • Meta 2: Implantar sistema ........... 85% atingido      |
+----------------------------------------------------------+
| COMPETÊNCIAS AVALIADAS                                    |
| Técnicas:                                                 |
| • Excel Avançado: Esperado Avançado / Avaliado Expert     |
| Comportamentais:                                          |
| • Trabalho em Equipe: Esperado Avançado / Avaliado Avançado|
+----------------------------------------------------------+
| PONTOS FORTES                                             |
| - Excelente capacidade analítica                          |
| - Proatividade na resolução de problemas                  |
+----------------------------------------------------------+
| OPORTUNIDADES DE MELHORIA                                 |
| - Desenvolver habilidades de apresentação                 |
| - Ampliar conhecimento em Power BI                        |
+----------------------------------------------------------+
| DEVOLUTIVA                                                |
| [Texto gerado pela IA ou escrito pelo gestor]             |
+----------------------------------------------------------+
| Avaliador: Maria Santos       Data: 29/01/2026            |
| Aprovador: Carlos Lima        Data: 30/01/2026            |
+----------------------------------------------------------+
|                      Página 1 de 1                        |
+----------------------------------------------------------+
```

### Implementação
- **PDF**: Usar jsPDF + jspdf-autotable (já instalados)
- **Impressão**: CSS @media print com layout otimizado
- **Opções**: Incluir/excluir seções, logo da empresa

---

## 12. Restrições Respeitadas

- ✅ Não altera arquitetura existente
- ✅ Não modifica RBAC (usa has_role existente)
- ✅ Não refatora telas existentes
- ✅ Reutiliza estrutura de competências existente
- ✅ Módulo 100% plugável e independente
- ✅ Usa bibliotecas já instaladas (jsPDF)

---

## Resultado Esperado

Um módulo de Avaliação de Desempenho:
- **Estratégico**: Metas cascateadas + Competências opcionais
- **Visual**: Tema Azul Índigo + 9Box + Ciclo visual
- **Moderno**: IA Devolutiva + Kudos + 1:1s
- **Completo**: PDF + Impressão + PDI + Sucessão
- **Integrado**: PLR/Incentivos + Competências existentes
