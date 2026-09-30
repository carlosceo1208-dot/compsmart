# Plano — Linha "exposição controlada" no relatório v3 + publicação

## Objetivo
Fechar o dossiê de segurança com o registro formal da sugestão de faixa na abertura de vaga e publicar a rodada.

## Passo 1 — Relatório de segurança v3
Gerar `/mnt/documents/relatorio-seguranca-final_v3.pdf` e `.xlsx` (cópia do v2, 17 itens) com uma linha nova:

- **Item:** Sugestão de faixa salarial na abertura de vaga (talent-sugerir-faixa)
- **Classificação:** ACEITÁVEL COM JUSTIFICATIVA — exposição controlada e intencional (decisão do dono)
- **Texto:** a sugestão retorna apenas mínimo/máximo/origem genérica ("pesquisa de mercado" / "dados da empresa") via porta única com auditoria (tentativas e recusas logadas); a base de mercado completa continua bloqueada por `has_module('insight')`; sem Insight a consulta direta à base retorna 0 linhas; recusa nunca revela se há dado.
- **Resultado:** 0 bloqueadores em aberto.

## Passo 2 — Verificações finais
- `bun run ci` limpo.
- Conferir dados reais intactos: ciclos NR-1 (9bcaa5df 49.93 "Moderado"; 34820df9 sem nota), Carlos e Josue em triagem, 2 registros da Marli.
- Nenhum dado de teste gravado.

## Passo 3 — Publicar
Publicar a rodada (sugestão de faixa + trava da base + diagnóstico append + faixas) em compsmart.ia.br.

## Detalhes técnicos
- v3 é arquivo novo; v1 e v2 permanecem em /mnt/documents/.
- Nenhuma mudança de código ou banco nesta rodada — só documento e publicação.
