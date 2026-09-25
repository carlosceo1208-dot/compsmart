# Atualizar a página de leads com o Segmento

## Objetivo
Fazer a lista administrativa refletir claramente o novo campo **Segmento** já preenchido no cadastro do diagnóstico.

## Estado confirmado
- O formulário de `/diagnostico` já exige e envia o segmento.
- A lista de contatos já recebe esse campo do banco.
- O segmento já aparece no detalhe lateral do contato e na exportação CSV.
- No quadro principal de `/admin/leads`, mostrado no print, ainda não existe a coluna **Segmento**.

## Alterações
1. Adicionar a coluna **Segmento** na tabela principal, junto de Porte e Origem.
2. Mostrar o segmento informado; contatos antigos ou de formulários que não capturam esse dado continuarão exibindo “—”.
3. Incluir segmento na busca da página, mantendo a busca atual por nome, e-mail e empresa.
4. Ajustar a apresentação da tabela em telas menores para evitar sobreposição; o segmento continuará disponível no detalhe lateral quando a coluna não couber.
5. Manter intactos status, contadores, origens, ordenação, exportação e os contatos existentes — incluindo o contato da Marli.

## Validação
- Confirmar no navegador que um contato de origem **Diagnóstico** mostra o segmento na lista e no detalhe.
- Confirmar que a busca encontra o contato pelo segmento.
- Conferir a página em computador e celular.
- Verificar que o projeto continua sem erros antes de concluir.
