# Relatório de segurança completo — fechar o que ficou sem conferência

A varredura e o verificador já rodaram hoje (0 bloqueadores; 1 aviso informativo; 102 avisos antigos). Esta rodada confere os pontos que ficaram "não conferidos" e entrega o relatório final por área. Somente leitura, sem mudanças.

## O que será conferido agora
1. **78 funções liberadas a logados:** ler o corpo de cada uma e marcar se valida papel e empresa (auth.uid(), has_role, get_user_company_id, nr1_pode_gerir, maturidade_pode_gerir, has_module). Lista uma a uma, agrupada por módulo.
2. **21 funções liberadas a visitantes:** confirmar para cada uma o que devolve sem login (só público, exige convite/token, ou nada).
3. **20 funções do servidor sem login obrigatório:** ler o código e marcar se é webhook com assinatura, tarefa automática com segredo, rota pública com anti-robô, ou exige sessão por dentro.
4. **Regras completas** (texto inteiro, sem corte): gravação de registros de auditoria, trava de módulo do Clima, regras de salário em perfis/faixas/tabelas (incluindo "a própria pessoa" e gestor).
5. **Salários do Core sem Insight:** listar exatamente quais campos de salário chegam, para quais papéis, em empresa sem Insight.
6. **Isolamento por papel:** repetir hoje, em transação desfeita, o teste admin/RH da empresa A contra a empresa B nas tabelas sensíveis (perfis, salários, NR-1, Clima, vagas, auditoria).

## Entrega
Tabela por área (1 a 6 + salários): alerta · evidência de hoje · BLOQUEADOR ou ACEITÁVEL COM JUSTIFICATIVA. Os 102 avisos antigos agrupados por tipo com contagem. Só será marcado como conferido o que rodou nesta rodada. Se aparecer bloqueador, paro e mostro a correção proposta antes de mexer.

## Detalhes técnicos
pg_proc.prosrc das SECURITY DEFINER com has_function_privilege por papel; pg_policies com qual/with_check completos; leitura de supabase/functions/* com verify_jwt=false; DO block com set_config('request.jwt.claims') + SET LOCAL ROLE authenticated e ROLLBACK, usando empresas fictícias criadas e desfeitas na mesma transação.
