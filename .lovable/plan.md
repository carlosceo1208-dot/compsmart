## Objetivo

Implementar o que falta do prompt do Agente Bem-Estar **sem quebrar nada do que já existe**:

1. Manter o **chat consultivo técnico** atual em `/nr1/agente` exatamente como está.
2. Criar um novo **modo condutor de jornada** (8 momentos: onboarding → screening → feedback → COPSOQ → plano → consentimento ID → acompanhamento), com tom empático, frases curtas e sem jargão clínico.
3. Criar a **tela de check-in semanal das 12 semanas**, com pergunta de humor 1-10, marcação de execução das ações e gráfico de evolução.

COPSOQ permanece com ~40 itens oficiais (decisão confirmada).

---

## Parte 1 — Modo "Condutor de Jornada" (chat empático guiado)

### Rota e UI
- Nova rota `/nr1/jornada` → componente `Nr1JornadaBemEstar.tsx`.
- Card de entrada na home NR-1 ("Iniciar minha jornada de 12 semanas") ao lado do card do agente consultivo já existente.
- UI de chat reaproveitando padrão visual do `Nr1BemEstarAgente.tsx`, mas:
  - Bolhas mais limpas, sem markdown denso.
  - Botões de resposta rápida quando o agente faz uma pergunta de escala (0-3, 0-4, 1-10).
  - Stepper visual mostrando em qual dos 8 momentos o usuário está.

### Edge function
- Nova função `nr1-jornada-agent` (separada da `nr1-bem-estar-agent`), com **system prompt próprio** orientado por:
  - Tom **empático, curto (2-4 frases)**, sem jargão clínico ("se sentir sobrecarregado" no lugar de "estresse crônico").
  - Conduzir os 8 momentos do prompt original, **um por vez**, sem despejar tudo.
  - Carregar contexto do colaborador (nome, cargo, área, tempo de empresa, liderança direta) automaticamente — não perguntar de novo.
  - Reusar o mesmo protocolo de risco crítico (CVV 188, SAMU 192, CAPS, SESMT/EAP) já presente no agente atual.
  - Nas etapas que envolvem screening/COPSOQ/plano, **não duplicar** as telas existentes: o agente faz o convite e dá deep-link para `/nr1/diagnostico/novo` (Quick Screening + COPSOQ-III oficial 40 itens) e `/nr1/planos-acao`.

### Persistência
Novas tabelas:
- `nr1_jornadas` — uma linha por jornada de 12 semanas (`user_id`, `company_id`, `started_at`, `consent_anonimo_at`, `consent_id_at`, `status`, `semana_atual`).
- `nr1_jornada_mensagens` — histórico do chat guiado (`jornada_id`, `role`, `content`, `momento` 1..8).

RLS: usuário vê só as próprias jornadas e mensagens; super-admin vê agregados, nunca conteúdo individual.

---

## Parte 2 — Check-in semanal (12 semanas)

### Rota e UI
- Nova rota `/nr1/acompanhamento` → `Nr1Acompanhamento.tsx`.
- Lista das jornadas ativas do colaborador.
- Para a jornada ativa:
  - Card "Check-in da semana X de 12" com:
    - Slider 1-10 "Como você se sentiu essa semana?"
    - Lista de ações do plano com checkbox "praticou?"
    - Campo livre opcional "algo que queira compartilhar"
  - Gráfico de linha do humor 1-10 ao longo das semanas.
  - Barra de progresso 12 semanas.
  - Botão "Pausar" e "Encerrar agora" (LGPD Art. 18 — sempre visível).

### Persistência
Nova tabela:
- `nr1_checkins_semanais` (`jornada_id`, `semana` 1..12, `humor_1_10`, `acoes_executadas` jsonb, `comentario`, `criado_em`).

RLS: somente o dono escreve/lê; agregados expostos via view para o RH (sem comentário individual).

### Lembrete (opcional, dentro do escopo)
- Cron semanal (`pg_cron` + `pg_net`) que dispara edge function `nr1-checkin-reminder` para enviar email aos colaboradores com jornada ativa que ainda não responderam o check-in da semana corrente.
- Reutiliza infra de email transacional já do projeto (Resend, se disponível). Se não houver, deixar a função pronta mas desativar o cron até que a infra de email esteja configurada — sem bloquear o restante.

---

## Parte 3 — Ajustes pequenos e coerência

- Card "Bem-Estar" da home NR-1 passa a ter **2 botões**:
  - "Conversar com o especialista" (chat consultivo atual)
  - "Iniciar/continuar minha jornada" (modo condutor + acompanhamento)
- Atualizar `mem://features/nr1-module` para registrar a existência da jornada guiada e do check-in semanal.
- **Não** mexer em: `Nr1NovoDiagnostico`, `Nr1Consentimento`, `Nr1PlanosAcao`, `Nr1Biblioteca`, `Nr1Vitalidade` — todos continuam a fonte da verdade dos respectivos passos.

---

## O que **NÃO** está no escopo deste plano

- Refazer o chat consultivo atual (continua igual).
- Trocar o COPSOQ para 14 itens (decisão: manter ~40 oficiais).
- Mudar nada no design system NR-1 (`.nr1-scope`).
- Reescrever o agente do plano de ação (`AssistenteIaPlanoAcaoDialog`) — só será chamado por deep-link.

---

## Detalhes técnicos (resumo para referência)

```text
src/pages/nr1/
  Nr1JornadaBemEstar.tsx       (novo — modo condutor)
  Nr1Acompanhamento.tsx        (novo — check-in 12 semanas)
src/components/nr1/
  JornadaStepper.tsx           (8 momentos)
  CheckinSemanalCard.tsx
  HumorEvolutionChart.tsx
supabase/functions/
  nr1-jornada-agent/index.ts            (novo — system prompt empático curto)
  nr1-checkin-reminder/index.ts         (novo — opcional, cron semanal)
supabase/migrations/<ts>_nr1_jornada.sql
  - nr1_jornadas
  - nr1_jornada_mensagens
  - nr1_checkins_semanais
  - RLS policies + view agregada
```

---

## Resultado esperado

- `/nr1/agente` → continua sendo o chat técnico expert (sem mudanças).
- `/nr1/jornada` → novo agente conversacional empático que conduz os 8 momentos do seu prompt, com deep-links para as telas formais já existentes.
- `/nr1/acompanhamento` → tela onde o colaborador faz seu check-in semanal e vê seu progresso de 12 semanas, com direito explícito a pausar/encerrar a qualquer momento.

Aprovando este plano, eu implemento na sequência: migração → edge function da jornada → telas → integração → cron de lembrete (se a infra de email permitir).