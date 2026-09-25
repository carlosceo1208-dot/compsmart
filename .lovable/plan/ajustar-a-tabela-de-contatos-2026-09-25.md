# Ajustar a tabela de contatos

## Resultado esperado
- **Segmento** passa a ser uma coluna própria na tabela, posicionada entre **Porte** e **Origem**.
- Remover a linha “Segmento: —” que hoje aparece abaixo do nome.
- A coluna **Data** mostra somente `dd/mm/aaaa`, sem horário.
- O arquivo exportado continua com **Segmento** em coluna própria e passa a usar somente a data na coluna **Data**.

## Comportamento em telas menores
- Manter **Segmento** como coluna independente, sem voltar a colocá-lo junto ao nome.
- Permitir rolagem horizontal da tabela quando todas as colunas não couberem, preservando os dados e evitando sobreposição.
- O detalhe lateral continua mostrando Segmento, “Recebido em” e “Último interesse” com data e horário completos, pois esses horários ajudam no acompanhamento.

## Validação
- Conferir a tabela no tamanho mostrado no print e no celular.
- Confirmar que Segmento tem cabeçalho e célula próprios.
- Confirmar que a lista e o CSV exibem somente a data, enquanto o detalhe mantém os horários.
- Verificar que busca, filtros, status e contatos existentes não foram alterados.
