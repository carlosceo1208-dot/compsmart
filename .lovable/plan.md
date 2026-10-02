# Fase 10 — Cruzamento Sociodemográfico

## O que a auditoria encontrou (bloqueia o D4)
1. A tabela de resultados consolidados por ciclo **não existe** no banco (nem a de Sociodemográfico, nem as de FIB/SegPsi que a tela também procura). A tela não quebra porque a leitura tolera a falta e cai no estado vazio — por isso o cliente sempre vê "vazio".
2. **O questionário não coleta sexo, faixa etária, tempo de casa nem área.** Cada resposta guarda só um código anônimo, a pergunta e o valor. O único recorte que existe é o grupo autodeclarado do convite.
3. Esses dados existem no cadastro do colaborador, mas a resposta é anônima e não se liga à pessoa. Cruzar cadastro com resposta quebraria o anonimato — **não vou fazer**.

Conclusão: não dá para fechar a cadeia com dados reais sem começar a coletar. Pela D1/D4, sinalizo e aguardo aprovação.

## Proposta mínima de coleta (precisa da sua aprovação)
- Bloco curto e **opcional** no início do questionário anônimo: sexo, faixa etária (faixas largas), tempo de casa (faixas), área (lista da empresa). Sempre com "Prefiro não informar".
- Guardado junto do envio anônimo, nunca ligado à pessoa nem ao convite individual.
- Recortes separados (nunca combinados entre si, como na Fase 6), k=5 por grupo.
- Ciclos já coletados (Q1 2026, Ciclo 2026) **não ganham** recorte — ficam no estado vazio desta tela.

## Plano em duas partes

**Parte 1 — faço já (não depende da coleta)**
- Cor do mapa de calor: abaixo de 50 passa a vermelho (D5).
- Revisão leve: estados vazio/carregando, filtros, 1280 e 390.
- Exportações CSV/PDF: conferir que só levam grupos com 5+ e continuam registrando acesso (D3/D6).
- Seed do Super Admin e estado vazio intactos.

**Parte 2 — só com sua aprovação da coleta**
- Criar a tabela de resultados por empresa+ciclo (sem duplicar ao reprocessar).
- Bloco sociodemográfico no questionário anônimo.
- Consolidação no fechamento do ciclo: calcula FIB/SegPsi/HSE por grupo e grava só grupos com 5+.
- Teste com empresa temporária (um grupo com 5+, outro com menos), 1280/390, exportações abertas, recarregar sem duplicidade; empresa apagada; linha de base 25 · 2 · 440/0/0 · 9 · 190 · 2 · Q1 2026 = 49,93.

Registro em AGENTS.md, roadmap e dossiê nas duas partes. Nada publicado sem sua autorização.

## Decisão que preciso
- Aprovar só a Parte 1 agora (coleta fica pendente registrada), ou
- Aprovar as duas partes (com o bloco opcional descrito acima).

## Detalhes técnicos
- Respostas: `nr1_diagnostico_respostas` (respondent_hash, questao_id, resposta, convite_id); sem demografia. `nr1_convites.grupo` é o único recorte.
- `nr1_sociodemo_results`, `nr1_fib_results`, `nr1_segpsi_results` ausentes; `safeSelect` em useNr1Cycles.ts engole o erro → `source:'empty'`.
- Coleta proposta: tabela própria anônima por envio (diagnostico_id + faixas), gravada no envio atômico `nr1_submeter_completo`; consolidação via função SECURITY DEFINER com upsert em (company_id, diagnostico_id), HAVING count ≥ 5.
- Não altera Matriz, Importações, Terceiros, selo, parser.
