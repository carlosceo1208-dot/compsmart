# Rodada final de fechamento do Relatório de Segurança (somente leitura)

Nada será alterado no app, no banco ou nos dados reais. Só entra como "conferido nesta rodada" o que rodar agora; nenhum status é herdado de rodadas anteriores.

## Critério de classificação (toda a tabela)
- **BLOQUEADOR:** (a) vazamento de dados de outra empresa em tabela sensível; (b) dado sensível identificável individualmente (saúde mental ou salário); (c) chave/segredo no código do navegador; (d) SECURITY DEFINER sem search_path fixo; (e) leitura/gravação sem checagem de papel e empresa em tabela sensível; (f) SQL com risco de injeção a partir de entrada do usuário.
- **ACEITÁVEL COM JUSTIFICATIVA:** risco documentado e mitigado por desenho (catálogo público, porta pública pretendida, filtro por empresa, login + regra de acesso), com a justificativa ao lado.
- Se aparecer qualquer BLOQUEADOR: paro, mostro a correção proposta e aguardo aprovação.

## Itens a conferir (na ordem)
1. **78 funções liberadas a logados:** ler o corpo de cada uma; tabela por módulo (Core, Insight, Match, NR-1, Clima, Talent, T&D/PDI, Potencial/9-Box, Maturidade, gerais): função | valida papel? | valida empresa? | usa has_module? | classificação | justificativa. Incluir checagem de SQL dinâmico (EXECUTE com texto concatenado).
2. **21 funções liberadas a visitantes:** para cada uma, o que devolve sem login — (a) só dado público, (b) exige convite/token, (c) nada/nulo sem sessão; classificação e justificativa nominais.
3. **20 funções do servidor sem login obrigatório:** ler o código; marcar como webhook com assinatura, tarefa automática com segredo, rota pública com anti-robô/limite, ou exige sessão por dentro.
4. **Regras completas, texto íntegro:** auditoria (leitura e gravação), trava de módulo do Clima, salário em perfis/faixas/tabelas salariais, incluindo "a própria pessoa" e "gestor/diretos". Sem cortes.
5. **Salários do Core sem Insight:** tabelas e colunas de salário que chegam, por papel, em empresa sem Insight — comportamento real do servidor.
6. **Isolamento por papel ao vivo:** empresas fictícias A e B criadas e desfeitas na mesma transação; admin de A e RH de A contra B em perfis, salários, NR-1, Clima, vagas e auditoria; contagem visível por tabela (esperado: 0 de B em todas).

## Entrega final
1. Tabela por área: alerta | evidência de hoje | classificação | justificativa.
2. Os 102 avisos antigos agrupados por tipo, com contagem e quantos já estavam justificados antes.
3. Resumo executivo: funções conferidas por grupo, total de BLOQUEADORES (esperado 0) e ACEITÁVEIS, top 5 riscos residuais e priorização para a varredura pós-lançamento.
4. Confirmação final: nada alterado; dados fictícios removidos (rollback); ciclos reais intactos (10 respondentes 49,93 "Moderado"; 1 respondente sem nota); Carlos, Josue e os 2 registros da Marli preservados.
5. Relatório completo também salvo como arquivo para download (as tabelas de 78 funções não cabem no chat).

## Detalhes técnicos
pg_proc.prosrc + has_function_privilege por papel; pg_policies qual/with_check completos; leitura de supabase/functions/* com verify_jwt=false (config.toml e padrão); DO block com set_config('request.jwt.claims') + SET LOCAL ROLE authenticated, terminando em RAISE EXCEPTION para garantir rollback; foto antes/depois dos dados reais.
