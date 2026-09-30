# Sugestão de faixa salarial na abertura de vaga (sem Insight)

## O que o RH/admin vai ver
- Ao escolher o cargo ou o nível da vaga, mínimo e máximo são preenchidos com uma faixa, por exemplo "R$ 8.000 – 10.000".
- Abaixo aparece a nota "Baseado em posições similares — ajuste se necessário". A origem (pesquisa de mercado, tabela salarial do cargo) é opcional e aparece sem o nome da pesquisa.
- Com o Insight contratado, a inteligência completa de mercado continua igual. Sem o Insight, o RH vê só essa faixa.
- Sem posição parecida ou com resultado ambíguo: os campos ficam vazios e nenhum valor é inventado. O que o RH digita continua sem ser sobrescrito.

## Regra de proteção
- A base de mercado continua travada para quem não tem o Insight (0 linhas por consulta direta).
- A sugestão sai de uma única função no servidor. Ela confere se quem pede é RH, admin ou super admin da empresa e devolve somente três dados: mínimo, máximo e origem. Nunca devolve linhas, nomes de pesquisa, quantidade de registros ou mediana.
- Colaborador comum, visitante e outra empresa são recusados.

## Como a posição similar é escolhida (em ordem)
1. CBO igual.
2. Nome do cargo normalizado (sem acento e sem diferenciar maiúsculas). Primeiro o nome exato; o nome parecido só vale quando aponta para um único cargo.
3. Pontos Hay/Mercer do cargo, se houver, dentro de uma faixa próxima de ±10%.
4. Grade/nível, para refinar.
- As pesquisas da própria empresa têm prioridade; depois vêm as globais da CompSmart. Se nada for encontrado, a faixa sai da tabela salarial do cargo na biblioteca.
- Valores arredondados (Q1 → mínimo, Q3 → máximo).

## Testes (dentro de operação desfeita, sem gravar nada)
1. RH de A sem Insight abre a vaga e vê a faixa pontual.
2. RH de A sem Insight consulta a base direto: 0 linhas.
3. Colaborador comum: a função recusa e ele não vê faixas.
4. Empresa B pedindo a sugestão para A: recusada. Ela também não vê nada de A.
5. has_module('insight') continua intacto. O retorno da função tem só mínimo, máximo e origem, conferido pelas chaves do JSON.
6. Com Insight temporário, o RH continua vendo a base completa.
7. No navegador, como RH, a vaga mostra a faixa em 1280 px e em 390 px.
8. A verificação completa do projeto passa sem erros. Os dados reais continuam intactos (2 ciclos do NR-1, Carlos, Josue e os 2 registros da Marli), nenhum dado de teste fica gravado e nada é publicado.

## Detalhes técnicos
- Migração: `talent_sugerir_faixa(_company uuid, _titulo text, _cbo text, _grade text, _cargo_id uuid, _pontos numeric)` retornando `jsonb {min, max, fonte}`. A função é SECURITY DEFINER com `SET search_path = public` e começa checando `rh_admin_da_empresa(_company)`; se falhar, dá RAISE. Ela lê `survey_data`/`survey_tables` (da empresa e globais ativas) e, como alternativa, `job_titles` + `salary_ranges`. EXECUTE é revogado de anon/public e concedido a authenticated/service_role. Antes de usar os pontos, confirmar se a coluna de pontos existe em `job_titles`; se não existir, esse critério fica de fora.
- `useSugestaoFaixa.ts` passa a chamar só `supabase.rpc('talent_sugerir_faixa')`, sem ler as tabelas direto. A lógica de casamento vai do cliente para a função. A nota em `VagaDialog.tsx` fica genérica.
- As políticas de `survey_tables`/`survey_data` e `has_module` não mudam.
- Registrar a regra em AGENTS.md ("sugestão de faixa só via talent_sugerir_faixa, retorno mínimo") e o item em roadmap.md. O relatório de segurança ganha uma linha nova (v3), classificada como exposição controlada.

## Reforços antes de liberar
1. **Origem sempre genérica:** o campo `fonte` só aceita três valores fixos: "pesquisa de mercado", "tabela salarial" ou "dados da empresa". Nunca aparece o nome, o id ou qualquer identificador da base global da CompSmart. O servidor impõe isso com um CASE fechado.
2. **Teste de contrato do retorno:** a resposta tem exatamente 3 chaves (`min`, `max`, `fonte`), conferido com `jsonb_object_keys` (contagem = 3 e o conjunto igual). Não pode vir mediana, contagem nem lista. `fonte` precisa ser um dos 3 valores permitidos.
3. **Erro explícito por papel:** para colaborador, visitante e outra empresa, a função lança erro (RAISE com código próprio) em vez de devolver vazio. "Sem faixa" (`null`) só vale para quem tem acesso. A tela trata o erro como erro e não mostra faixa vazia. Cada tentativa recusada fica registrada em `audit_logs`. No teste, cada papel precisa gerar erro, e não resposta vazia.
4. **Comportamento documentado:** o roadmap.md e o AGENTS.md vão registrar que, sem o Insight, a sugestão pontual usa também os dados globais da CompSmart, e que isso é intencional (decisão do cliente), só com mínimo, máximo e origem genérica. O relatório v3 traz o mesmo registro.
