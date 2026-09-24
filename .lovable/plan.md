# Aplicação das imagens reais nas páginas públicas

## 1. Preparar os arquivos enviados
- Usar exclusivamente as sete imagens anexadas, sem gerar novas imagens.
- Enviar os arquivos para o CDN do projeto com estes nomes:
  - `image-30.png` → `imagem-a-reuniao.png`
  - `image-31.png` → `imagem-b-dashboard.png`
  - `image-32.png` → `imagem-c-clima.png`
  - `image-33.png` → `imagem-d-consultores.png`
  - `image-34.png` → `imagem-e-equipe.png`
  - `image-35.png` → `nr1-mapa.png`
  - `image-36.png` → `nr1-bem-estar.png`
- Reutilizar os retratos reais já vinculados como Carlos, Fernando e Josué, sem trocar a identidade de nenhum sócio.

## 2. Página “Quem Somos”
- No card 1, manter a foto real de Carlos e corrigir o círculo: mesmo diâmetro dos demais, proporção 1:1, `object-fit: cover`, raio de 50%, sem borda visível e sem fundo branco no contêiner.
- Aplicar exatamente o mesmo contêiner circular às fotos de Fernando e Josué.
- Preservar a ordem dos cards: Carlos, Fernando e Josué.
- Substituir a moldura vazia de “Nossa História” pela `imagem-a-reuniao.png`, em 16:9, corte `cover`, cantos de 20px e sombra suave; ao lado do texto no desktop e abaixo no celular.

## 3. Página NR-1
- Hero: reorganizar o conteúdo em duas colunas no desktop, com `imagem-a-reuniao.png` ocupando aproximadamente 45% da largura; no celular, posicioná-la abaixo do texto.
- Mapa de Risco: substituir a ilustração atual por `nr1-mapa.png` e manter a legenda “Visualização ilustrativa do mapa de risco — matriz COPSOQ-III por área.”
- Funcionalidades: usar `nr1-bem-estar.png` nas miniaturas de “Anonimato LGPD” e “Painel de Vitalidade”, com cerca de 160px de altura, e em versão maior no card “Check-Up do Colaborador”.
- Gestão de Terceiros & PGR: adicionar `imagem-d-consultores.png` ao lado do texto no desktop e abaixo no celular, ocupando aproximadamente 40% da largura.
- Faixas por porte: inserir `imagem-a-reuniao.png` como banner acima dos cards, em 16:9, altura aproximada de 280px, sobreposição suave da cor da marca e a legenda “Conformidade com gente — consultores e plataforma juntos no seu processo.”
- Entre o formulário de proposta e o FAQ: criar a faixa com `imagem-e-equipe.png`, cobertura total, sobreposição escura de 60% à esquerda, texto branco “Você não precisa fazer isso sozinho. Diagnóstico, plano de ação e acompanhamento com a CompSmart.” e botão “Diagnóstico grátis NR-1” ligado ao questionário existente.

## 4. Demais páginas públicas
- `/modulos/core`: preencher a moldura com `imagem-b-dashboard.png`.
- `/modulos/clima`: preencher a moldura com `imagem-c-clima.png`.
- `/modulos/rh-service` e `/parceiros`: preencher as molduras com `imagem-d-consultores.png`.
- Home, incluindo o bloco consultivo já reservado: usar `imagem-a-reuniao.png` onde a moldura “Imagem A” existe; no pré-rodapé usar `imagem-e-equipe.png`.
- `/precos`: preencher a moldura final com `imagem-e-equipe.png`.

## 5. Padrão visual e comportamento
- Imagens editoriais em 16:9, `object-fit: cover`, cantos entre 16px e 20px e sombra suave.
- Retratos dos sócios em 1:1 circular, com dimensões idênticas, sem fundo ou borda do contêiner.
- Não adicionar textos sobre as fotos além das legendas e da faixa NR-1 especificadas.
- Preservar textos, preços, formulários, questionário e seletor de tema existentes.

## 6. Conferência
- Validar `/sobre-nos`, `/nr1`, `/modulos/core`, `/modulos/clima`, `/modulos/rh-service`, `/parceiros`, `/` e `/precos` em desktop e celular.
- Conferir enquadramento, ausência de imagens quebradas, uniformidade dos retratos, contraste nos temas claro e escuro e funcionamento do botão do diagnóstico.
- Confirmar a compilação sem erros antes de concluir.

## Detalhes técnicos
- Criar ponteiros `.asset.json` para os sete anexos e importar suas URLs nos componentes públicos correspondentes.
- Atualizar `AboutUs`, `Nr1HeroBento`, `Nr1Novidades`, `Nr1GestaoTerceiros`, `Nr1PublicPricing`, `LandingNr1`, `ModuloPage`, `Parceiros`, `CrossDataSection`, `PreFooterCTA` e `Precos` apenas onde necessário.
- Manter os componentes e tokens visuais existentes; não alterar o backend.
