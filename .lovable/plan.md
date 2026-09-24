# Humanização da página NR-1 com imagens reais

## Objetivo
Integrar as cinco imagens fornecidas à página `/nr1`, preservando os textos e funcionalidades atuais e trazendo mais presença humana à apresentação do produto.

## Aplicação das imagens
1. **Imagem A — abertura da página**
   - Transformar a abertura em duas colunas no desktop: texto à esquerda e imagem à direita, com aproximadamente 45% da largura.
   - No celular, posicionar a imagem abaixo do texto e do botão.
   - Usar enquadramento 16:9, corte proporcional, cantos de 16px e sombra suave.

2. **NR1-MAPA — Mapa de Risco Psicossocial**
   - Substituir a visualização abstrata atual pela imagem do profissional analisando o heatmap.
   - Manter proporção 16:9 e inserir a legenda exata: “Visualização ilustrativa do mapa de risco — matriz COPSOQ-III por área.”

3. **NR1-BEM-ESTAR — funcionalidades**
   - Substituir os ícones dos cards “Anonimato LGPD” e “Painel de Vitalidade” por miniaturas 16:9 de aproximadamente 160px de altura.
   - Usar a mesma imagem em destaque maior no card “Check-Up do Colaborador”, sem alterar os textos já existentes.

4. **Imagem D — Gestão de Terceiros & PGR**
   - Reorganizar a abertura da seção em duas colunas, com a imagem ocupando aproximadamente 40% da largura.
   - No celular, posicionar a imagem abaixo do texto.
   - Preservar os recursos e avisos já existentes abaixo dessa abertura.

5. **Imagem A — Faixas por porte**
   - Inserir antes dos cards de faixas um banner de largura total, 16:9, com altura visual de aproximadamente 280px no desktop.
   - Aplicar sobreposição suave na cor da marca e a legenda exata: “Conformidade com gente — consultores e plataforma juntos no seu processo.”

6. **Imagem E — faixa entre formulário e FAQ**
   - Inserir a faixa entre os dois blocos já existentes, usando a imagem como fundo com cobertura total.
   - Aplicar sobreposição escura de 60% à esquerda para garantir leitura.
   - Exibir somente o texto aprovado: “Você não precisa fazer isso sozinho. Diagnóstico, plano de ação e acompanhamento com a CompSmart.”
   - Incluir o botão “Diagnóstico grátis NR-1”, conectado ao questionário atual.

## Consistência visual e adaptação
- Padronizar cards e imagens afetados com cantos de 16px e sombra suave.
- Garantir proporção 16:9 e `object-fit: cover` nas cinco aplicações.
- Preservar o seletor por ícones de fundo normal/escuro e conferir contraste das imagens, legendas e sobreposições nos dois temas.
- Não gerar imagens, não acrescentar textos sobre as fotos e não alterar preços, formulário, questionário ou regras de negócio.

## Tratamento dos arquivos
- Usar exatamente os arquivos enviados: Imagem A, NR1-MAPA, NR1-BEM-ESTAR, Imagem D e Imagem E.
- Armazená-los como recursos CDN do projeto, sem manter os binários pesados no código.
- A execução começará quando os cinco arquivos de imagem estiverem anexados; o upload atual contém apenas o documento de mapeamento.

## Validação
- Conferir a página completa em desktop e celular, nos fundos normal e escuro.
- Verificar enquadramento, legibilidade, ordem dos blocos e ausência de sobreposição ou cortes inadequados.
- Testar os dois botões de diagnóstico e confirmar que abrem o mesmo questionário atual.
- Confirmar carregamento das imagens, ausência de erros visuais e compilação válida.
