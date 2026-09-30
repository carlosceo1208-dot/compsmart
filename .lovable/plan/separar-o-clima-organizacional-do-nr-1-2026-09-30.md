# Separar o Clima Organizacional do NR-1

## Diagnóstico (confirmado no código)

- O card "Clima Organizacional" do dashboard (`src/components/dashboard/ModuleGrid.tsx`, linha 272) aponta direto para `/nr1/clima` — não é redirecionamento.
- Não existe rota `/clima` de gestão; só as públicas por token (`/clima/publico/:token`, `/clima-externo/:token`).
- As 7 telas de Clima estão dentro do bloco `<Nr1Layout />` em `src/App.tsx` (linhas 359–367) e por isso herdam o menu lateral do NR-1.
- **Independência confirmada:** nenhuma das 7 telas consome contexto/prop do Nr1Layout. Dependências externas: `respondentHash` (util de `@/lib/nr1`, função pura) e `Nr1FibCard` (FIB de clima, usa `useFibData`, CSV/PDF e componentes próprios — sem dependência de layout). Quebram nada fora do NR-1.

## O que será feito

1. **Novas rotas `/clima/...` dentro do `DashboardLayout`** em `src/App.tsx`:
   - `/clima` → Nr1Clima (trava `clima`)
   - `/clima/:id/responder` → Nr1ClimaResponder
   - `/clima/dashboard` e `/clima/dashboard/:id` → Nr1ClimaDashboard (trava `clima`)
   - `/clima/relatorios` → Nr1ClimaRelatorios (trava `clima`)
   - `/clima/governanca` → Nr1ClimaGovernanca (trava `clima`)
   - `/clima/externo` e `/clima/externo/:id` → Nr1ClimaExternoDashboard (trava `clima`)
   - `/clima/correlacao` → Nr1ClimaCorrelacao (trava `nr1` + `clima`, inalterada)
2. **Redirects preservando parâmetros.** Cada rota antiga `/nr1/clima...` vira `<Navigate>` para o equivalente `/clima/...`, mantendo o `:id` de `responder`, `dashboard/:id` e `externo/:id` (redirecionar por rota parametrizada, não por replace de prefixo). `/nr1/fib-bem-estar` passa a apontar para `/clima`.
3. **Varredura global de referências (critério: zero remanescentes).** Alterar todas as ocorrências de `/nr1/clima` e `/nr1/fib-bem-estar` encontradas:
   - `src/App.tsx` (rotas + redirect `fib-bem-estar`)
   - `src/components/dashboard/ModuleGrid.tsx:272` (card → `/clima`)
   - Links internos das 7 telas (~19 ocorrências: voltar, dashboard analítico, relatórios, governança, clima externo, correlação, responder/preview)
   - `public/robots.txt:34`: `Disallow: /nr1/clima` → `/clima` (novo, com verificação de que a rota antiga some do sitemap/indexação)
   - Confirmação final: `rg "nr1/clima|fib-bem-estar" src/ public/` retorna só os redirects de compatibilidade.
4. **Menu de volta (DashboardLayout).** Adicionar entrada "Clima Organizacional" em `navItems` do menu do cabeçalho, para o usuário saber onde está e voltar sem depender do card do dashboard. As telas já têm botão "Voltar" interno (continua funcionando, apontando para `/clima`).
5. **Manter intactos:** rotas públicas por token, trava `has_module('clima')`, FIB no NR-1, cruzamento NR-1 × Clima (correlação exige os dois módulos).

## Fora de escopo

- Renomear arquivos/componentes `Nr1Clima*` (só rotas e links mudam).
- Nenhuma mudança de backend, banco ou regras de acesso.

## Validação ampliada

- **Deep link antigo digitado direto no navegador** (não pelo card), com e sem `:id`: `/nr1/clima`, `/nr1/clima/dashboard/<id real>`, `/nr1/clima/<id real>/responder`, `/nr1/clima/externo` — todos redirecionam preservando o id e a tela carrega.
- **Independência do módulo:** empresa com só o módulo `clima` contratado (sem `nr1`) usa Clima normalmente — é produto vendável sozinho; correlação continua exigindo os dois.
- **Papéis:** RH de A navega pelas telas principais no layout novo (dashboard, relatórios, governança, externo); colaborador comum vê a trava/sem acesso; empresa sem o módulo `clima` vê a trava; empresa B não vê nada de A.
- **Visual em 1280px e 390px** nas telas principais de Clima no layout novo, incluindo o menu de volta.
- `bun run ci` limpo; dados reais intactos (2 ciclos NR-1, Carlos, Josue, 2 registros da Marli); nenhum dado de teste gravado; nada publicado até sua aprovação.
