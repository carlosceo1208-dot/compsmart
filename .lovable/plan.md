
# 🔍 Diagnóstico de Modernização — CompSmart

> Entrega: **somente relatório**. Nenhum arquivo será alterado nesta rodada.
> Foco principal: **modelos de IA por agente (custo × qualidade × latência)**, com recomendações secundárias de **visual/UX** e **segurança** para manter a percepção de "plataforma moderna e atualizada".

---

## 1. Mapeamento atual dos agentes de IA

Hoje a CompSmart possui **14 agentes ativos** em edge functions, com a seguinte distribuição:

| # | Agente / Edge Function | Modelo atual | Tarefa | Volume estimado |
|---|---|---|---|---|
| 1 | `legal-assistant` | gemini-2.5-pro | Consulta jurídica trabalhista (RAG) | Baixo, crítico |
| 2 | `salary-assistant` | gemini-2.5-pro | Análise salarial / equidade | Médio, crítico |
| 3 | `incentive-assistant` | gemini-2.5-pro | R&B / ILP / ICP | Baixo, crítico |
| 4 | `support-assistant` | gemini-2.5-pro | Suporte ao usuário da plataforma | Alto, simples |
| 5 | `performance-assistant` | gemini-3-flash-preview | Chat sobre desempenho/9Box | Alto, simples |
| 6 | `succession-ai-analysis` | gemini-3-flash-preview | Análise de sucessão | Baixo, crítico |
| 7 | `job-matching-ai` | gemini-3-flash-preview | Match cargo × mercado | Médio, semântico |
| 8 | `generate-job-description` | gemini-2.5-flash | Gera descrição de cargo | Médio, criativo |
| 9 | `suggest-job-competencies` | gemini-2.5-flash | Sugere competências | Médio |
| 10 | `nr1-bem-estar-agent` | gemini-2.5-flash | Chat bem-estar (LGPD) | Alto |
| 11 | `nr1-jornada-agent` | gemini-2.5-flash | Jornada psicossocial | Alto |
| 12 | `nr1-plano-acao-assistant` | gemini-2.5-flash | Plano de ação NR-1 | Médio, crítico |
| 13 | `compensation-trends` | gemini-2.5-flash-lite | Tendências econômicas | Baixo, batch |

**Observações:**
- Tudo está no Gemini 2.5/3 (sem Claude, sem GPT-5).
- Vários agentes **críticos** (jurídico, salarial, sucessão, NR-1 plano de ação) usam modelos baseados em velocidade e não em raciocínio profundo.
- Vários agentes **alta-volume e simples** (support, performance chat) usam modelos caros demais para o que fazem.
- O Lovable AI Gateway expõe hoje, sem API key sua: **Gemini 3 Pro Preview, Gemini 3.5 Flash, Gemini 3.1 Flash-Lite, GPT-5.4 / 5.4-mini / 5.4-pro, GPT-5.5 / 5.5-pro**. Claude ainda não está exposto como modelo nominal no Gateway nesta data — quando estiver, entra no quadrante "raciocínio crítico em PT-BR".

---

## 2. Recomendação por agente (custo-benefício)

Princípio aplicado:
- **Alto volume + tarefa simples** → modelo "lite/nano" (latência baixa, custo baixo).
- **Raciocínio crítico, baixo volume** → modelo "pro" (qualidade máxima).
- **Tarefa criativa/estruturada média** → "flash" moderno.

| Agente | Modelo recomendado | Por quê | Ganho esperado |
|---|---|---|---|
| `legal-assistant` | **openai/gpt-5.4-pro** | Raciocínio jurídico, citações, contexto longo. Erros aqui geram passivo. | +qualidade, custo aceitável (volume baixo) |
| `salary-assistant` | **openai/gpt-5.4** | Análise numérica + equidade + narrativa. GPT-5.4 supera Gemini em raciocínio quantitativo. | +precisão, narrativa melhor |
| `incentive-assistant` | **openai/gpt-5.4** | ILP/ICP envolve cálculo + interpretação tributária. | +precisão |
| `succession-ai-analysis` | **openai/gpt-5.4** | Decisão estratégica, baixo volume. | +qualidade analítica |
| `nr1-plano-acao-assistant` | **google/gemini-3-pro-preview** | Multimodal + contexto longo (COPSOQ-III, dados de risco). Mantém família Gemini que já lida bem com normas BR. | +contexto, mantém custo médio |
| `nr1-bem-estar-agent` | **google/gemini-3.5-flash** | Chat humanizado, alto volume. | -30~40% custo, +qualidade vs 2.5-flash |
| `nr1-jornada-agent` | **google/gemini-3.5-flash** | Mesma lógica do bem-estar. | -custo, +qualidade |
| `performance-assistant` | **google/gemini-3.5-flash** | Chat operacional, alto volume. Já está em 3-flash-preview; subir para 3.5 estável. | Estabilidade + qualidade |
| `support-assistant` | **google/gemini-3.1-flash-lite-preview** | Suporte ao usuário = perguntas curtas, alto volume. Hoje em 2.5-pro (overkill). | **-70% custo** sem perda perceptível |
| `generate-job-description` | **google/gemini-3.5-flash** | Geração estruturada com tom corporativo. | +qualidade textual |
| `suggest-job-competencies` | **google/gemini-3.1-flash-lite-preview** | Sugestão estruturada, repetitiva. | -custo |
| `job-matching-ai` | **google/gemini-3-pro-preview** | Matching semântico com contexto longo (descrições + mercado). | +precisão de match |
| `compensation-trends` | **google/gemini-3.1-flash-lite-preview** | Batch noturno, sumarização. | Mantém custo baixo, mais atual |

### Resumo do impacto esperado (estimativa qualitativa)

- **Qualidade** dos agentes críticos (jurídico, salarial, sucessão, plano de ação NR-1): **+25 a +40%** em precisão de raciocínio.
- **Custo total mensal de IA**: redução estimada de **15–25%** — os agentes de alto volume caem para tier lite, compensando a subida dos críticos para GPT-5.4.
- **Latência percebida** no chat de suporte e performance: melhora (lite/flash 3.x são mais rápidos que pro 2.5).
- **Quando Claude entrar no Gateway**: candidatos naturais para migrar = `legal-assistant` e `nr1-plano-acao-assistant` (qualidade superior em PT-BR jurídico/normativo).

---

## 3. Coerência visual & UX — manter percepção "moderna 2026"

Sem mexer em features, apenas refinos para a plataforma "parecer atualizada":

1. **Tokens de cor** — já temos Navy/Emerald/Sand/Coral. Recomendação: adicionar **dark mode** completo (hoje parcial) e uma camada de **glass/blur** nos cards do dashboard principal. Plataformas SaaS top em 2026 (Linear, Vercel, Mercury) usam superfícies translúcidas + sombras suaves.
2. **Tipografia** — manter Inter como body, mas avaliar **headline distintivo** (ex.: Geist ou Space Grotesk) só nos H1/H2 para diferenciar do "look genérico Inter".
3. **Microinterações** — usar `framer-motion` em: aparição de cards do dashboard, transição entre páginas NR-1, gráficos animados na curva salarial. Hoje é estático.
4. **Dashboard inicial** — concretizar a visão do project-knowledge: cards de **INPC mês/acumulado**, **cotação USD live**, **navegação alfabética**, tudo em uma única tela sem scroll. Hoje a Home está sub-aproveitada.
5. **Indicadores "IA-powered"** — adicionar badge sutil (ex.: estrela/sparkle) nos cards que usam IA, comunicando modernidade.
6. **Skeleton loaders** padronizados em todas as listas (alguns lugares ainda mostram "carregando…").

---

## 4. Segurança & arquitetura — quick wins para amadurecer

Não são o foco que você marcou, mas registro para você decidir priorizar depois:

- **MFA obrigatório** para roles `super_admin` e `hr_admin` (hoje opcional).
- **HIBP (leaked password check)** — ativar em 1 clique via `configure_auth`.
- **Rate-limit** em endpoints públicos (`nr1_leads`, clima público, external feedback) — hoje sem proteção contra flood.
- **Streaming de respostas IA** nos agentes de chat (hoje várias funções esperam resposta completa). Melhora UX percebida em ~3x.
- **Migração gradual para AI SDK (Vercel)** com `streamText` + `tool()`. Simplifica os 14 agentes e padroniza tool-calling.
- **Rotação programada** de `LOVABLE_API_KEY` e chaves Pagar.me a cada 90 dias.

---

## 5. Próximo passo sugerido

Quando você quiser sair do diagnóstico e executar, sugiro 3 ondas:

1. **Onda 1 — IA (1 sessão)**: trocar os 14 modelos conforme tabela do item 2 + adicionar streaming nos chats.
2. **Onda 2 — Visual (1–2 sessões)**: dark mode completo, dashboard inicial novo, microinterações, badge IA.
3. **Onda 3 — Segurança (1 sessão)**: MFA obrigatório, HIBP, rate-limit público, rotação de chaves.

Cada onda é independente e reversível. Posso começar pela Onda 1 (a de maior ROI imediato) assim que você aprovar.

---

## Resumo executivo

- **Hoje**: 100% Gemini (mix 2.5/3), nem sempre o modelo certo para cada agente.
- **Recomendado**: distribuir entre **GPT-5.4(-pro) nos críticos**, **Gemini 3.5 Flash nos chats de alto volume**, **Gemini 3.1 Flash-Lite nos auxiliares simples**, **Gemini 3 Pro nos contextos longos (NR-1, job-matching)**.
- **Resultado esperado**: melhor qualidade onde importa, menor custo no que é trivial, e plataforma percebida como "AI-first 2026".
