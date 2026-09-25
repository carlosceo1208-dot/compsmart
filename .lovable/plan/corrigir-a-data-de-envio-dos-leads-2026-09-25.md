# Corrigir a data de envio dos leads

## Resultado esperado
A coluna **Data** mostrará exclusivamente o dia em que o formulário foi efetivamente enviado. A data será registrada pelo sistema no momento do envio, sem depender do relógio do visitante e sem ser alterada por mudanças de status ou outras ações administrativas.

## Situação confirmada
- A tela usa hoje `created_at` na coluna Data.
- Os registros exibidos na imagem não receberam datas inventadas: Marli tem envios gravados em 25/09/2026 e 24/09/2026; Fernando e José têm envios gravados em 29/05/2026.
- No formulário de diagnóstico, um reenvio do mesmo e-mail atualiza o contato existente, mas preserva o `created_at`. Por isso, `created_at` sozinho não representa sempre o envio mais recente.
- `updated_at` também não deve ser usado como Data, porque pode mudar por ações administrativas.

## Alterações
1. Adicionar aos contatos principais um campo próprio de **data do último envio do formulário**, preenchido pelo relógio do backend.
2. Preservar os registros existentes, preenchendo esse novo campo inicialmente com a data original já gravada em `created_at` — sem trocar datas históricas pela data atual.
3. Em cada novo envio do diagnóstico:
   - contato novo: registrar o instante atual como data de envio;
   - reenvio do mesmo contato: atualizar essa data para o novo instante do envio.
4. Para contatos da página NR-1, continuar usando a data real de criação de cada envio, pois cada submissão gera seu próprio registro.
5. Atualizar a coluna **Data**, a ordenação, o detalhe e a exportação para usarem essa data de envio; exibir somente `dd/mm/aaaa` na lista e no arquivo exportado.
6. Manter “Último interesse” separado apenas se continuar útil, sem permitir que alterações de status mudem a data de envio.

## Validação
- Enviar um novo formulário e confirmar que a Data corresponde ao dia atual em São Paulo.
- Reenviar o diagnóstico com o mesmo e-mail e confirmar que a Data passa para o novo envio e o contato sobe ao topo.
- Alterar apenas o status e confirmar que a Data não muda.
- Conferir lista, detalhe e CSV.
- Remover somente os contatos criados para o teste; não alterar nem apagar Marli, Fernando, José ou outros registros existentes.

## Detalhes técnicos
- Criar `submitted_at timestamptz` em `leads`, com `DEFAULT now()` e backfill por `created_at`.
- Atualizar `submit_diagnostico_lead` para definir `submitted_at = now()` no reenvio.
- Normalizar no painel um campo único de envio: `leads.submitted_at` e `nr1_leads.created_at`.
- Ordenar a lista por esse campo em ordem decrescente.
