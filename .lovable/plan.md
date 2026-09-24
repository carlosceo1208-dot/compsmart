# Reposicionamento e substituição das imagens públicas

## 1. Home: imagem contextual no pré-rodapé
- Remover a foto colorida da equipe como bloco isolado logo após o FAQ.
- Manter essa imagem somente integrada à faixa de pré-rodapé/CTA, como fundo 16:9 com overlay para leitura.
- Preservar integralmente os textos, links e botões atuais do CTA.
- Conferir que não reste imagem repetida ou solta no fim da Home.

## 2. NR-1: eliminar redundância no final
- Manter a foto colorida apenas na faixa contextual já existente, com overlay, texto e botão “Diagnóstico grátis NR-1”.
- Garantir uma única ocorrência dessa faixa e nenhuma foto solta após o FAQ ou no fim da página.
- Não alterar formulário, FAQ, preços, textos nem ordem dos cards.

## 3. Quem Somos: nova imagem em “Nossa História”
- Cadastrar a primeira foto enviada (`image-37.png`) como imagem da mesa de consultoria executiva.
- Substituir somente a imagem ao lado de “Nossa História”.
- Preservar o layout atual: aproximadamente 45% da largura ao lado do texto no desktop e abaixo no celular.
- Manter formato 16:9, preenchimento proporcional, cantos de 20px e sombra suave.
- Atualizar apenas o texto alternativo da foto para descrevê-la corretamente; todo o conteúdo visível permanece igual.

## 4. Parceiros: nova imagem contextual
- Cadastrar a segunda foto enviada (`image-38.png`) como imagem de parceria profissional.
- Substituir a imagem atual da seção “Quero ser parceiro” pela nova foto, sem mover ou alterar o formulário.
- Manter formato 16:9, preenchimento proporcional, cantos de 16px e sombra suave.

## 5. Validação e publicação
- Conferir Home, NR-1, Quem Somos e Parceiros em desktop e celular, nos temas claro e escuro.
- Verificar enquadramento, ausência de imagens órfãs/repetidas e manutenção dos textos, preços, formulários e ordem dos cards.
- Confirmar a compilação sem erros e publicar a versão atualizada.

## Detalhes técnicos
- Usar as duas imagens enviadas diretamente no CDN do projeto, sem gerar ou editar imagens por IA.
- Atualizar os ponteiros de imagem e as referências apenas nas páginas/componentes envolvidos.
- Na Home, transformar o bloco separado do `PreFooterCTA` em uma única faixa visual com o conteúdo atual sobreposto.
- Na NR-1, preservar a faixa contextual existente entre o formulário e o FAQ e remover qualquer ocorrência adicional detectada na validação.