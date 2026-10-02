# Remover duplicidade da chamada de maturidade na Home

## Diagnóstico (confirmado no código)
- `src/components/landing/pivot/MaturitySection.tsx` é a seção duplicada: repete a chamada "Descubra o nível de maturidade da sua gestão de pessoas." e o card 5×2 (NIVEIS_ESTRUTURAIS + ESTILOS_GESTAO) logo após `CrossDataSection`.
- `MaturitySection` é usada apenas em `src/pages/Index.tsx` (import na linha 12, render na linha 63). Nenhum outro arquivo a referencia — não há links `#maturidade` em header, footer, hero ou qualquer página (`rg` confirmado em todo `src/`), então remover a seção não quebra âncoras existentes.

## Mudanças
1. **`src/pages/Index.tsx`**
   - Remover o import de `MaturitySection`.
   - Remover a linha `<MaturitySection />` (fica entre `CrossDataSection` e `ModulesGridSection`).
   - Atualizar o comentário de topo (remover "maturidade" do fluxo descrito).
2. **`src/components/landing/pivot/MaturitySection.tsx`** — apagar o arquivo (morto após a remoção; verificador de uso já confirma uso único).
3. **`roadmap.md`** — registrar o item concluído, aguardando publicação.

## Não alterar
- `PivotHero.tsx` (título, subtítulo, card 5×2, CTAs "Diagnóstico gratuito em 2 min" / "Ver demonstração" → /maturidade e dialog).
- `CrossDataSection`, grade de módulos, recrutamento, simulador, materiais, FAQ, header/footer.
- SEO (`seoRoutes.ts`, `index.html`), ids de telemetria, rotas, banco.
- Hero continua a única chamada de maturidade; o botão existente do hero já leva a /maturidade.

## Validação (Playwright, 1280px e 390px)
1. Home: o texto "Descubra o nível de maturidade" aparece exatamente **1×** (no hero); zero ocorrências após a seção "Só a CompSmart cruza".
2. Nenhum bloco com "Maturidade estrutural"/"Estilo de gestão" listando os níveis 5×2 abaixo do cruzamento.
3. CTAs do hero intactos: "Diagnóstico gratuito em 2 min" e "Ver demonstração".
4. Âncoras `#demonstracao` e `#faq` funcionam; simulador em `#precos` marca R$ 1.000 (100 colaboradores × 3 módulos) e R$ 1.250 (× 4 módulos).
5. `bun run ci` limpo, sem imports pendentes.
6. Sem publicação sem aprovação explícita.
