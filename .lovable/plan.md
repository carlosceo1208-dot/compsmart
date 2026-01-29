

# Plano de Implementacao - Modulo de Avaliacao de Desempenho (Fase Funcional)

## Situacao Atual

O modulo ja possui toda a infraestrutura pronta:
- 13 tabelas no banco de dados
- Layout e navegacao implementados
- Rotas configuradas
- Dados de seed inseridos (ciclo, templates, metas, regras de merito)

As paginas atuais sao placeholders estaticos que precisam ser conectadas ao banco de dados.

---

## Proximos Passos - Implementacao por Prioridade

### Fase A: Hooks de Acesso a Dados (Base para tudo)

**1. usePerformanceCycles**
- Listar ciclos ativos e inativos
- Criar, editar e excluir ciclos
- Filtrar por ano fiscal e status

**2. usePerformanceGoals**
- CRUD de metas em todos os niveis (empresa, area, individual)
- Suporte a cascateamento (parent_goal_id)
- Atualizacao de progresso (current_value)

**3. usePerformanceTemplates**
- Listar templates ativos
- Criar e editar templates com indicadores

**4. usePerformanceKudos**
- Enviar kudos (from_employee_id, to_employee_id)
- Listar kudos recebidos e enviados
- Filtrar por categoria

---

### Fase B: Telas de Ciclos e Metas

**5. PerformanceCycles - Pagina Funcional**
- Tabela listando ciclos com status visual
- Dialog para criar/editar ciclo com todos os campos:
  - Nome, descricao, ano fiscal
  - Datas (inicio, fim, metas, avaliacao)
  - Configuracoes (angulo 90/180/360, escala, competencias)
  - Pesos (metas vs competencias)
- Indicador visual do estagio atual do ciclo

**6. PerformanceGoals - Metas Cascateadas**
- Visualizacao em arvore hierarquica (Empresa > Area > Individual)
- Card para cada meta com progresso visual
- Dialog para criar meta com selecao de nivel e meta pai
- Atualizacao de progresso com historico

---

### Fase C: Templates e Avaliacoes

**7. PerformanceTemplates - Modelos de Avaliacao**
- Cards dos templates existentes com indicadores
- Dialog para criar template com array de indicadores
- Preview do formulario de avaliacao

**8. PerformanceEvaluations - Lista de Avaliacoes**
- Tabela de avaliacoes com filtros (ciclo, status, colaborador)
- Iniciar avaliacao para colaborador
- Acompanhar status (rascunho, enviado, revisado, aprovado)

**9. EvaluationForm - Formulario de Avaliacao**
- Secao de metas com notas por meta
- Secao de indicadores do template
- Secao de competencias (opcional)
- Campos de comentarios (gestor, pontos fortes, melhorias)
- Score final calculado automaticamente

---

### Fase D: 9Box, Kudos e 1:1s

**10. Performance9Box - Matriz Funcional**
- Grid 3x3 com performance vs potencial
- Posicionamento automatico baseado em avaliacoes
- Clique para ver detalhes do colaborador

**11. PerformanceKudos - Reconhecimento**
- Feed de kudos enviados (estilo timeline)
- Dialog para enviar novo kudos
- Selecao de categoria e mensagem
- Notificacao ao destinatario

**12. PerformanceOneOnOnes - Reunioes 1:1**
- Lista de reunioes agendadas e realizadas
- Dialog para agendar/registrar 1:1
- Anotacoes e proximos passos

---

### Fase E: PDI, Sucessao e Integracao Merito

**13. PerformancePDI - Plano de Desenvolvimento**
- Lista de PDIs por colaborador
- Dialog para criar acoes de desenvolvimento
- Status e prazos

**14. PerformanceSuccession - Mapeamento**
- Identificar posicoes-chave
- Mapear potenciais sucessores
- Indicador de prontidao

**15. MeritRecommendationCard**
- Gerar sugestao de merito apos avaliacao aprovada
- Baseado nas regras de performance_merit_rules
- Workflow: aprovar/ajustar/rejeitar
- Enviar para orcamento (budget_employee_projections)

---

## Estrutura de Arquivos a Criar

```text
src/hooks/
  - usePerformanceCycles.ts
  - usePerformanceGoals.ts
  - usePerformanceTemplates.ts
  - usePerformanceEvaluations.ts
  - usePerformanceKudos.ts
  - usePerformanceOneOnOnes.ts
  - usePerformancePDI.ts
  - usePerformanceSuccession.ts
  - useMeritRules.ts
  - useMeritRecommendations.ts

src/components/performance/
  - CycleDialog.tsx
  - CycleCard.tsx
  - GoalDialog.tsx
  - GoalCard.tsx
  - GoalCascadeTree.tsx
  - TemplateDialog.tsx
  - TemplateCard.tsx
  - EvaluationDialog.tsx
  - EvaluationForm.tsx
  - NineBoxMatrix.tsx
  - KudosDialog.tsx
  - KudosCard.tsx
  - OneOnOneDialog.tsx
  - PDIDialog.tsx
  - SuccessionDialog.tsx
  - MeritRecommendationCard.tsx
```

---

## Resumo Tecnico

| Item | Descricao |
|------|-----------|
| Tabelas | Todas ja existem no banco |
| Tipos | Disponiveis em types.ts |
| Enums | performance_cycle_status, performance_goal_level, etc. |
| RLS | Ja configurado por root_company_id |
| Integracao | Vinculo com incentive_programs e budget_employee_projections |

---

## Proxima Acao Sugerida

Iniciar pela **Fase A** criando os hooks de dados:
1. `usePerformanceCycles` - para conectar a pagina de Ciclos
2. `usePerformanceGoals` - para a arvore de metas
3. Atualizar `PerformanceCycles.tsx` para usar dados reais

Isso permitira visualizar o ciclo ja cadastrado e criar novos ciclos.

