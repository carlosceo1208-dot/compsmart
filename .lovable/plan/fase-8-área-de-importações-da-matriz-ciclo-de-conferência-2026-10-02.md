# Fase 8 — Área de Importações da Matriz (ciclo de conferência)

## Conflitos encontrados no banco (precisam da sua decisão)

Conferi a tabela de importações e as regras de acesso dela. Três pontos do pedido não funcionam sem uma pequena mudança no banco, e o pedido diz para não mexer em regras de acesso:

1. **Status "conferido" e "rejeitado" não existem.** Hoje o status aceita só: pendente, em_mapeamento, mapeado, publicado, erro. Proposta: incluir `conferido` e `rejeitado` na lista. Os valores antigos ficam como estão, sem uso novo. A tela mostra e permite só os três estados (D2).
2. **Não existe campo para o motivo da rejeição, nem para quem conferiu e quando.** Proposta: novos campos `motivo_rejeicao`, `conferido_por` e `conferido_em`. O motivo é obrigatório quando o status é rejeitado, e o banco também exige isso.
3. **Hoje o consultor não vê as importações (D3).** A leitura e a alteração só aceitam admin, RH e super admin da própria empresa, e a regra não confere se a empresa contratou o NR-1. Proposta: incluir o consultor dono de projeto ativo (`consultor_dono_ativo`), igual ao restante do NR-1, e exigir `has_module('nr1')`. Sem essa mudança, a validação "consultor com projeto ativo vê" falha.

Recomendo o item 3, e ele vale como autorizado se você aprovar este plano. Se preferir não mexer em acesso agora, me peça para removê-lo. Nesse caso só RH e admin conferem, e a parte do consultor fica para a fase da integração com a Matriz.

**Mudança de status só uma vez:** a importação só sai de "pendente" para "conferido" ou para "rejeitado". Uma importação conferida não pode ser reaberta, e uma rejeitada não pode ser rejeitada de novo. O banco confere o status atual antes de qualquer mudança, então a tela sozinha não consegue burlar essa regra.

O arquivo original fica num local privado. O detalhe abre o arquivo por um **link temporário** criado na hora do clique, que vale 10 minutos e expira de fato. A lista não guarda esse link, e ele nunca entra no PDF nem na planilha.

## O que o cliente vai ver

- Nova página **/nr1/importacoes**. Ela abre pelo menu "Mais recursos" (item "Importações", ao lado de "Importar Matriz") e por um botão na Matriz de Risco.
- **Lista**, da mais recente para a mais antiga: arquivo (ou "Texto livre"), metodologia, data, status em selo pílula, consultoria e ações. Tem filtro por status e por período.
- **Detalhe** (painel lateral):
  - o mapeamento aplicado (coluna externa → campo CompSmart);
  - o resumo da leitura (linhas, colunas e avisos), calculado de novo com o leitor atual, sem alterá-lo;
  - o link do arquivo ou o texto livre.
- **Ações:** "Marcar como conferido" e "Rejeitar", que abre uma janela com o motivo obrigatório (validado com zod). Elas só aparecem em importações pendentes.
- **Estado vazio:** "Importar matriz", que abre a janela de importação que já existe.
- **Exportação em PDF e em planilha.** No topo vêm:
  - o período e o filtro usados;
  - o aviso "fatores de risco, sem dados pessoais";
  - uma linha explicando que o mínimo de 5 respostas não se aplica aqui, porque a matriz traz fatores de risco e não respostas de pessoas. Por isso não há nota de saúde nem selo nesta área.

  Os arquivos não trazem nomes de quem enviou ou conferiu, nem links de arquivo.

## Etapas

1. Mudança no banco: novos status, novos campos, a trava do motivo e (se aprovado) a regra de acesso com consultor e has_module.
2. Hook `useNr1Importacoes`: lista filtrada pela empresa ativa, mais as ações de conferir e rejeitar.
3. Página `Nr1Importacoes.tsx` e painel `Nr1ImportacaoDetalhe.tsx`, com rota, item no menu e botão na Matriz.
4. Exportações PDF e planilha usando a fonte Unicode e o cabeçalho com o método.
5. Validação com empresa de teste apagada ao final, em 1280 e 390:
   - acesso: RH/admin vê; outra empresa vê 0 linhas; consultor com projeto ativo vê; consultor sem projeto ativo vê 0 linhas;
   - filtros e ordenação;
   - ações: rejeição sem motivo bloqueada direto no banco (não só na tela); conferida não reabre; rejeitada não é rejeitada de novo;
   - link do arquivo: abre dentro de 10 minutos e falha depois que expira; nenhum link nos arquivos exportados;
   - abrir os dois arquivos exportados e conferir a nota de método;
   - a importação continua gravando "pendente";
   - linha de base completa ao final: 25 acessos · 2 auditorias · respostas 440/0/0 · 9 check-ups · 18 logins · 2 leads · Q1 2026 = 49,93;
   - `bun run ci` limpo.
6. Atualizar AGENTS.md, roadmap e o dossiê da Fase 8, com o registro de que a integração com a Matriz (opção B) fica como incremento futuro. Nada publicado sem sua aprovação.

## Não muda

O leitor de matriz, os modelos de mapeamento, a sugestão de mapeamento por IA, a janela de importação e a Matriz de Risco exibida (ganha só o botão de acesso).
