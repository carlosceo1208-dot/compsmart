# Teste do Agente Talent na Triagem (3 fictícios, com limpeza)

## Estado de partida (conferido no banco)
Hoje a vaga de teste tem 2 candidaturas reais, as duas em Triagem e já analisadas:
- Carlos Eduardo Oliveira: nota 72
- Josue Cruz: nota 74

As duas **ficam de fora de tudo**. Não entram em nenhum lote, não são reanalisadas, não são movidas e não são apagadas. Como já têm análise, não contam como pendentes e o botão "Analisar currículos (N)" as ignora.

## Preparação
- Criar 3 candidatos 100% fictícios (Candidato Teste A/B/C, teste.a/b/c@exemplo.com, telefones inventados) na mesma vaga, em Triagem:
  - A: PDF com texto compatível com a vaga
  - B: PDF com texto incompatível
  - C: PDF só com imagem
- Antes de rodar: a contagem esperada no botão é **3**. Se aparecer outro número, paro e mostro.

## Roteiro
- **A) Lote:** confirmação mostra 3; progresso x/3; A recebe nota maior que B; C mostra "Tentar novamente" sem travar; resumo "Concluído: 2 analisados, 0 falharam, 1 sem texto extraível". Carlos (72) e Josue (74) continuam com as mesmas notas.
- **B) Limite de 2:** conferir nos registros do serviço de IA os horários de início e fim de cada chamada e informar o número máximo de chamadas simultâneas observado.
- **C) 429:** simular a resposta 429 só no navegador de teste (a chamada é interceptada, nada é cobrado). Aprova se a fila pausa, aparece o aviso, os itens em análise e os pendentes voltam para "Tentar novamente" e nenhum pedido sai depois da pausa (conferido contando os pedidos).
- **D) Troca de vaga/empresa:** trocar de vaga no meio do lote (a análise em andamento termina e grava, os pendentes não começam); trocar de empresa (nenhum status aparece na outra).
- **E) Permissão:** simulação com desfazimento. Mudar temporariamente o papel e depois a empresa de um usuário de teste, conferir que o botão some e que a chamada direta recebe 403 "Sem permissão para analisar currículos" sem gravar nada, e reverter. Mostro o antes e o depois.

## Limpeza
- Apagar só os 3 fictícios, os PDFs deles e o histórico gerado por eles. Antes, conferir os nomes e IDs por consulta.
- Consulta final: devem restar exatamente Carlos (72) e Josue (74), em Triagem e ativos.

## Entrega
- `bun run ci`; Playwright em 1280 e 390.
- Tabela esperado x obtido, só com o que as ferramentas retornarem. Se algo falhar, paro e mostro antes de corrigir.
- Atualizar roadmap.md. Publicar só se houver correção de código.
