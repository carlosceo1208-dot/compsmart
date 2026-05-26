## Contexto

Analisei 6 concorrentes (Gattaz, PlataformaNR1, NR1Simples, Sólides, StarBem, Flora). Conclusão central:

- **5/6 vendem medo de multa** — território saturado.
- **Todos falam com o analista de SST**, não com o CHRO/decisor.
- **Nenhum cruza NR-1 com 9Box ou Remuneração** — território 100% vazio que é exatamente o diferencial CompSmart.
- **Sólides ganha em logos** (40k clientes), mas NR-1 é apenas um módulo perdido no portfólio.

Sua landing atual (`/nr1`) já tem boa base (diagnóstico express, calculadora de multa, planos), mas hoje vende como "compliance + um pouco de cruzamento". Vamos reposicionar para **"NR-1 Inteligente"** — categoria nova, com o cruzamento como herói, e mantendo o diagnóstico express que captura leads.

---

## Posicionamento aprovado

**Headline:** *"NR-1 fez todo mundo mapear. Só a CompSmart te diz o que fazer com o mapa."*

**Sub:** *Cruzamos risco psicossocial com 9Box e remuneração. Transformamos obrigação legal em inteligência de talentos.*

**Ângulo:** urgência da fiscalização (mai/2026) como **piso**, não como teto. Gancho principal = decisão estratégica de pessoas.

**ICP de comunicação:** CHRO / VP de Pessoas (decisor de budget), com seção técnica secundária para o analista SST.

**Categoria cunhada:** "NR-1 Inteligente" (vs. "NR-1 Tradicional" = todos os concorrentes, sem citar nomes).

---

## Estrutura da nova `/nr1` (ordem das seções)

1. **Header** — logo + "Entrar" + "Diagnóstico grátis" (sticky).
2. **Hero** — headline + sub + 2 CTAs ("Diagnóstico grátis" / "Ver o cruzamento ao vivo") + visual de dashboard mostrando colaborador com risco alto + posição 9Box + faixa salarial.
3. **Faixa de urgência inteligente** — "Fiscalização: mai/2026. Mas os dados que você perde se não integrar agora não voltam."
4. **3 perguntas que só a CompSmart responde** (dor do CHRO):
   - Quem no seu Top Talent está em risco psicossocial elevado agora?
   - Onde a remuneração está criando estresse silencioso?
   - Qual área tem maior correlação entre risco e intenção de saída?
5. **Tabela NR-1 Tradicional vs. NR-1 Inteligente** (substitui a tabela "Consultor vs SaaS vs CompSmart" atual — mais afiada).
6. **Como funciona — 5 passos do cruzamento** (Diagnóstico → 9Box → Remuneração → Dashboard de Inteligência → Plano de ação por ROI).
7. **Calculadora de multa** (mantida, mas reposicionada como "piso de risco" e sem ser o herói).
8. **Diagnóstico express NR-1 grátis** (fluxo atual de questionário + captura de lead + resultado — mantém intacto, é o conversor principal).
9. **Prova social de correlação** — números únicos que só nós conseguimos (rotulados como "dados de pilotos"): "34% do top talent com risco invisível", "2,3x mais identificação antes do desligamento", "1º do Brasil a cruzar NR-1 × 9Box × Remuneração".
10. **Conformidade técnica** (selo para o analista SST): COPSOQ-III, Portaria MTE, PGR, LGPD/anonimato, ISO mindset.
11. **Planos** (mantém os 3 tiers atuais + "Já é cliente Pro/Enterprise? NR-1 Pro está incluso").
12. **FAQ** — 6 perguntas: Quando vence? Qual a multa real? Vale para empresa com menos de X colaboradores? Como funciona o anonimato (LGPD)? Posso usar consultor com a plataforma? Como o cruzamento com 9Box funciona se eu ainda não uso 9Box?
13. **CTA final** — "Diagnóstico grátis · sem cartão · resultado em 2 minutos".
14. **Footer** — links legais, contato, conformidade.

Mantemos o fluxo de 4 steps existente (`landing` → `questionario` → `lead` → `resultado`) — só refatoramos o conteúdo da etapa `landing`.

---

## Detalhes técnicos

- Arquivo principal: `src/pages/public/LandingNr1.tsx` — refator de conteúdo da seção `step === 'landing'`. Lógica de questionário/lead/resultado preservada.
- Componentes auxiliares novos em `src/components/landing/nr1/`:
  - `Nr1Hero.tsx` (headline + visual mockup do cruzamento).
  - `Nr1PerguntasChro.tsx` (3 perguntas).
  - `Nr1TabelaCategoria.tsx` (Tradicional vs Inteligente).
  - `Nr1ComoFunciona.tsx` (5 passos).
  - `Nr1ProvaCorrelacao.tsx` (números de correlação).
  - `Nr1Faq.tsx` (accordion shadcn).
- Mantém escopo `.nr1-scope` (azul `--nr1-primary`, verde sucesso, vermelho crítico) já existente.
- SEO: atualizar `<title>` e `meta description` para a nova narrativa. Adicionar JSON-LD `Product` + `FAQPage` no head da rota via `useEffect` (padrão atual do arquivo).
- Sem mudanças de backend, DB, RLS, edge functions ou pricing — pura landing/copy/visual.
- Rota: continua `/nr1` (não criar `/nr1-psicossocial` agora — concentra autoridade SEO num único endpoint e evita conteúdo duplicado).
- Tracking: o `nr1_leads` já existe e captura origem `landing_nr1` — preservado.

---

## Fora de escopo desta entrega (próximas iterações)

- Lead magnet PDF ("Guia do CHRO para NR-1 Inteligente").
- Página de cases/depoimentos.
- Vídeo demo de 60s do cruzamento.
- A/B test de headline (após termos volume de tráfego).

Vamos seguir? Ao aprovar, eu implemento de uma vez (todos os componentes em paralelo) e te entrego a landing nova pronta para revisar visualmente.
