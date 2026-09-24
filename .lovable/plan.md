# Quem Somos + ajustes de header e home

## 1. Página /sobre-nos (reescrita)
Usar o layout público (mesmo header, rodapé e SEO das outras páginas).
- **Abertura:** "QUEM SOMOS", título "Três amigos — J F C. Décadas de estrada. Um propósito em comum." e subtítulo, com o texto exato do documento.
- **Nossa História:** os 3 parágrafos do documento, sem alterações.
- **Os Sócios:** 3 cards (1 coluna no celular, 3 no desktop). Cada card tem um círculo neutro com as iniciais (CE, FC, JC) no lugar da foto, nome, cargo, bio e o botão "Conectar no LinkedIn" (contorno, abre em nova aba). Ordem: Carlos Eduardo, Fernando Curral, Josué Cruz.
- **Missão:** texto de fechamento com a linha final em destaque.
- **Chamada final:** "Agende um diagnóstico gratuito" leva a /contato; o link "Fale com a CompSmart" abre um e-mail para contato@compsmart.ia.br.
- Espaço reservado para a Imagem A (proporção 16:9).

## 2. Header
Ordem: Home, NR-1, Módulos, Preços, Quem Somos, Seja Parceiro, Materiais, Contato, Entrar, Agendar demonstração.
- NR-1: a pílula verde atual ganha um ícone de escudo.
- "Quem Somos": link em negrito leve, que fica azul e sublinhado ao passar o mouse.
- "Parceiros" passa a se chamar "Seja Parceiro" (continua levando a /parceiros), com contorno verde de 2px, ícone de aperto de mão e fundo verde claro ao passar o mouse.
- "Entrar": contorno de 2px na cor do texto.
- "Agendar demonstração": continua como está (azul sólido do site).
- No celular: mesma ordem e mesmos nomes.

## 3. Home: seção "Por que CompSmart?"
- Altura cerca de 40% menor, com menos espaço em cima e embaixo.
- Duas colunas: texto à esquerda e vídeo à direita (50%). No celular, as colunas ficam uma embaixo da outra.

## 4. Espaços para as imagens A a E (sem gerar imagens)
Criar uma moldura 16:9 neutra e discreta em cada local indicado. Nenhuma imagem será gerada por IA; cada moldura será trocada pela imagem real quando você enviar:
- A: home, seção "Só a CompSmart cruza esses dados", e /sobre-nos
- B: /modulos/core
- C: /modulos/clima
- D: /modulos/rh-service e /parceiros
- E: home, acima de "Comece pelo que mais dói hoje", e /precos, no fechamento

## Detalhes técnicos
- Um componente reutilizável para as molduras de imagem, que recebe a imagem quando ela existir e ajusta o corte para manter 16:9.
- As fotos dos sócios ficam prontas para receber as imagens reais, sempre em círculo e na proporção 1:1.
- Arquivos: AboutUs.tsx, PublicHeader.tsx, a seção de vídeo e a seção de diferencial da home, o pré-rodapé, ModuloPage (core, clima, rh-service), Parceiros.tsx e Precos.tsx.
- Verificação: build sem erros e capturas de tela no desktop e no celular.
