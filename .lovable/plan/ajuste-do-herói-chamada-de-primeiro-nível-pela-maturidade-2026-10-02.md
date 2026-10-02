# Ajuste do herói — chamada de primeiro nível pela maturidade

Mudança apenas de copy/SEO. Nenhum código, banco, formulário ou fluxo é alterado além do texto.

## 1. Herói (src/components/landing/pivot/PivotHero.tsx)
- **Título:** "Descubra o nível de maturidade da sua gestão de pessoas."
- **Subtítulo:** "Responda a uma rápida avaliação prévia e veja onde sua gestão de pessoas está hoje. Na avaliação completa, a CompSmart mostra o caminho para transformar pessoas em vantagem competitiva — com dados, IA e consultoria sob demanda."
- Sem promessa de cruzamento percebido × real (a /maturidade ainda não entrega isso).

## 2. O que permanece intocado
- CTAs: "Diagnóstico gratuito em 2 min" (formulário, origem `diagnostico-home`, redireciona para /maturidade após envio) e "Ver demonstração" (rola até o vídeo).
- Selo NR-1 no topo e faixa global "Estamos reconstruindo a CompSmart…" acima do menu — exatamente como estão.
- Simulador, materiais, formulários, banco, rotas, âncoras e ids de telemetria: nenhuma alteração.
- Demais seções da Home e SEO das outras rotas: sem mudança.

## 3. SEO da rota / (src/config/seoRoutes.ts)
- **Título:** manter "CompSmart — O RH que constrói o futuro com dados".
- **Description:** "Descubra o nível de maturidade da sua gestão de pessoas. Avaliação prévia rápida e caminho completo com dados, IA e consultoria sob demanda."

## 4. Validação
- Verificar no `<head>` real da Home o título e a description novos (sem duplicação de meta description).
- Prévia em 1280px: hierarquia título → subtítulo → CTAs intacta.
- Prévia em 390px: subtítulo longo quebra bem, sem virar bloco pesado; hierarquia título → subtítulo → botões preservada; redução do corpo por classe responsiva com contraste legível (cor de texto secundária).
- Ler o subtítulo renderizado na prévia: "Na avaliação completa, a CompSmart mostra o caminho…" é o limite — nada de cruzamento percebido × real ou cálculo do estilo de gestão na copy renderizada.
- Meta title permanece "CompSmart — O RH que constrói o futuro com dados" (decisão do CEO; o Google e o H1 não precisam usar a mesma palavra-chave).
- CTAs funcionam como hoje; simulador 100×3 = R$ 1.000 e 100×4 = R$ 1.250 continuam batendo (regressão rápida).

## 5. Publicação
- Nada publicado sem aprovação explícita do CEO. Após aprovação: publicar, conferir 1280/390 no domínio e rodar o security scan (só o aviso informativo de cbo_codes é esperado).

## Fora de escopo
- Qualquer mudança em backend, pagamentos, checkout, validadores, rotas ou telas internas.
