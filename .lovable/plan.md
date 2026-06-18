
# Passo a passo — Stress test end-to-end NR-1 (CompSmart)

Objetivo: validar a NR-1 do começo ao fim com **1 empresa fictícia + 10 colaboradores fictícios**, gerando dados via SQL (mais barato em créditos) e usando a UI só para o que precisa ser visualmente verificado.

---

## Etapa 0 — Pré-requisitos (você faz, sem custo de créditos)

1. Estar logado na plataforma com seu usuário **super_admin**.
2. Ter o navegador aberto na preview/produção.
3. Decidir o nome da empresa fictícia (ex.: `Empresa Stress Test NR1 Ltda`). Eu já gero o CNPJ válido fictício no seed.

---

## Etapa 1 — Seed da empresa + 10 colaboradores (1 chamada SQL minha)

Eu rodo **um único `supabase--insert`** que cria:

- 1 registro em `organizational_structure` (type=`company`, plano Pro/Enterprise com NR-1 ativo, trial 30 dias, CNPJ fictício válido tipo `12.345.678/0001-95`).
- 1 sede (type=`headquarters`) sob a empresa.
- 10 registros em `profiles` (status=`active`, `employee_number` preenchido, gênero/idade/área variados para popular sociodemográfico) vinculados a `root_company_id` da empresa criada.
- Vínculo de você como `admin` da empresa via `super_admin_active_company` para conseguir navegar.

**O que você faz:** apenas confirmar a migração/insert quando eu pedir. Depois recarregar a página.

---

## Etapa 2 — Ativar a empresa no seu contexto (UI, 30 s)

1. No header, trocar a "Empresa ativa" para `Empresa Stress Test NR1 Ltda`.
2. Confirmar que aparece "10 colaboradores ativos" no dashboard.

---

## Etapa 3 — Stress test NR-1 — fluxo guiado

Vamos cobrir os 6 blocos da NR-1 nesta ordem. Para cada um eu indico **o que é UI (você clica)** e **o que é seed (eu rodo SQL)**.

### 3.1 Consentimento & Universo (UI)
- Abrir `/nr1/consentimento` → aceitar termos LGPD.
- Abrir `/nr1/universo` → conferir que os 10 colaboradores aparecem segmentados.

### 3.2 Diagnóstico inicial (UI + seed)
- UI: `/nr1/novo-diagnostico` → criar 1 diagnóstico ("Diagnóstico Q1 2026").
- Seed (eu): inserir respostas de diagnóstico simuladas para os 10 (variando risco baixo/médio/alto) em `nr1_diagnostico_respostas`.
- UI: `/nr1/diagnosticos` → abrir o detalhe e validar os gráficos.

### 3.3 Pesquisa de Clima COPSOQ-III (UI + seed grande)
- UI: `/nr1/clima` → criar 1 pesquisa "Clima COPSOQ Q1 2026" (anônima, COPSOQ-III completo).
- Seed (eu): inserir 10 `clima_respostas` + ~40 itens por resposta em `clima_respostas_itens` com distribuição realista (mix de favorável/neutro/desfavorável para gerar alertas).
- UI: `/nr1/clima/dashboard` → validar dimensões COPSOQ, eNPS, alertas.
- UI: `/nr1/clima/relatorios` → exportar PDF (testa `climaReport.ts`).
- UI: `/nr1/clima/correlacao` → ver correlação clima × COPSOQ.

### 3.4 Importação de matriz de risco / metodologia (UI)
- `/nr1` → abrir o `Nr1ImportarMatrizDialog`, testar:
  - Card "COPSOQ-III" (caminho padrão).
  - Card "Outra metodologia" (a frase que adicionamos antes precisa aparecer).
- Confirmar que o template salvo aparece em `nr1_mapeamentos_templates`.

### 3.5 Planos de ação + Governança (UI + seed)
- Seed (eu): inserir 3 `nr1_planos_acao` (1 baixo, 1 médio, 1 alto risco) com responsáveis = colaboradores fictícios.
- UI: `/nr1/planos-acao` → aprovar 1, rejeitar 1, deixar 1 pendente (testa `nr1_planos_aprovacao_historico`).
- UI: `/nr1/clima/governanca` → validar histórico.

### 3.6 Inteligência / Acompanhamento / FIB / Vitalidade (UI – smoke)
- Abrir em sequência (cada um <30 s): `/nr1/inteligencia`, `/nr1/acompanhamento`, `/nr1/fib`, `/nr1/vitalidade`, `/nr1/seg-psi`, `/nr1/sociodemografico`, `/nr1/bem-estar-agente`, `/nr1/jornada-bem-estar`, `/nr1/etapas`.
- Para cada um você me diz: "OK" ou cola o erro (console/tela). Eu corrijo só os que falharem.

### 3.7 Páginas públicas (sem login, anônimo)
- Abrir `/clima-publico/<token>` (eu gero o token no seed) em **janela anônima** → responder 1 vez para validar o fluxo público.
- Abrir `/clima-externo-publico/<token>` (idem).
- Abrir `/nr1-landing` → validar lead capture.

---

## Etapa 4 — Validação final (1 chamada SQL minha)

Eu rodo **1 `supabase--read_query`** que retorna um resumo:

- Nº de respostas de clima, diagnóstico, planos, alertas, exports.
- Distribuição de risco COPSOQ.
- Confirmação de que todos os RLS continuam isolando a empresa fictícia (nenhum dado vazou para outras empresas).

Você me envia o print final ou um "OK" e encerramos.

---

## Etapa 5 — Cleanup (opcional, 1 chamada SQL)

Quando terminar, eu rodo **1 `supabase--insert`** com `DELETE` em cascata para apagar tudo (empresa + perfis + respostas) e devolver seu workspace limpo.

---

## Custo estimado de créditos

| Bloco | Chamadas LLM |
|---|---|
| Seed inicial (empresa + 10 colaboradores) | 1 |
| Seed diagnóstico | 1 |
| Seed clima COPSOQ (10 × 40 itens) | 1 |
| Seed planos de ação | 1 |
| Query de validação final | 1 |
| Cleanup | 1 |
| **Total estimado** | **~6 chamadas SQL** + correções pontuais se algo quebrar |

Tudo o que for *abrir página e ver se renderiza* é feito **por você** na UI, sem custo de créditos meu.

---

## Detalhes técnicos (referência)

- CNPJ fictício é gerado com dígitos verificadores válidos pelo algoritmo da Receita — passa em `src/lib/cnpj.ts`.
- O onboarding (`src/pages/Onboarding.tsx`) é **pulado** porque criamos a empresa direto no banco com `subscription_status='trial'` e `selected_modules=['Core','Insight','Match']` + flag NR-1.
- Respostas COPSOQ seguem a estrutura de `src/lib/climaQuestoes.ts` (dimensões + Likert 1–5).
- RLS é validada lendo dados como a empresa fictícia e como outra empresa qualquer — se nenhuma cross-leak, passa.

---

## Próximo passo

Se aprovar este plano, ao mudar para build mode eu já disparo a **Etapa 1 (seed inicial)** e te aviso para confirmar antes de partir pra UI.
