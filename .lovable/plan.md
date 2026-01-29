
# Plano de Implementacao Completa - Modulo de Avaliacao de Desempenho

## Resumo Executivo

Este plano detalha a implementacao completa do modulo de Avaliacao de Desempenho, conectando todas as paginas ao banco de dados e criando componentes funcionais para gerenciamento de metas, templates, avaliacoes, kudos, 1:1s, PDI e sucessao.

---

## Estado Atual

**Ja Implementado:**
- `usePerformanceCycles.ts` - Hook completo para ciclos
- `usePerformanceTemplates.ts` - Hook para templates
- `CycleDialog.tsx` - Dialog de criacao/edicao de ciclos
- `CycleCard.tsx` - Card visual de ciclos
- `PerformanceCycles.tsx` - Pagina funcional conectada ao banco

**Pendente (Placeholders):**
- PerformanceGoals - Metas cascateadas
- PerformanceTemplates - Modelos de avaliacao
- PerformanceEvaluations - Lista de avaliacoes
- PerformanceKudos - Reconhecimento
- Performance9Box - Matriz de talentos
- PerformanceOneOnOnes - Reunioes 1:1
- PerformancePDI - Planos de desenvolvimento
- PerformanceSuccession - Mapeamento de sucessao

---

## Estrutura de Implementacao

### FASE 1: Hooks de Dados (Base)

**1.1 usePerformanceGoals.ts**
- CRUD de metas nos niveis: company, area, department, position, individual
- Suporte a cascateamento via parent_goal_id
- Atualizacao de progresso (current_value)
- Labels para status e niveis

**1.2 usePerformanceEvaluations.ts**
- CRUD de avaliacoes
- Join com profiles para nome do colaborador
- Join com performance_cycles para info do ciclo
- Filtros por status, ciclo, avaliador

**1.3 usePerformanceKudos.ts**
- Enviar kudos (from/to employee_id)
- Listar kudos recebidos e enviados
- Join com profiles para nomes
- Filtro por categoria

**1.4 usePerformanceOneOnOnes.ts**
- CRUD de reunioes 1:1
- Marcar como concluida
- Parsear agenda_items e action_items do JSON

**1.5 usePerformancePDI.ts**
- CRUD de PDIs
- Join com competencies e evaluations
- Atualizacao de progresso
- Labels para status

**1.6 usePerformanceSuccession.ts**
- CRUD de mapeamentos
- Join com job_titles e profiles
- Labels para readiness

---

### FASE 2: Componentes de UI

**2.1 GoalDialog.tsx**
- Formulario para criar/editar metas
- Selecao de nivel (company, area, department, position, individual)
- Selecao de meta pai para cascateamento
- Campos: titulo, descricao, target_value, unit_of_measure, due_date, weight

**2.2 GoalCard.tsx**
- Card visual com progresso
- Barra de progresso (current_value / target_value)
- Badge de status
- Acoes: editar, atualizar progresso, excluir

**2.3 TemplateDialog.tsx**
- Formulario para criar/editar templates
- Editor de indicadores (array JSON)
- Campos: nome, descricao, template_type
- Adicionar/remover indicadores com peso

**2.4 TemplateCard.tsx**
- Card visual do template
- Lista de indicadores com pesos
- Badge de tipo (standard, leadership, sales, etc)

**2.5 EvaluationDialog.tsx**
- Iniciar avaliacao para colaborador
- Selecao de ciclo e template
- Preview do formulario

**2.6 EvaluationForm.tsx**
- Secao de metas do colaborador
- Secao de indicadores do template
- Campos de comentarios (manager_comments, strengths, improvement_areas)
- Calculo automatico de scores

**2.7 KudosDialog.tsx**
- Selecao de destinatario
- Selecao de categoria (teamwork, innovation, leadership, customer_focus, excellence)
- Campo de mensagem
- Toggle publico/privado

**2.8 KudosCard.tsx**
- Card estilo timeline
- Avatar de quem enviou
- Badge de categoria
- Data formatada

**2.9 OneOnOneDialog.tsx**
- Selecao de colaborador
- Data da reuniao
- Pauta (agenda_items)
- Anotacoes

**2.10 PDIDialog.tsx**
- Selecao de colaborador
- Titulo e descricao
- Data limite
- Acoes de desenvolvimento (action_items)

**2.11 SuccessionDialog.tsx**
- Selecao de posicao-chave (job_title)
- Selecao de potencial sucessor
- Nivel de prontidao (ready_now, ready_1_year, ready_2_years, development)
- Plano de desenvolvimento

**2.12 NineBoxMatrix.tsx (Atualizar)**
- Conectar ao usePerformanceEvaluations
- Calcular posicao baseado em final_score e potential_score
- Tooltip com info do colaborador
- Click para ver detalhes

---

### FASE 3: Paginas Funcionais

**3.1 PerformanceGoals.tsx**
- Tabs por nivel (Empresa, Area, Departamento, Cargo, Individual)
- Arvore hierarquica de metas
- Cards de metas com progresso
- Dialog para criar/editar
- Filtro por ciclo e status

**3.2 PerformanceTemplates.tsx**
- Grid de cards de templates
- Filtro por tipo
- Dialog para criar/editar
- Preview dos indicadores

**3.3 PerformanceEvaluations.tsx**
- Tabela com avaliacoes
- Filtros: ciclo, status, colaborador
- Acoes: iniciar, continuar, aprovar
- Link para formulario

**3.4 PerformanceKudos.tsx**
- Feed estilo timeline
- Tabs: Recebidos, Enviados, Todos
- Dialog para enviar
- Filtro por categoria

**3.5 Performance9Box.tsx (Atualizar)**
- Conectar matriz ao banco
- Mostrar contagem real por quadrante
- Lista de colaboradores por quadrante ao clicar

**3.6 PerformanceOneOnOnes.tsx**
- Lista de reunioes (agendadas e concluidas)
- Calendario visual
- Dialog para agendar
- Marcar como concluida

**3.7 PerformancePDI.tsx**
- Lista de PDIs por colaborador
- Cards com progresso
- Filtro por status
- Dialog para criar/editar

**3.8 PerformanceSuccession.tsx**
- Tabela de mapeamentos
- Visualizacao por posicao-chave
- Badge de prontidao
- Dialog para criar/editar

---

## Detalhes Tecnicos

### Tabelas do Banco Utilizadas

| Tabela | Uso |
|--------|-----|
| performance_cycles | Ja conectado |
| performance_templates | Templates de avaliacao |
| performance_goals | Metas cascateadas |
| performance_evaluations | Avaliacoes |
| performance_competency_scores | Notas de competencias |
| performance_kudos | Reconhecimentos |
| performance_one_on_ones | Reunioes 1:1 |
| performance_pdi | Planos de desenvolvimento |
| performance_succession | Mapeamento de sucessao |
| performance_merit_rules | Regras de merito |
| performance_merit_recommendations | Recomendacoes |

### Enums Disponiveis

```text
performance_goal_level: company, area, department, position, individual
performance_goal_status: pending, in_progress, achieved, not_achieved
performance_evaluation_status: draft, pending_review, reviewed, approved, returned
performance_evaluator_type: self, manager, superior, peer, hr
performance_kudos_category: teamwork, innovation, leadership, customer_focus, excellence
performance_pdi_status: pending, in_progress, completed, cancelled
performance_readiness: ready_now, ready_1_year, ready_2_years, development
performance_merit_status: pending, approved, rejected, applied
performance_merit_type: merit_increase, promotion, none
```

### Campos JSON

- `performance_templates.indicators`: Array de indicadores `{id, name, description, weight}`
- `performance_one_on_ones.agenda_items`: Array de itens da pauta
- `performance_one_on_ones.action_items`: Array de acoes
- `performance_pdi.action_items`: Array de acoes de desenvolvimento

---

## Arquivos a Criar

```text
src/hooks/
  usePerformanceGoals.ts
  usePerformanceEvaluations.ts
  usePerformanceKudos.ts
  usePerformanceOneOnOnes.ts
  usePerformancePDI.ts
  usePerformanceSuccession.ts

src/components/performance/
  GoalDialog.tsx
  GoalCard.tsx
  TemplateDialog.tsx
  TemplateCard.tsx
  EvaluationDialog.tsx
  KudosDialog.tsx
  KudosCard.tsx
  OneOnOneDialog.tsx
  PDIDialog.tsx
  PDICard.tsx
  SuccessionDialog.tsx
  NineBoxMatrix.tsx (novo componente)
```

---

## Arquivos a Atualizar

```text
src/pages/performance/
  PerformanceGoals.tsx
  PerformanceTemplates.tsx
  PerformanceEvaluations.tsx
  PerformanceKudos.tsx
  Performance9Box.tsx
  PerformanceOneOnOnes.tsx
  PerformancePDI.tsx
  PerformanceSuccession.tsx
```

---

## Ordem de Implementacao

1. **Hooks de dados** (base para tudo)
   - usePerformanceGoals
   - usePerformanceEvaluations
   - usePerformanceKudos
   - usePerformanceOneOnOnes
   - usePerformancePDI
   - usePerformanceSuccession

2. **Componentes de UI** (dialogs e cards)
   - GoalDialog + GoalCard
   - TemplateDialog + TemplateCard
   - KudosDialog + KudosCard
   - OneOnOneDialog
   - PDIDialog + PDICard
   - SuccessionDialog

3. **Paginas funcionais** (conectar tudo)
   - PerformanceGoals
   - PerformanceTemplates
   - PerformanceKudos
   - PerformanceOneOnOnes
   - PerformancePDI
   - PerformanceSuccession
   - Performance9Box
   - PerformanceEvaluations

---

## Proximos Passos Imediatos

Iniciar criando todos os hooks de dados e componentes simultaneamente para permitir testes completos de ponta a ponta.

