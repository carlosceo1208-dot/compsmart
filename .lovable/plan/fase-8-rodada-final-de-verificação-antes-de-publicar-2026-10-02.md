# Fase 8 — Rodada final de verificação antes de publicar

## Situação dos dois pontos extras (conferida no código desta fase)

1. **Os botões de status já aparecem só em importações pendentes.** No detalhe, "Marcar como conferido" e "Rejeitar" ficam dentro da condição "status = pendente". Em importações conferidas ou rejeitadas, a tela mostra só o status (e o motivo, se for o caso), e o botão da lista vira "Detalhes".
2. **A data e o autor da conferência são gravados pelo servidor.** A tela envia só o novo status e o motivo. Quando a importação sai de "pendente", o gatilho do banco grava `conferido_por` com o usuário conectado e `conferido_em` com a hora do servidor.
   - **Brecha encontrada:** ainda é possível alterar esses dois campos numa edição que não muda o status (por exemplo, numa importação pendente).
   - **Correção:** o gatilho passa a ignorar qualquer valor desses campos enviado pela tela e mantém o valor anterior, a menos que esteja acontecendo a conferência.

## Etapas

1. **Ajuste no banco:** o gatilho `nr1_importacao_transicao` sempre recupera `conferido_por` e `conferido_em` do registro anterior e só os preenche (usuário conectado e hora do servidor) quando a importação sai de "pendente". Nada mais muda.
2. **Testes no banco**, com uma importação temporária desfeita ao final:
   - tentar gravar `conferido_por` e `conferido_em` falsos numa pendente: os dois continuam vazios;
   - conferir: os dois são preenchidos pelo servidor, com a hora atual, e ignoram valores enviados pela tela;
   - repetir os testes já aprovados: rejeitar sem motivo, reabrir e rejeitar uma conferida.
3. **Validação na tela** (1280px e 390px, com empresa de teste apagada ao final):
   - **pendente:** mostra os dois botões;
   - **conferida e rejeitada:** não mostram nenhum botão de ação, e a rejeitada mostra o motivo;
   - **rejeitar sem motivo:** é bloqueado na janela de rejeição;
   - **filtros e ordenação;**
   - **exportações:** abrir o PDF e a planilha e conferir a nota de método, sem link de arquivo;
   - **link do arquivo:** abre na hora e falha após expirar (teste com validade curta, só no teste);
   - **perfis:** RH vê; outra empresa vê 0; consultor com projeto ativo vê; consultor sem projeto ativo vê 0.
4. **Linha de base ao final:** 25 acessos · 2 auditorias · respostas 440/0/0 · 9 check-ups · 18 logins · 2 leads · Q1 2026 = 49,93.
5. **Fechamento:** `bun run ci` limpo; a regra do gatilho passa a constar no AGENTS.md; criar o dossiê `.lovable/plan/fase-8-dossie-importacoes-2026-10-02.md`. Nada publicado sem sua aprovação.
