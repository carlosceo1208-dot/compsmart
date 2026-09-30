# Linha "exposição controlada" no relatório v3 — já concluída

## Situação
O item pedido já foi executado na rodada anterior, junto com a publicação:

- O relatório `relatorio-seguranca-final_v3.pdf` e `relatorio-seguranca-final_v3.xlsx` (em Files) contêm a linha nova na aba Resumo:
  - **Item:** Sugestão de faixa na abertura de vaga (talent-sugerir-faixa)
  - **Resultado:** Exposição controlada e intencional (decisão do dono): retorna apenas mínimo/máximo/origem genérica ("pesquisa de mercado" / "dados da empresa") via porta única com auditoria (tentativas e recusas logadas). A base de mercado completa continua bloqueada por has_module('insight'): sem Insight a consulta direta retorna 0 linhas. Recusa nunca revela se há dado.
  - **Classificação:** ACEITÁVEL COM JUSTIFICATIVA
- O relatório fecha com 18 itens e 0 bloqueadores em aberto.
- A publicação já foi solicitada para https://www.compsmart.ia.br.

## O que resta fazer
Nada. Nenhuma mudança de código, banco ou documento é necessária nesta rodada.

## Verificação opcional (se desejado)
- Reabrir o PDF/planilha v3 e confirmar visualmente a linha.
- Conferir que o site publicado está servindo a versão nova.
