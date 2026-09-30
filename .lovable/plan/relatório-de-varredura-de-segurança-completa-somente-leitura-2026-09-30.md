# Relatório de varredura de segurança completa (somente leitura)

## Objetivo
Rodar a varredura completa e entregar um relatório por área, com cada alerta classificado como **BLOQUEADOR** ou **ACEITÁVEL COM JUSTIFICATIVA**. Nenhuma mudança de código ou banco nesta etapa; correções só depois da sua aprovação.

## Coleta
1. Rodar a varredura de segurança nova e ler os achados já salvos (inclui os ~100 avisos antigos).
2. Rodar o verificador do banco (linter).
3. Consultas de leitura ao banco para confirmar cada achado (nada é afirmado sem evidência).
4. Busca no código do app e das funções do servidor.

## Áreas do relatório
1. **Isolamento por empresa (RLS):** todas as tabelas públicas — RLS ligada, políticas por operação, filtro por empresa, permissões para visitante; tabelas sem política ou com leitura aberta.
2. **Funções do servidor privilegiadas:** todas as SECURITY DEFINER — search_path fixo, quem pode executar (visitante x logado), se validam empresa/papel internamente.
3. **Chave de serviço no app:** busca no código do navegador, `.env`, build; confirmar que só aparece nas funções do servidor e na CI.
4. **Vazamento entre empresas:** funções do servidor que usam chave de serviço (conferem papel e empresa?), views sem `security_invoker`, RPCs públicas (portal de vagas, NR-1, Maturidade), funções com `verify_jwt = false`.
5. **Saúde mental e k=5:** NR-1/Clima — leitura direta de respostas, nota em ciclos <5, cruzamentos, payload do agente Psi, links anônimos.
6. **Auditoria e logs:** nr1_access_log, audit_logs, logs de agentes — quem lê, quem grava, se logs contêm dados pessoais, retenção.
7. **Salários do Core sem Insight:** medir exatamente quais campos/tabelas retornam salário a empresa sem Insight e para quais papéis; classificar.

## Critério de classificação
- **BLOQUEADOR:** permite ler/alterar dado de outra empresa, dado de saúde individual, salário fora do papel, ou chave de serviço exposta.
- **ACEITÁVEL COM JUSTIFICATIVA:** falso positivo, intencional com proteção comprovada (ex.: consulta por grupo com k=5), ou risco baixo documentado.

## Entrega
- Tabela por área: alerta · evidência · classificação · justificativa ou correção sugerida.
- Os ~100 avisos antigos agrupados por tipo (não um a um quando repetidos), com contagem.
- Lista final de bloqueadores com proposta de correção, para você aprovar antes de qualquer mudança.
- Atualizar o roadmap com as pendências.

## Detalhes técnicos
Ferramentas: run_security_scan, get_scan_results, supabase linter, consultas em pg_policies, pg_class (relrowsecurity), pg_proc (prosecdef, proconfig), information_schema.role_table_grants e routine_privileges, pg_views (reloptions); rg por `service_role`/`SERVICE_ROLE` em src/ e dist; leitura de supabase/functions com verify_jwt=false.
