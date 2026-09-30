# Separar o Clima Organizacional do NR-1

## Diagnóstico (confirmado no código)

- O card "Clima Organizacional" do dashboard (`src/components/dashboard/ModuleGrid.tsx`, linha 272) aponta direto para `/nr1/clima` — não é redirecionamento.
- Não existe rota `/clima` de gestão; só as públicas por token (`/clima/publico/:token`, `/clima-externo/:token`).
- Todas as 7 telas de Clima (`Nr1Clima`, `Nr1ClimaDashboard`, `Nr1ClimaRelatorios`, `Nr1ClimaGovernanca`, `Nr1ClimaExternoDashboard`, `Nr1ClimaCorrelacao`, `Nr1ClimaResponder`) estão dentro do bloco `<Nr1Layout />` em `src/App.tsx` (linhas 359–367), por isso herdam o menu lateral do NR-1.
- O menu do NR-1 (`Nr1Layout.tsx`) não tem itens de Clima; as telas só herdam o layout pela rota.
- A trava é do módulo `clima` (correta); a correlação exige `nr1` + `clima` juntos (correto, manter).

## O que será feito

1. **Novas rotas `/clima/...` dentro do `DashboardLayout`** (mesmo layout dos módulos Recrutamento e T&D), em `src/App.tsx`:
   - `/clima` → Nr1Clima (trava `clima`)
   - `/clima/:id/responder` → Nr1ClimaResponder
   - `/clima/dashboard` e `/clima/dashboard/:id` → Nr1ClimaDashboard (trava `clima`)
   - `/clima/relatorios` → Nr1ClimaRelatorios (trava `clima`)
   - `/clima/governanca` → Nr1ClimaGovernanca (trava `clima`)
   - `/clima/externo` e `/clima/externo/:id` → Nr1ClimaExternoDashboard (trava `clima`)
   - `/clima/correlacao` → Nr1ClimaCorrelacao (trava `nr1` + `clima`, inalterada)
2. **Redirecionamentos permanentes** das URLs antigas: cada `/nr1/clima...` vira `<Navigate>` para o equivalente `/clima...` (links antigos e favoritos continuam funcionando). O redirect `/nr1/fib-bem-estar` passa a apontar para `/clima`.
3. **Card do dashboard**: `ModuleGrid.tsx` linha 272, `path: '/nr1/clima'` → `'/clima'`.
4. **Links internos das 7 telas**: trocar `to="/nr1/clima..."` por `to="/clima..."` (12 ocorrências: voltar, dashboard analítico, relatórios, governança, clima externo, correlação).
5. **Manter intactos**: rotas públicas por token, trava `has_module('clima')`, FIB no NR-1, cruzamento NR-1 × Clima (correlação continua exigindo os dois módulos).

## Fora de escopo

- Renomear arquivos/componentes `Nr1Clima*` (só rotas e links mudam; renomear arquivos pode vir depois, se desejado).
- Nenhuma mudança de backend, banco ou regras de acesso.

## Validação

- Abrir como RH de A: card do dashboard → `/clima` carrega com o layout padrão (sem menu do NR-1); navegar por dashboard analítico, relatórios, governança, externo e correlação; URL antiga `/nr1/clima` redireciona; empresa sem o módulo `clima` continua vendo a trava.
- `bun run ci` limpo; dados reais intactos; nada publicado até sua aprovação.
