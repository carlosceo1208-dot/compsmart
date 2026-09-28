# Cards visuais de produto em /modulos/selecao-rs (HTML/CSS, sem imagem)

## Objetivo
Na página `/modulos/selecao-rs`, criar dois elementos visuais de produto como **componentes HTML/CSS** — não como imagem. Os mockups que você enviou servem só de referência de layout; o texto final é 100% correto e editável, com os tokens do site.

## 1. Funil de contratação (seção "O que você passa a acompanhar")
- Componente CSS: 5 etapas em sequência com setas (→) entre elas:
  **Triagem → Entrevista RH → Entrevista Gestor → Proposta → Contratado**
- Cada etapa em card com tom progressivo de azul → teal → verde (tokens do site: #2563EB → #0D9488 → #16A34A)
- Sem números/percentuais por etapa — apenas etapas e setas (decisão de integridade mantida)
- Card compacto, largura ~640px, centralizado, **abaixo do grid de 4 indicadores**; não full-width
- Estrutura acessível: lista ordenada (as etapas são texto real, não imagem)
- No mobile as etapas empilham/setam em coluna, dentro da largura da página

## 2. Listagem de vagas (seção "Como a CompSmart resolve")
Componente CSS simulando o portal /vagas, na largura da página do card compacto:
- Barra de busca "Buscar vagas..." e chips de filtro: **São Paulo – SP, Remoto, Híbrido**
- 3 cards de vaga com título, local e pill de senioridade:
  - um com faixa salarial **"R$ 12.000 – 15.000"** e badge verde **"Faixa salarial fornecida"**
  - outro com badge neutro **"Confidencial"**
- Card de destaque com o número que você definiu (mantido exatamente):
  **"Tempo médio de fechamento: 21 dias"** com badge verde **"− 40%"**
- Texto real (busca desabilitada/aria-hidden como simulação visual), mesmo estilo de card/bordas da página
- No mobile empilha e fica dentro da largura da página

## 3. Sem animação
Nenhuma animação nos dois cards (respeitar `prefers-reduced-motion` e manter a página discreta).

## 4. Validação
- lint, tipos, testes, dead-code e build (`bun run ci`) até passar
- Navegador no preview em 1280px e 390px: os dois cards contidos na largura da página, empilhados no mobile, texto sempre correto, sem corte
- A faixa "Em reconstrução" continua visível nesta página; `/vagas` segue sem ela
