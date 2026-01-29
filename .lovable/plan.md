
# Plano Atualizado: Modulo de Avaliacao de Desempenho Estrategico (v3.1)

## Integracao Completa

O modulo de Avaliacao de Desempenho sera integrado com TRES sistemas existentes do CompSmart:

```text
+------------------------------------------------------------------+
|                  AVALIACAO DE DESEMPENHO                          |
+------------------------------------------------------------------+
           |                    |                    |
           v                    v                    v
+------------------+  +------------------+  +------------------+
| PLR / INCENTIVOS |  | PROGRAMA MERITO  |  | ORCAMENTO        |
| (ICP + ILP)      |  | (merit_increase) |  | (projections)    |
+------------------+  +------------------+  +------------------+
```

---

## Estruturas Existentes Identificadas

### 1. PLR/Incentivos
- Tabela: `incentive_programs` (short_term, long_term)
- Tabela: `employee_incentive_assignments`
- Hook: `useIncentivesKPI`

### 2. Programa de Merito (Budget)
- Tabela: `budget_employee_projections`
- Campo: `change_type = 'merit_increase' | 'promotion'`
- Hook: `useBudgetProjections`
- Componente: `AddChangeDialog`

### 3. Ajustes Coletivos
- Tabela: `collective_salary_adjustments`
- Hook: `useCollectiveAdjustments`

---

## Nova Integracao: Desempenho → Merito

### Conceito
Apos a aprovacao da avaliacao de desempenho, o sistema pode:
1. Sugerir automaticamente um aumento por merito baseado na nota
2. Criar uma projecao no orcamento (budget_employee_projections)
3. O gestor/RH aprova ou ajusta antes de efetivar

### Nova Tabela: `performance_merit_rules`
```sql
- id: uuid
- root_company_id: uuid (FK)
- cycle_id: uuid (FK, nullable - para regras globais)
- min_score: numeric (ex: 4.0)
- max_score: numeric (ex: 5.0)
- merit_percentage: numeric (ex: 8.0% para nota 4.5)
- promotion_eligible: boolean (ex: nota 5 pode promover)
- is_active: boolean
- created_at, updated_at: timestamp
```

### Logica de Calculo
```text
Nota 5.0 (Excepcional)      → 10% merito + elegivel promocao
Nota 4.0-4.9 (Supera)       → 6-9% merito (escalonado)
Nota 3.0-3.9 (Atende)       → 3-5% merito
Nota 2.0-2.9 (Parcial)      → 0-2% merito
Nota <2.0 (Nao Atende)      → sem merito + alerta de performance
```

### Nova Tabela: `performance_merit_recommendations`
```sql
- id: uuid
- evaluation_id: uuid (FK)
- employee_id: uuid (FK)
- recommended_percentage: numeric
- recommended_type: enum ('merit_increase', 'promotion', 'none')
- recommended_new_job_title_id: uuid (FK, nullable)
- status: enum ('pending', 'approved', 'rejected', 'applied')
- approved_by: uuid (FK, nullable)
- approved_at: timestamp
- applied_to_budget: boolean DEFAULT false
- budget_projection_id: uuid (FK, nullable) -- vinculo com budget
- notes: text
- created_at: timestamp
```

---

## Fluxo Completo: Avaliacao → Merito → Orcamento

```text
1. AVALIACAO CONCLUIDA
   Nota final: 4.5/5.0
        |
        v
2. SISTEMA GERA RECOMENDACAO
   "Sugestao: 7% de aumento por merito"
   Baseado nas regras de performance_merit_rules
        |
        v
3. RH/GESTOR REVISA
   - Aprovar sugestao
   - Ajustar percentual
   - Sugerir promocao
   - Rejeitar (justificar)
        |
        v
4. SE APROVADO → CRIAR PROJECAO NO ORCAMENTO
   INSERT INTO budget_employee_projections
   (change_type: 'merit_increase', percentage: 7%, justification: 'Avaliacao 2025')
        |
        v
5. GESTOR DE ORCAMENTO APROVA
   Efetiva ou aguarda ciclo de ajustes
```

---

## Integracao PLR/Incentivos (Existente + Novo)

### Tabela Atualizada: `performance_variable_link`
```sql
- id: uuid
- evaluation_id: uuid (FK)
- incentive_program_id: uuid (FK)
- weight_percentage: numeric (peso do desempenho no bonus)
- calculated_multiplier: numeric (multiplicador baseado na nota)
- notes: text
- created_at: timestamp
```

### Logica de Multiplicador para PLR
```text
Score 5.0 → Multiplicador 1.20 (120% do target)
Score 4.5 → Multiplicador 1.10 (110% do target)
Score 4.0 → Multiplicador 1.00 (100% do target)
Score 3.5 → Multiplicador 0.90 (90% do target)
Score 3.0 → Multiplicador 0.80 (80% do target)
Score <3.0 → Multiplicador 0.00 (sem bonus)
```

### Configuracao no Ciclo
Ao criar um ciclo de avaliacao, o RH pode:
1. Vincular a um programa de incentivo (incentive_programs)
2. Definir o peso do desempenho no calculo (ex: 30% do bonus depende da nota)
3. O sistema calcula automaticamente o multiplicador apos aprovacao

---

## Componentes Novos para Integracao

### MeritRecommendationCard
Exibe a recomendacao de merito apos avaliacao:
```text
+------------------------------------------------------------------+
| RECOMENDACAO DE MERITO                                           |
+------------------------------------------------------------------+
| Colaborador: Joao Silva                                          |
| Avaliacao: 4.5/5.0 (Supera Expectativas)                         |
|                                                                  |
| SUGESTAO DO SISTEMA:                                             |
| [✓] Aumento por Merito: 7%                                       |
|     Novo salario: R$ 5.350,00 (atual: R$ 5.000,00)              |
|                                                                  |
| [ ] Promocao para: Analista Senior (Grade S3)                    |
|                                                                  |
| [Aprovar e Enviar para Orcamento]  [Ajustar]  [Rejeitar]         |
+------------------------------------------------------------------+
```

### MeritRulesManager
Gerenciar regras de merito por faixa de nota:
```text
+------------------------------------------------------------------+
| REGRAS DE MERITO                                   [+ Nova Regra] |
+------------------------------------------------------------------+
| Nota           | Merito (%)  | Promocao | Status                 |
+------------------------------------------------------------------+
| 4.5 - 5.0      | 8 - 10%     | ✓ Sim    | Ativo                  |
| 4.0 - 4.49     | 5 - 7%      | ✗ Nao    | Ativo                  |
| 3.0 - 3.99     | 2 - 4%      | ✗ Nao    | Ativo                  |
| 2.0 - 2.99     | 0 - 1%      | ✗ Nao    | Ativo                  |
| 0 - 1.99       | 0%          | ✗ Nao    | Alerta Performance     |
+------------------------------------------------------------------+
```

### PLRLinkConfig
Configurar vinculo do ciclo com programa de incentivo:
```text
+------------------------------------------------------------------+
| VINCULO COM PROGRAMA DE INCENTIVOS                               |
+------------------------------------------------------------------+
| Programa: PLR 2025 (Curto Prazo)                                 |
| Peso do Desempenho no Calculo: [30%] v                           |
|                                                                  |
| Multiplicadores por Nota:                                        |
| 5.0 = 120%  |  4.0 = 100%  |  3.0 = 80%  |  <3.0 = 0%           |
+------------------------------------------------------------------+
```

---

## Dashboards Atualizados

### Para RH/Gestao
Novos cards:
- Total de recomendacoes de merito pendentes
- Custo projetado de aumentos por merito
- Distribuicao: Promocoes vs Meritos vs Sem Aumento
- Impacto no orcamento anual

### Para Colaborador
Novos cards:
- Status da recomendacao de merito
- Elegibilidade para PLR/Bonus
- Multiplicador aplicado

---

## Hooks Novos

```text
src/hooks/
  - useMeritRules.ts (CRUD regras de merito)
  - useMeritRecommendations.ts (recomendacoes por avaliacao)
  - usePerformancePLRLink.ts (vinculo com incentivos)
  - useApplyMeritToBudget.ts (enviar para orcamento)
```

---

## Edge Function Atualizada: PerformAI

Novas capacidades:
- Analisar avaliacao e sugerir percentual de merito
- Explicar criterios de elegibilidade para PLR
- Comparar com historico de aumentos do colaborador
- Simular impacto no orcamento total

---

## Ordem de Implementacao Atualizada

### Fase 1: Infraestrutura Base
1. Migrations (todas as tabelas incluindo merit_rules e merit_recommendations)
2. PerformanceLayout com tema indigo
3. Rotas e navegacao
4. Botao no Dashboard principal

### Fase 2: Ciclos e Modelos
5. PerformanceCycles (CRUD)
6. PerformanceTemplates (modelos)
7. ScaleSelector (3 escalas)
8. Seeds de modelos

### Fase 3: Metas Cascateadas
9. PerformanceGoals
10. GoalCascadeTree
11. Logica de cascateamento

### Fase 4: Avaliacoes
12. PerformanceEvaluations
13. EvaluationForm + EmployeeEvaluationHeader
14. CompetencyEvaluationSection (opcional)
15. ApprovalWorkflow

### Fase 5: 9Box e Sucessao
16. Performance9Box + NineBoxMatrix
17. PerformanceSuccession

### Fase 6: 1:1s, Kudos, PDI
18. PerformanceOneOnOnes
19. PerformanceKudos
20. PerformancePDI

### Fase 7: Dashboards
21. PerformanceKPIDashboard
22. Graficos (Heatmap, Radar, Gauge)
23. Dashboard do colaborador

### Fase 8: INTEGRACAO MERITO (NOVO)
24. MeritRulesManager (regras de merito)
25. MeritRecommendationCard (sugestoes automaticas)
26. useApplyMeritToBudget (enviar para budget_employee_projections)
27. Workflow: Avaliacao → Recomendacao → Orcamento

### Fase 9: INTEGRACAO PLR/INCENTIVOS
28. PLRLinkConfig (vincular ciclo a programa)
29. Calculo de multiplicadores
30. performance_variable_link (registro)

### Fase 10: PerformAI + Exportacao
31. Edge function performance-assistant
32. Pagina PerformanceAssistant
33. EvaluationPDFExport (jsPDF)
34. EvaluationPrintView (CSS @media print)
35. AIFeedbackGenerator (devolutiva)

### Fase 11: Glossario e Polimento
36. PerformanceGlossary
37. Seeds de termos
38. Notificacoes
39. Testes e ajustes finais

---

## Arquivos Adicionais

```text
src/components/performance/
  - MeritRecommendationCard.tsx
  - MeritRulesManager.tsx
  - MeritRulesDialog.tsx
  - PLRLinkConfig.tsx
  - PLRMultiplierTable.tsx

src/hooks/
  - useMeritRules.ts
  - useMeritRecommendations.ts
  - usePerformancePLRLink.ts
  - useApplyMeritToBudget.ts
```

---

## Restricoes Mantidas

- Nao altera arquitetura existente
- Nao modifica RBAC (usa has_role existente)
- Nao refatora telas existentes
- REUTILIZA budget_employee_projections existente
- REUTILIZA incentive_programs existente
- Modulo 100% plugavel e independente

---

## Resultado Esperado

Um modulo de Avaliacao de Desempenho:
- **Estrategico**: Metas cascateadas + Competencias opcionais
- **Visual**: Tema Azul Indigo + 9Box + Ciclo visual
- **Moderno**: PerformAI + Kudos + 1:1s + PDI
- **Integrado**: 
  - PLR/Incentivos (multiplicador de bonus)
  - Programa de Merito (sugestao automatica de %)
  - Orcamento (envia para budget_employee_projections)
- **Completo**: PDF + Impressao + Sucessao

Pronto para iniciar pela Fase 1 (migrations e layout base).
