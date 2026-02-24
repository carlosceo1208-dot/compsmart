
## Atualizar o Tour do Dashboard

O tour atual tem 6 passos e foca apenas em remuneração, sem mencionar o modulo de Avaliacao de Desempenho, o agente PerformAI, nem a visao completa da plataforma.

### Novos passos do tour (7 passos)

1. **Bem-vindo ao CompSmart!** (target: `.dashboard-welcome`)
   - "Plataforma integrada de Remuneracao Estrategica e Avaliacao de Desempenho. Tudo conectado para decisoes mais justas e inteligentes."

2. **Avaliacao de Desempenho** (target: card do PerformanceModuleCard na coluna esquerda)
   - "Modulo completo: Metas, Avaliacoes 90/180/360, Matriz 9Box, Reconhecimento e Kudos. Integrado com a remuneracao para decisoes baseadas em dados."
   - Adicionar classe CSS `.performance-module-card` ao PerformanceModuleCard para servir de target

3. **Agentes Smart** (target: `.smart-agents-section`)
   - "4 Assistentes de IA: Juridico Smart, Salary Smart, R&B Smart e PerformAI. Seu time de consultores 24/7."
   - Atualizar de 3 para 4 agentes, incluindo PerformAI

4. **Analytics e Relatorios** (target: `.analytics-section`)
   - "KPIs de remuneracao, People Analytics, Analise Salarial e tendencias em tempo real."

5. **Gestao e Configuracao** (target: `.management-section`)
   - "Funcionarios, cargos, tabelas salariais, beneficios, incentivos ICP/ILP e estrutura organizacional."

6. **Modulos Premium** (target: `.locked-module`)
   - "Modulos com cadeado requerem upgrade. Clique para conhecer os beneficios!"

7. **Pronto para comecar!** (target: `.dashboard-welcome`)
   - "Explore Remuneracao + Desempenho integrados. Sua gestao de pessoas nunca mais sera a mesma!"

### Alteracoes tecnicas

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/dashboard/DashboardTour.tsx` | Reescrever os 6 steps para 7, com textos atualizados incluindo Avaliacao de Desempenho e PerformAI |
| `src/components/dashboard/PerformanceModuleCard.tsx` | Adicionar classe CSS `performance-module-card` ao Card raiz para o tour poder apontar |
