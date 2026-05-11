## Módulo NR-1 — Saúde, Bem-Estar & Performance

Construção em 3 sprints, modelo comercial **Híbrido** (standalone + add-on/embutido) com landing pública de captura.

---

### Sprint 1 — Fundação + Diagnóstico + Landing/Isca (esta entrega)

**Backend (Lovable Cloud)**
- Tabelas:
  - `nr1_subscriptions` (company_id, plan_tier: essencial/pro, status, trial_ends_at, mrr)
  - `nr1_questoes` (banco global de perguntas COPSOQ-III adaptado, dimensão, peso)
  - `nr1_diagnosticos` (company_id, ciclo, score_geral, nivel_risco, status, periodo)
  - `nr1_diagnostico_respostas` (LGPD: anônimas, agregadas por dimensão)
  - `nr1_leads` (capturas da landing pública: nome, email, empresa, tamanho, score_free)
- RLS isolada por `company_id` via `has_company_access()`; `nr1_subscriptions` visível só para admin/hr_manager; `nr1_leads` insert público + leitura só super_admin
- Seed: ~40 perguntas COPSOQ adaptadas (PT-BR) + 1 questionário curto (10 perguntas) para diagnóstico free

**Frontend autenticado (`/nr1`)**
- Layout com escopo CSS `.nr1-scope` (cores: azul saúde #007BFF, verde #28A745, vermelho #DC3545)
- `/nr1` — Dashboard: card de assinatura, último diagnóstico, score, alertas básicos
- `/nr1/diagnostico/novo` — Wizard de aplicação do questionário
- `/nr1/diagnosticos` — Lista de ciclos com score e nível de risco
- `/nr1/diagnostico/:id` — Relatório detalhado por dimensão + export PDF (jsPDF)
- `/nr1/contratar` — Página de upgrade interna (mostra Essencial vs Pro embutido)

**Frontend público (isca)**
- `/nr1` (rota pública, fora do app autenticado) — Landing com:
  - Headline: "NR-1 obrigatória em 2026. Sua empresa está pronta?"
  - **Calculadora de multa**: input nº colaboradores → estima exposição (usa tabela do MTE)
  - **Diagnóstico free** de 10 perguntas (sem login) → grava em `nr1_leads` → mostra score e CTA "Ver plano completo"
  - Comparativo: Consultor vs SaaS genérico vs CompSmart
  - 3 planos visíveis (R$ 349 / R$ 649 / R$ 1.190)
- `/nr1/obrigado` — pós-lead com proposta de demo

**Pricing & catálogo**
- Adicionar plano `nr1_essencial` em `planFeatures.ts` e `Pricing.tsx` (seção separada "Add-ons")
- Embutir badge "✅ NR-1 Pro incluso" nos planos Pro e Enterprise existentes
- Atualizar `useFeatureAccess` para liberar `nr1.full` aos planos Pro/Enterprise; `nr1.essencial` para quem assina o standalone

**Critérios de aceitação Sprint 1**
- Visitante anônimo consegue calcular multa + responder diagnóstico free + virar lead
- RH autenticado consegue rodar diagnóstico completo, ver score por dimensão, exportar PDF
- Admin consegue ver assinatura NR-1 da empresa
- Pricing exibe NR-1 Essencial como produto separado e NR-1 Pro como bônus dos planos altos

---

### Sprint 2 — Plano de Ação + Treinamentos (próxima request)
- `nr1_planos_acao` + Kanban + evidências em storage `nr1-evidencias`
- `nr1_treinamentos` (embed YouTube/Vimeo) + quizzes + certificados PDF em `nr1-certificados`
- Notificações in-app de prazos

### Sprint 3 — Inteligência + Cruzamento (diferencial competitivo)
- `nr1_alertas` + triggers SQL + realtime
- Edge function `nr1-check-compliance` (cron)
- **Dashboard de cruzamento**: NR-1 risk × 9Box × eNPS × remuneração → identifica "talento alto + risco psicossocial alto + sub-remunerado" (a killer feature)
- Edge function `nr1-billing` (cobrança standalone) — Stripe a definir

---

### Considerações técnicas
- Stack atual mantida: React + Vite + Lovable Cloud (sem Next.js/Vercel)
- Reutiliza `CompanyContext` (`activeCompanyId`) e RLS existente
- Vídeos por embed URL (sem hosting próprio)
- Respostas individuais armazenadas com `respondent_hash` (LGPD: não-identificável após agregação)
- Memória do projeto será atualizada para remover restrição "No NR-1 compliance"

### Fora do escopo (intencional)
- Assinatura digital ICP-Brasil
- Integração eSocial / SST oficial
- Módulo médico (atestados, ASOs)
- App mobile dedicado (responsivo no web já cobre)

---

**Após aprovação:** começo pelo Sprint 1 (fundação + diagnóstico + landing pública com isca). Sprints 2 e 3 viram requests separadas para você validar visualmente cada etapa antes de avançar.