# Correção dos 7 bloqueadores de funções do servidor

## Objetivo
Fechar as 7 funções que hoje não conferem empresa nem papel. A checagem fica **dentro de cada função, no servidor**, com get_user_company_id() + has_role/has_any_role. Nunca depende da tela. As telas que usam essas funções continuam iguais.

## Regras por função
Regra padrão: o alvo (colaborador, unidade, cenário ou empresa) precisa ser da mesma empresa de quem chama, e quem chama precisa ser RH, admin ou super admin. O super admin pode consultar qualquer empresa. Quem não cumpre a regra recebe o erro "Acesso negado".

1. **Vale-transporte:** regra dupla, com as duas condições obrigatórias:
   - o colaborador é da mesma empresa de quem chama;
   - e quem chama é a própria pessoa, ou é RH/admin/super admin.
2. **Elegibilidade a benefício:** regra padrão. O benefício também precisa ser da mesma empresa.
3. **Comparar cenários de mérito:** regra padrão. Todos os cenários pedidos precisam ser da empresa de quem chama; se um for de outra empresa, a consulta inteira é recusada.
4. **Situação do orçamento por unidade:** regra padrão, aplicada à empresa informada.
5. **Simulação de orçamento pelo 9-Box:** regra padrão, aplicada à empresa informada.
6. **Saldo de orçamento da unidade:** regra padrão. A unidade precisa ser da empresa de quem chama.
7. **Lançar mérito no orçamento:** a unidade precisa ser da empresa de quem chama, e quem chama precisa ser RH, admin ou super admin.
   - A função também é chamada por gatilhos internos de aprovação. Antes de alterar, confiro esses gatilhos para que eles continuem funcionando.
   - A checagem só é pulada quando não há usuário logado, ou seja, quando quem chama é o próprio servidor.

Nenhuma dessas funções fica acessível a visitante.

## Teste (dados fictícios, tudo desfeito no final)
Cenário: empresas fictícias A e B, cada uma com unidade, colaborador, benefício, cenário e orçamento. Cada papel é testado pela sessão dele, e todas as 7 funções são testadas.

| Quem chama | Resultado esperado |
|---|---|
| RH de A | Funciona para A; recusado para B |
| Admin de A | Funciona para A; recusado para B |
| Colaborador de A | Vale-transporte do próprio valor funciona; vale-transporte de outro colaborador de A é recusado; demais funções recusadas |
| Colaborador de B | Recusado em tudo o que for de A |
| Super admin | Funciona para A e B |
| Visitante | Sem permissão |

Depois do teste:
- conferir que as telas de Vale-transporte, Benefícios, Cenários e Orçamento abrem sem erro para o RH;
- rodar bun run ci.

## Depois
Retomar a rodada final de fechamento, itens 2 a 6, e entregar o relatório completo em arquivo.

A publicação continua bloqueada até você aprovar.

## Detalhes técnicos
- Uma migração com CREATE OR REPLACE das 7 funções. Cada uma mantém a mesma assinatura e o mesmo retorno, com SECURITY DEFINER e search_path=public.
- Guarda no início de cada função: IF NOT (is_super_admin(auth.uid()) OR (alvo_company = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin','hr_manager']))) THEN RAISE EXCEPTION 'Acesso negado'.
- Vale-transporte: adiciona OR p_employee_id = auth.uid() dentro da condição de mesma empresa.
- Lançar mérito: a guarda só se aplica quando auth.uid() IS NOT NULL, porque chamadas feitas pelos gatilhos, quando não há usuário, não passam por ela. Antes da migração, verifico os gatilhos auto_debit_merit_approval_budget e auto_debit_talent_budget.
- Permissões: REVOKE EXECUTE de anon/public; GRANT a authenticated/service_role.
- Teste em bloco DO com set_config('request.jwt.claims') + SET LOCAL ROLE authenticated, terminando em RAISE EXCEPTION para garantir rollback.
