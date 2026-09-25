# Incluir os contatos da NR-1 no painel de leads (somente leitura)

## O que já existe
- A lista separada da NR-1 tem hoje 2 contatos: 1 de "Diagnóstico" (landing_nr1) e 1 de "Proposta" (landing_nr1_proposta). Os dois são preservados.
- O Super Admin já tem permissão para ler essa lista. Nenhuma mudança no banco é necessária.
- Essa lista não tem campo de status. Os contatos dela aparecem como "Novo" e não podem ser editados.

## O que muda
1. **/admin/leads mostra os dois funis juntos**, ordenados pelo mais recente. As origens aparecem como "NR-1 Landing" e "NR-1 Proposta" e entram no filtro de origem.
2. **Contadores do topo**: os contatos da NR-1 entram no contador "Novo". O total inclui os dois funis.
3. **Detalhe**: mostra nome, e-mail, empresa, cargo, telefone, tamanho da empresa, pontuação e nível de risco, respostas (quando existirem), UTM (origem/mídia/campanha), a data de recebimento e o aviso "Somente leitura — contato da página NR-1". O seletor de status fica desativado. "Responder por e-mail" continua disponível, mas não muda nenhum status.
4. **Sino, botão do topo, menu do avatar e cartão do Painel**: passam a somar também os contatos da NR-1 recebidos depois da última visita a /admin/leads. Ao abrir a tela, os avisos continuam zerando.
5. **Sem duplicação nem fusão**: se o mesmo e-mail estiver nas duas listas, os dois registros aparecem, cada um com sua origem.
6. **Exportar CSV** inclui os dois funis, com as mesmas colunas.
7. Os formulários da /nr1, os textos e o layout das outras páginas não mudam.

## Validação
- Enviar um teste pelo formulário "Diagnóstico" e outro pelo "Solicite uma proposta personalizada" da /nr1.
- Conferir que os dois aparecem em /admin/leads com a origem certa, no contador e no sino. Conferir também que o seletor de status fica bloqueado.
- Conferir que os leads do /diagnostico continuam aparecendo normalmente.
- Apagar só os dois testes. Os 2 contatos que já existem na NR-1 e o da Marli não são tocados.

## Detalhes técnicos
- `useAdminLeads`: faz duas consultas em paralelo (`leads` e `nr1_leads`, limite de 1000 cada). Os registros da NR-1 são normalizados para o formato de lead, com `source: "nr1"`, `status: "novo"`, `updated_at = created_at`, `porte = tamanho_empresa` e os campos extras. Depois junta tudo e ordena por `updated_at` desc. A chave do React é `${source}-${id}`.
- `ORIGEM_LABEL`: adiciona `landing_nr1 → "NR-1 Landing"` e `landing_nr1_proposta → "NR-1 Proposta"`.
- `Leads.tsx`: para `source === "nr1"`, o Select de status fica `disabled` e o `reply` não chama a mutation. Aparecem os campos telefone e UTM.
- `useNewLeadsCount`: soma `count` de `nr1_leads` com `created_at > lastSeen` e se inscreve também no realtime de `nr1_leads`, sem nenhum filtro de status.
- AGENTS.md: registrar que /admin/leads junta `leads` + `nr1_leads` (NR-1 somente leitura).
