# Correção dos Problemas 1 e 2 + relatório completo (sem publicar)

## 1. Corrigir o envio do questionário (Problema 1)
- Na conferência "todas as 40 perguntas respondidas", trocar o comando que o banco não reconhece por uma contagem equivalente. O restante da regra fica igual: é tudo ou nada, o reenvio do mesmo envio é recusado e o link expirado também.

## 2. Remover a nota do ciclo de 1 respondente (Problema 2)
- No ciclo real de 1 respondente, apagar a nota geral (44,48), o nível ("Moderado") e as notas por dimensão. As 40 respostas, o nome, as datas, o status e a contagem de 1 respondente ficam intactos.
- Proteção permanente no banco: qualquer ciclo com menos de 5 respondentes fica sempre sem nota e sem nível, mesmo que alguém tente gravá-los. O recálculo automático já faz isso, e essa proteção cobre gravações por qualquer outro caminho.
- Consequência: esse ciclo passa a aparecer como "dados insuficientes" em vez de "Moderado". O ciclo real de 10 respondentes continua "Moderado" com 49,93.
- Conferir no banco, antes e depois, que as respostas do ciclo continuam as mesmas (contagem e total).

## 3. Histórico e comparação de ciclos não podem quebrar
- Revisar as telas Histórico, Visão Geral, comparação de ciclos, FIB e PGR para ciclos sem nota: mostrar "Dados insuficientes (menos de 5 respostas)", nunca "0", nem erro, nem tela em branco. Ajustar só onde a nota vazia não for tratada.
- Capturas de tela do Histórico e da comparação com o ciclo sem nota, confirmando que a página abre normalmente.

## 4. Relatório completo
Refazer todo o roteiro aprovado, com dados fictícios desfeitos no final:
- Anonimato por grupo: 1 e 3 respostas resultam em "dados insuficientes"; 7 respostas mostram médias.
- Envio integral: parcial recusado, reenvio recusado, expirado recusado, link inválido e link expirado com mensagem clara.
- Acesso: colaborador, consultor sem projeto e visitante.
- Clima/FIB, cruzamentos, card (1280 e 390 px), rotas e relatórios PGR e laudo em PDF e Excel.
- `bun run ci` limpo e comparação final com a foto "antes".

Entrego uma tabela "esperado x obtido" com a evidência de cada item. Se algo falhar, paro e mostro. A publicação continua bloqueada.

## Detalhes técnicos
- Migration: recriar `nr1_submeter_respostas` trocando `jsonb_object_length(p_respostas)` por `(SELECT count(*) FROM jsonb_object_keys(p_respostas))`, e criar um trigger BEFORE INSERT/UPDATE em `nr1_diagnosticos` que zera `score_geral`, `nivel_risco` e `scores_dimensao` quando `total_respondentes < 5`.
- Dados (via run_sql): `UPDATE nr1_diagnosticos SET score_geral=NULL, nivel_risco=NULL, scores_dimensao=NULL WHERE id='34820df9-f9a4-41bd-8cf0-2b92fe59a2bc'`.
- Roteiro de acesso: incluir a chamada de `nr1_resultado_grupo` com o papel "authenticated", para confirmar que a tela consegue chamá-la. Se não conseguir, a permissão entra na mesma migration.
