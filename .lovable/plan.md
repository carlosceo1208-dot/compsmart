# Cards visuais do Recrutamento & Seleção em /modulos/selecao-rs

## Objetivo
Usar os dois mockups que você enviou (sem gerar imagem nova) na página `/modulos/selecao-rs`:
- **Funil de contratação** → card na seção "O que você passa a acompanhar"
- **Listagem de vagas** → card na seção "Como a CompSmart resolve"

## 1. Preparar as imagens
Nada é criado do zero: as duas telas vêm dos seus anexos e passam só por correção de texto.

**a) Funil — `src/assets/funil-rs.png`**
- Origem: a imagem que você enviou ("Seleção & R&S — Funil de Contratação", sem números)
- Corrigir os dois rótulos que vieram errados, editando apenas essas duas caixas e mantendo cores, layout e o resto da tela intactos:
  - "Entrevilva RH" → **Entrevista RH**
  - "Entreviita Gestor" → **Entrevista Gestor**
- Salvar com 1024×768 (proporção 4:3 exata), para o card não deformar nem pular ao carregar
- Conferir o texto palavra por palavra antes de usar

**b) Listagem de vagas — `src/assets/vagas-rs.png`**
- Origem: a outra imagem que você enviou
- Texto do cartão de destaque, como você definiu: **"Tempo médio de fechamento: 21 dias"** e **" - 40%"**
- Os demais rótulos da tela (filtros e cards de vaga) também vieram embaralhados e serão reescritos corretamente ("São Paulo - SP", "Analista de Remuneração", "Coordenador de RH", faixa "R$ 13.490 - 15.690")
- Se algum rótulo não ficar legível depois da correção, eu mostro a imagem antes de publicar

## 2. Card do funil (seção "O que você passa a acompanhar")
- Card compacto, **largura ~640px, centralizado, abaixo do grid de 4 indicadores** — não full-width
- `<img>` com `width="1024" height="768"` + container com `aspect-ratio 4/3` (sem layout shift)
- `alt="Funil de contratação do Recrutamento & Seleção"`, `loading="lazy"`
- `rounded-2xl`, borda e fundo iguais aos outros cards da página
- Responsivo: no mobile o card empilha e fica dentro da largura da página
- Nenhuma animação (respeitar movimento reduzido)

## 3. Card da listagem (seção "Como a CompSmart resolve")
- Mesmo estilo do card do funil (compacto, centralizado, cantos arredondados, `loading="lazy"`)
- Mantém a proporção própria da tela (mais larga que 4:3) para não cortar a interface
- `alt` descritivo: "Tela de listagem de vagas do Recrutamento & Seleção"
- Se preferir essa tela em outro lugar (por exemplo na abertura), é só dizer

## 4. Validação
- lint, tipos, testes, dead-code e build (`bun run ci`) até passar
- Navegador no preview em 1280px e 390px: os dois cards contidos na largura da página, empilhados no mobile, textos das imagens corretos, sem corte
- A faixa "Em reconstrução" continua aparecendo nesta página; `/vagas` segue sem ela
