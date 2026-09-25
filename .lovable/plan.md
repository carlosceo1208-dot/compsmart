# Corrigir falha da CI — dead-code scan (knip)

## Diagnóstico (confirmado localmente)

`bun run dead-code:ci` reproduz a falha. O knip sai com código 1 quando há qualquer item listado, mesmo os marcados como "warn" no knip.json. A lista completa:

- **21 arquivos não usados** (regra `files: error`): componentes da landing antiga (`src/components/landing/*.tsx`, substituídos pelos de `landing/pivot/`), `landing/nr1/Nr1DiscountSimulator.tsx`, `landing/nr1/Nr1PricingCards.tsx`, `dashboard/SecurityQuickAccessCard.tsx`, `hooks/useNr1Plans.ts`, `hooks/useScrollReveal.ts`, `lib/nr1Pricing.ts`. Verificado: nenhum é importado fora de si mesmo — a Home e /precos usam apenas `landing/pivot/*` e `landing/public/*`.
- **24 exports não usados** em 20 arquivos (ex.: `formatCPF` em normalize.ts, `estimarMultaAnual` em nr1.ts, `getLandingModule`/`WHATSAPP_*` em landingModules.ts).
- **6 tipos exportados não usados** (ex.: `CatalogModule` em useModuleAccess.ts, `Subscription` em nr1.ts).
- **1 export duplicado**: `ViewAsClientToggle` tem named + default export.

## O que será feito

1. **Apagar os 21 arquivos órfãos** (todos confirmados sem importadores).
2. **Remover exports órfãos**: para cada um dos 24 exports e 6 tipos, confirmar com busca que não há uso e remover o export (e o código morto associado quando não tiver efeito colateral). Caso algum item revele uso real ou bug (algo que deveria ser importado), corrigir o uso em vez de remover.
3. **Export duplicado**: manter apenas o export usado pelos importadores de `ViewAsClientToggle`.
4. **Atenção especial a `src/lib/nr1.ts`**: `estimarMultaAnual` e o tipo `Subscription` ficaram órfãos após a saga do diagnóstico — remover só esses; `calcScoreNr1`, `calcRisco`, `respondentHash` etc. continuam em uso e não serão tocados.
5. **Sem mudança de comportamento**: nada de textos, layout ou funcionalidades — apenas remoção de código morto.

## Validação

- Rodar localmente, nesta ordem, até tudo passar: `bun run lint` → `bunx tsgo --noEmit -p tsconfig.app.json` → `bun run test` → `bun run dead-code:ci` (saída limpa) → `bun run build`.
- Com o scan limpo, o job "Lint, typecheck, test, dead-code & build" do GitHub Actions volta a ficar verde e os e-mails de falha param.

## Detalhes técnicos

- Arquivos a apagar: os 21 listados acima.
- Exports a remover: `passwordSchema` (PasswordStrengthIndicator), `useTurnstileReset` (TurnstileWidget), `getLandingModule`/`WHATSAPP_NUMBER`/`WHATSAPP_MESSAGE` (landingModules), `useSlaConfig`/`useUpsertSlaConfig` (useApprovalInbox), `useCheckBudgetCapacity`/`useBudgetLedger` (useBudgetBurndown), `useExternalFeedbackResponsesByEmployee`, `getRequiredPlanForPath`, `useLtipComparisons`, `useEvaluateGovernance`/`useCreateMeritRequest`, `useMeritSuggestion`, `useExcluirMapeamentoTemplate`, `evaluatorTypeLabels`, `readinessOrder`, `useSiteContentSection`, `IDENTIFIER_FIELDS`, `formatCPF`, `listSheets`, `formatInteger`/`convertCurrency`/`formatCurrencyWithOptions`, `estimarMultaAnual`, `baixarPgr`, `getModalityLabel`/`getModalityBadgeClasses`, `clearSignedUrlCache`, `getBrazilDateTime`.
- Tipos a remover: `CatalogModule`, `PerformanceEvaluation`, `CurrencyFormat`, `Subscription`, `LinhaComN`, `DataPoint`.
- Cada remoção é precedida de busca (`rg`) para garantir zero referências; se houver referência, o item fica.
