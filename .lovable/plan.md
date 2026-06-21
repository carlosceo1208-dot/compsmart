
# Plano: Controle de Acesso por Plano (FeatureLock unificado)

## Decisão técnica
**Estender o `PlanGate` existente** em vez de criar um `FeatureLock` paralelo. Motivos:
- Já existe a infraestrutura (`useFeatureAccess`, `planFeatures.ts`, `featureMap`, `pathToFeatureMap`, override de admin, trial e bloqueio).
- Duplicar criaria duas fontes de verdade — risco de divergência de segurança.
- O `PlanGate` atual já trata o caso "tela inteira". Vamos adicionar um modo **"card"** com blur + cadeado + CTA, que é o comportamento que o seu prompt original (`FeatureLock`) descreve.

## O que será entregue

### 1. `PlanGate` com dois modos
- **`mode="page"`** (default — comportamento atual): substitui o conteúdo por uma tela cheia de upgrade.
- **`mode="card"`** (novo): renderiza os `children` com **blur + overlay de cadeado + CTA**. Usado em mini cards do Dashboard, NR-1, etc. Props opcionais: `blurAmount` (default 6px), `lockOpacity` (default 0.6).
- CTA do overlay tem **dois botões**:
  - **"Fazer upgrade"** → `/settings/my-plan`
  - **"Falar com vendas"** → `mailto:contato@compsmart.ia.br?subject=Interesse no recurso {featureName}&body=...`
- Sem WhatsApp (constraint do projeto).

### 2. Matriz de acesso — adicionar módulo NR-1 ao `featureMap`
NR-1 é híbrido (memória do projeto): standalone "Essencial" + incluído em Pro/Enterprise como "NR-1 Pro". Logo, no `featureMap`:

```ts
// === NR-1 (módulo híbrido) ===
nr1_essencial:        ['nr1_essencial', 'pro', 'enterprise'],  // diagnóstico, planos básicos
nr1_pro:              ['pro', 'enterprise'],                    // inteligência, correlação clima, agentes IA
nr1_clima:            ['nr1_essencial', 'pro', 'enterprise'],
nr1_planos_acao:      ['nr1_essencial', 'pro', 'enterprise'],
nr1_inteligencia:     ['pro', 'enterprise'],
nr1_bem_estar_agent:  ['pro', 'enterprise'],
nr1_jornada_agent:    ['pro', 'enterprise'],
nr1_terceiros:        ['pro', 'enterprise'],
nr1_clima_correlacao: ['pro', 'enterprise'],
```

Isso exige adicionar `'nr1_essencial'` ao tipo `PlanType` e tratá-lo como um plano paralelo (não está na hierarquia starter→enterprise).

### 3. Aplicação nos mini cards do Dashboard
Envolver os cards bloqueados por plano com:
```tsx
<PlanGate mode="card" feature="nr1_essencial" featureName="NR-1">
  <MiniCardNr1 />
</PlanGate>
```
Cards afetados (mapeamento por feature):
- **NR-1** (mini card "Visão Geral NR-1") → `nr1_essencial`
- **Inteligência NR-1 / Bem-estar agent** → `nr1_pro`
- **Budget Burndown, Approval Inbox, Decision Scenarios** → `merit_governance` (já tem, validar)
- **Incentivos / ILP** → `incentive_programs`
- **Pesquisa Salarial Total Cash/Compensation** → `salary_modality_advanced`

### 4. Admins / Super Admins
Mantém comportamento atual: `useFeatureAccess.hasAccess` já retorna `true` para `isAdminOrSuperAdmin`. Logo, vêem tudo sem cadeado.

### 5. Trial
Mantém comportamento atual: durante trial ativo o usuário tem acesso Pro. NR-1 Essencial fica acessível porque está incluso em Pro.

## Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/hooks/useFeatureAccess.ts` | Add `'nr1_essencial'` ao `PlanType`; novas chaves NR-1 no `featureMap`. |
| `src/components/PlanGate.tsx` | Adicionar `mode`, `featureName`, `blurAmount`, `lockOpacity`; renderizar overlay com 2 CTAs no modo card. |
| `src/components/dashboard/...` (mini cards aplicáveis) | Envolver com `<PlanGate mode="card" feature="...">`. |
| `src/components/nr1/Nr1Layout.tsx` | (Opcional) marcar itens NR-1 Pro com lock visual no menu. |

## Fora de escopo (não vou fazer agora)
- Migração de tabela `subscription_plans` para incluir o plano NR-1 Essencial (banco). Hoje a flag virá do `plan_type`; quando você confirmar a criação do plano "nr1_essencial" no banco, eu faço a migração separada.
- Mudança de copy/preços na landing.

## Validação
- Build passa.
- Playwright em `/dashboard` como usuário trial (vê tudo), starter (vê cadeado nos cards Pro), admin (vê tudo).
- Screenshot dos 3 estados.

---

Confirma que posso prosseguir com essa estrutura? Se a matriz NR-1 acima estiver OK, eu já implemento.
