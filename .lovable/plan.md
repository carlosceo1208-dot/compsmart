# Ajustes finos da Home

## Objetivo
Corrigir somente a seção “Resultado não se explica — se mostra”, o botão flutuante de contato e o comportamento responsivo do cabeçalho, sem mudar textos, cores, fontes ou outras seções.

## Alterações
1. **Matriz NR-1**
   - Substituir a truncagem dos títulos das seis dimensões por rótulos com quebra controlada.
   - Reservar altura estável ao cabeçalho da matriz e reduzir apenas o tamanho dos rótulos longos quando necessário, mantendo “Relacionamentos” e “Recompensas” legíveis dentro do card.

2. **Altura uniforme dos quatro dashboards**
   - Fazer a grade 2×2 esticar os itens por linha e cada moldura ocupar toda a altura disponível.
   - Estabelecer dimensões responsivas consistentes para a área interna, evitando degraus entre NR-1, Clima, R&S e Remuneração sem comprimir o conteúdo no celular.

3. **Botão flutuante CONTATO**
   - Preservar o texto e o destino atuais.
   - Ajustar posição com margem segura das bordas e da área inferior do celular.
   - Reduzir a área ocupada no mobile sem perder o nome acessível, para que o botão não encubra o gráfico de Remuneração; manter a versão completa em telas maiores.
   - Manter a camada abaixo do cabeçalho e acima do conteúdo comum.

4. **Gráfico de Remuneração**
   - Reforçar a espessura e o contraste visual das linhas tracejadas P25/P75 associadas à referência de defasagem, preservando os mesmos dados, legenda e cores do sistema.

5. **Cabeçalho responsivo**
   - Manter a navegação completa apenas quando houver largura suficiente.
   - Antecipar o menu hambúrguer para a faixa em que logo, links e “Agendar demonstração” poderiam colidir ou quebrar linha; os mesmos itens continuarão disponíveis dentro do menu.

## Validação
- Conferir visualmente a Home em celular, tablet e desktop, incluindo a matriz, as quatro alturas, o gráfico, o botão flutuante e o cabeçalho nas larguras de transição.
- Verificar ausência de sobreposição e rolagem horizontal indesejada.
- Rodar lint, verificação de tipos, testes, análise de código morto e build completo até todos passarem.

## Fora do escopo
Nenhuma alteração de conteúdo, identidade visual, outras seções, páginas internas, dados, backend, pagamentos ou SEO.
