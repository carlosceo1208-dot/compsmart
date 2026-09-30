# Relatório de validação da Fase 5 (NR-1) — sem publicar

Objetivo: rodar cada teste combinado no check e entregar uma tabela "esperado x obtido" com a evidência de cada linha (resultado de consulta, resposta do servidor ou captura de tela). Não haverá nenhuma mudança de código, a menos que um teste falhe. Se algo falhar, eu paro e mostro antes de corrigir.

## Preparação
- Levantar, por consulta, o que existe hoje: ciclos reais do NR-1 (incluindo o de 1 respondente), os 2 diagnósticos reais, Carlos, Josue e o lead da Marli. Guardar essa foto como "antes".
- Dados de teste 100% fictícios (empresa, ciclos, grupos com 1, 3 e 7 respostas), criados só dentro de transações desfeitas no final ou apagados logo depois. Cada exclusão é conferida antes pelos IDs.

## Testes
1. **Anonimato k=5:** grupo com 1 resposta e grupo com 3 → "dados insuficientes"; grupo com 7 → médias. Nenhuma nota individual aparece em nenhum caso. O ciclo real de 1 respondente é conferido só em modo leitura.
2. **Cortes 40/60/80:** testes automáticos nos limites 40/40,01/41, 60/60,01/61, 80/80,01/81, pela regra do app e pela regra do servidor. Os 2 diagnósticos reais continuam "Moderado".
3. **Envio integral:** resposta parcial no navegador não grava nada; envio incompleto direto ao servidor é recusado; o link reaberto começa sem rascunho; reenvio do mesmo envio é recusado.
4. **Acesso:** colaborador sem módulo, consultor sem projeto e visitante veem 0 registros. Link inválido e link expirado mostram uma mensagem clara.
5. **Clima/FIB:** o FIB aparece como bloco dentro do Clima com todas as perguntas (contagem comparada com a original); a aba avulsa não existe mais; a rota antiga redireciona.
6. **Cruzamentos:** não aparecem no NR-1 Essencial; aparecem só com o módulo contratado. O servidor também recusa quando o módulo não foi contratado.
7. **Card:** captura em 1280 e 390 px mostrando os 4 blocos, o Acompanhamento em "Acompanhar", o Plano Essencial em "Preparar", a gaveta com os 7 itens e Biblioteca/Auditoria no rodapé.
8. **Rotas:** /nr1/matriz-risco abre; /nr1/fib e /nr1/fib-bem-estar redirecionam.
9. **Relatórios:** baixar o PGR e o laudo em PDF e em Excel e conferir que os arquivos abrem com conteúdo.
10. **Fechamento:** `bun run ci` limpo; consulta final confirmando que não restou nenhum dado fictício e que Carlos (72), Josue (74), a Marli e os dados reais do NR-1 estão iguais à foto "antes".

## Entrega
- Tabela com uma linha por item acima: esperado, obtido e evidência. Só entra o que as ferramentas realmente retornarem; o que não puder ser testado aparece como "não testado", junto com o motivo.
- Atualizar o roadmap. Publicação continua bloqueada até você aprovar.

## Detalhes técnicos
- k por grupo: `nr1_resultado_agregado` e o agente Psi, chamados com a sessão de cada papel.
- Envio: edge function `nr1-questionario-publico` (resolve/submit) e chamada direta a `nr1_submeter_respostas` como anon/authenticated, que deve ser recusada por permissão.
- Navegador: Playwright com sessão temporária; o anti-robô não afeta essas rotas.
