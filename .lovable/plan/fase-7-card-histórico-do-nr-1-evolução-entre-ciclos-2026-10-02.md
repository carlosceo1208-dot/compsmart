# Fase 7 — Card Histórico do NR-1 (evolução entre ciclos)

Reaproveita o que já existe. Nenhuma regra de acesso, função do servidor ou RLS é alterada.

## O que muda para o cliente
- **Página Histórico de Diagnósticos** (`/nr1/diagnosticos`, já ligada ao card "Histórico" do menu):
  - cada ciclo mostra nome, período, respondentes e selo (nota de saúde);
  - ações em cada ciclo: ver detalhe, renomear, excluir e plano de ação;
  - se ainda não houver ciclo, aparece o convite "Novo ciclo".
- **Filtro por período** (início e fim) na lista.
- **Comparar ciclos** na mesma página:
  - escolhe-se o Ciclo A e o Ciclo B entre os ciclos concluídos;
  - a tabela compara nota de saúde, respondentes e cada dimensão, com a diferença e a tendência.
- **Exportação PDF e planilha da lista:**
  - no topo: mínimo de 5 pessoas, período filtrado e "Nota de saúde = 100 − risco psicossocial";
  - sem nomes; ciclo com menos de 5 respostas sai como "Dados insuficientes".
- **Visão Geral:** o comparador sai daqui. Fica só o card de ciclos, com "Ver histórico completo" e "Novo ciclo".
- Selo único e rodapé com a conversão em toda a página.

## D2 — direção da comparação corrigida
Hoje a comparação usa a nota de risco bruta, em que maior é pior, e chama de "Evolução positiva" uma subida acima de 0,5. Está invertido. Passa a usar a nota de saúde:
- **Evolução positiva:** a nota de saúde sobe 0,5 ponto ou mais. Aparece em verde, com seta para cima.
- **Piora:** a nota de saúde cai 0,5 ponto ou mais. Aparece em laranja ou vermelho, com seta para baixo e o texto "Reavalie o plano de ação e identifique novas causas raiz…".
- **Estável:** a diferença fica dentro de ±0,5 ponto. Aparece em cor neutra.
- **Dimensões:** cada dimensão também é convertida para nota de saúde. Subir passa a ser sempre bom, em todas as linhas.

## D3 — mínimo de 5 pessoas
- Ciclo com menos de 5 respondentes mostra a contagem e "Dados insuficientes", sem nota e sem selo.
- Ciclo com menos de 5 aparece na lista de escolha como "não comparável" e não pode ser selecionado.
- A lista continua com as regras de acesso que já existem e o tratamento na tela. Nenhuma função nova.

## Validação (empresa de teste apagada no final, 1280px e 390px)
- **Acesso:**
  - RH de empresa com NR-1 vê os próprios ciclos;
  - empresa sem NR-1 e outra empresa veem 0 linhas.
- **Mínimo de 5:**
  - ciclo com 5 respondentes mostra nota e selo;
  - ciclo com 4 mostra só a contagem e "Dados insuficientes".
- **Comparação:**
  - nota de saúde que sobe aparece como evolução, com seta para cima;
  - nota que cai aparece como piora, com seta para baixo;
  - ciclo com menos de 5 aparece como não comparável.
- **Filtro e exportação:**
  - o filtro por período funciona;
  - PDF e planilha abertos e conferidos: cabeçalho de método presente, sem nomes, ciclo com menos de 5 sem nota.
- **Visão Geral:** o comparador não aparece mais lá.
- **Contagens e fechamento:**
  - contagens voltam à linha de base: 4 acessos, 2 auditorias, respostas 440/0/0, 9 check-ups, 18 logins, 2 leads, Q1 2026 = 49,93;
  - a verificação completa de código passa limpa;
  - AGENTS.md, roadmap e dossiê atualizados, com o registro "inversão corrigida (D2): nota de saúde subindo = evolução".
- Nada publicado sem a sua aprovação explícita.

## Refinamentos incorporados
- **Seletores:**
  - rótulos "Ciclo base (A)" e "Ciclo comparado (B)", com os ciclos listados do mais recente para o mais antigo;
  - por padrão, A é o ciclo anterior e B é o mais recente;
  - o ciclo já escolhido num seletor fica desabilitado no outro, então não dá para comparar um ciclo com ele mesmo.
- **Tabela comparativa no celular:** rolagem lateral em 390px, como nas outras telas.
- **Símbolos do PDF:** o PDF do Histórico usa a fonte DejaVu Sans, para "≥" e "−" saírem certos, e não a fonte padrão do gerador de PDF.

## Detalhes técnicos
- `Nr1Diagnosticos.tsx` recebe:
  - o comparador, extraído para `src/components/nr1/Nr1ComparadorCiclos.tsx`;
  - o filtro por período no client, sobre `periodo_inicio`/`periodo_fim`;
  - renomear e excluir por diálogos, com `useUpdateNr1Diagnostico`/`useDeleteNr1Diagnostico`;
  - o link do plano de ação para `/nr1/diagnostico/:id#plano-acao`;
  - a exportação por `csvExport` + jsPDF/autoTable.
- Fonte do PDF:
  - hoje nenhum PDF do app embute fonte; o arquivo `DejaVuSans-Bold.ttf` está solto na raiz do projeto;
  - o arquivo vai para `src/assets/fonts/` e é carregado por um helper novo, `src/lib/pdfFont.ts` (`addFileToVFS` + `addFont`), que o PDF do Histórico usa.
- Função pura `compararCiclos(a, b)` em `src/lib/nr1Selo.ts`:
  - A é a base e B é o comparado; delta = `notaSaude(B) − notaSaude(A)`;
  - limiar inclusivo: delta ≥ 0,5 é evolução, ≤ −0,5 é piora, o resto é estável;
  - se algum dos ciclos tiver menos de 5 respondentes, devolve "não comparável", sem nota.
- Testes em `src/test/nr1-historico-comparador.test.ts`:
  - caso de evolução, caso de piora;
  - delta exatamente 0,5 dá evolução; delta 0,49 dá estável;
  - ciclo com menos de 5 respondentes dá "não comparável", sem nota.
- `Nr1Dashboard.tsx`:
  - remove o bloco "Comparar ciclos" (linhas 230–350), junto com os estados e importações que só serviam a ele;
  - adiciona o link "Ver histórico completo";
  - a verificação de código sem uso (knip) e o `bun run ci` precisam passar limpos.
- Sem migração. `Nr1DiagnosticoDetalhe.tsx` não muda.
