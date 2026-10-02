# Remover duplicidade da chamada de maturidade na Home

## Diagnóstico (confirmado no código)
- `src/components/landing/pivot/MaturitySection.tsx` é a seção duplicada: repete a chamada "Descubra o nível de maturidade da sua gestão de pessoas." e o card 5×2 (NIVEIS_ESTRUTURAIS + ESTILOS_GESTAO) logo após `CrossDataSection`.
- `MaturitySection` é usada apenas em `src/pages/Index.tsx` (import na linha 12, render na linha 63). `rg` no projeto inteiro — incluindo suítes de teste, fixtures e mocks (`*.test.*`, `*.spec.*`) — confirma nenhum outro uso; sobra apenas o build cache `tsconfig.app.tsbuildinfo` (regenerado). Não há links `#maturidade` em header, footer, hero ou qualquer página, então remover a seção não quebra âncoras existentes.

## Checagens extras já confirmadas
- **Constantes 5×2** (`NIVEIS_ESTRUTURAIS`, `ESTILOS_GESTAO`) vivem em `src/lib/maturidade.ts` (config compartilhada). O hero **não** as importa via MaturitySection — o hero não as usa; `Maturidade.tsx` e `MaturitySection.tsx` importam da lib. Apagar o arquivo não quebra nada.
- **Nota dos consultores** ("Nossos consultores usam este diagnóstico…") existe só dentro de MaturitySection; sai junto com a seção. O rodapé do card do hero já cobre a mensagem equivalente; nada é recriado, e a transição hero → Contraponto não fica com promessa pendurada.
- **SEO/sitemap**: `sitemap.xml`, `seoRoutes.ts` e `index.html` referenciam apenas a rota `/maturidade` (intocada) — nenhum link interno aponta para a âncora `#maturidade`.

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
1. Home: o texto "Descubra o nível de maturidade" aparece exatamente **1×** — contagem mirando o H1 do hero, não o rótulo "Maturidade da Gestão de Pessoas"; esse rótulo também deve aparecer uma única vez (contado separadamente).
2. Nenhum bloco com "Maturidade estrutural"/"Estilo de gestão" listando os níveis 5×2 **abaixo da seção do cruzamento** — o seletor delimita o escopo à área abaixo de "Só a CompSmart cruza", de modo que a ocorrência legítima no card do hero não seja marcada como falha.
3. Em 390px, o fluxo Hero → Contraponto é contínuo, sem buraco visual — a remoção só encurta a página.
4. CTAs do hero intactos: "Diagnóstico gratuito em 2 min" e "Ver demonstração".
5. Âncoras `#demonstracao` e `#faq` funcionam; simulador em `#precos` marca R$ 1.000 (100 colaboradores × 3 módulos) e R$ 1.250 (× 4 módulos).
6. `bun run ci` limpo, sem imports pendentes.
7. Sem publicação sem aprovação explícita.

## Sequência de execução
1. Aplicar as mudanças (Index.tsx + deleção do arquivo + roadmap).
2. Validação Playwright em 1280px e 390px, itens 1–5.
3. `bun run ci` limpo.
4. Prévia aberta para revisão final.
5. Publicação somente após aprovação explícita.
