# Fechamento da sugestão de faixa: auditoria das recusas + validações 1 a 10

## Situação atual
A função da sugestão, a trava da base, o contrato das 3 chaves, a origem genérica e o registro no roadmap já estão prontos e testados. Faltam duas coisas:
- **Registro das tentativas negadas na auditoria (reforço 3).** Hoje a recusa gera um erro, e esse erro desfaz tudo o que seria gravado junto com ele. Por isso a tentativa não fica registrada.
- **Teste na tela como a RH de A**, em 1280 px e em 390 px.

## O que muda
- A sugestão passa a ter uma única porta de entrada: uma função do servidor que confere o login de quem pede.
  - Com permissão: devolve só `{min, max, fonte}`, igual a hoje.
  - Sem permissão (colaborador, visitante ou outra empresa): devolve "Acesso negado" e grava em `audit_logs` quem tentou, quando, qual empresa e o motivo. A gravação sai numa operação separada, então fica guardada mesmo com o erro.
- A regra do banco continua lançando erro para quem não tem permissão. Ninguém consegue chamá-la direto e pular a auditoria.
- A tela da vaga não muda para o RH: a faixa preenche, a nota continua genérica e o que o RH digita não é sobrescrito. Um "Acesso negado" aparece como aviso, nunca como campo vazio.

## Validações (esperado x obtido, tudo desfeito ao final)
1. RH de A sem Insight abre a vaga no navegador e vê a faixa preenchida.
2. A mesma RH consulta a base de mercado direto: 0 linhas.
3. Colaborador comum: recebe "Acesso negado", vê 0 faixas e a tentativa fica na auditoria.
4. RH de A pedindo a sugestão para B: recebe "Acesso negado" e a tentativa fica na auditoria.
5. Retorno com exatamente 3 chaves, conferido por contagem de chaves, no servidor e em teste automático.
6. Origem só com um destes valores: "pesquisa de mercado", "tabela salarial" ou "dados da empresa". Nenhum nome, id ou nome de tabela, também nos logs.
7. has_module('insight') intacto; com o Insight temporário, a RH vê a base completa.
8. No navegador, em 1280 e 390 px: faixa preenchida; cargo sem similar deixa os campos vazios; valor digitado pela RH preservado.
9. Auditoria: as linhas das recusas mostram quem, quando e o motivo. As linhas de teste são apagadas no final.
10. `bun run ci` limpo; dados reais intactos (2 ciclos do NR-1, Carlos, Josue e os 2 registros da Marli); nada publicado.

Entrega: tabela esperado x obtido, mais a confirmação dos 4 pontos pedidos. O relatório de segurança v3 ganha a linha "exposição controlada".

## Detalhes técnicos
- Nova função do servidor `talent-sugerir-faixa`, que valida o JWT em código e o corpo da requisição com Zod.
  - Chama a RPC com o cliente do usuário (assim `auth.uid()` fica preservado).
  - Se receber o erro 42501, grava em `audit_logs` com service_role: `action='talent_sugerir_faixa_negado'`, `table_name='survey_data'`, `user_id`, `root_company_id=_company` e `new_data={motivo}`. Esse registro não leva nome de pesquisa.
  - Responde 403 com `{error:"Acesso negado"}`. No caminho de sucesso, repassa só `min`, `max` e `fonte`, filtrados de novo pela lista das 3 chaves permitidas.
- Para impedir chamadas diretas que pulem a auditoria: a RPC ganha o parâmetro `_user uuid` e o EXECUTE fica só com service_role (revogado de authenticated). A checagem passa a usar esse usuário: super admin, ou papel RH/admin (`has_any_role`) com a empresa do perfil igual a `_company`, mantendo a mesma regra de `rh_admin_da_empresa`. A recusa continua com RAISE 42501.
- `useSugestaoFaixa.ts` passa de `rpc` para `supabase.functions.invoke('talent-sugerir-faixa')`. Um 403 vira erro, e o aviso na tela continua o mesmo.
- Teste automático (vitest) do contrato: resposta com `Object.keys(r).length === 3` e `fonte` dentro da lista permitida.
- AGENTS.md e roadmap.md atualizados: a entrada única com auditoria e o efeito colateral do Insight, que já foi registrado.
- Teste na tela como a RH de A: exige gerar uma sessão para ela (`lovable auth-session --user f19fa2e8-...`), o que pede a sua aprovação.
