# Faixa salarial sugerida e Estado/Cidade na vaga

## O que muda para o RH
1. **Faixa salarial sugerida**: quando o RH escolhe o cargo ou o nível, o sistema preenche mínimo e máximo usando a pesquisa salarial da empresa (e, se não houver, a faixa da tabela salarial ligada ao cargo). Aparece a nota "Sugestão baseada em pesquisa — ajuste se necessário." Se não houver dado, os campos ficam vazios. O RH pode mudar os valores; depois disso, trocar o cargo ou o nível não apaga o que ele digitou.
2. **Estado (UF) obrigatório + Cidade**: seletor com os 27 estados (sigla + nome). A cidade vem de uma lista das cidades do estado escolhido. Se o RH trocar o estado, a cidade é limpa. Não existe hoje no projeto um campo de cidade que dependa do estado, então ele será criado.
3. **Lista de vagas**: cada card mostra "Cidade – UF". Há filtro por estado e filtro por cidade; o de cidade só fica disponível depois de escolher o estado e mostra as cidades desse estado, como no formulário.
4. **Vagas antigas sem estado**: o card mostra só a cidade, ou "—" se também não houver cidade, sem quebrar a tela. O estado continua obrigatório só quando o RH salva ou edita a vaga.
5. **Portal público de candidatos**: ainda não existe, porque hoje as vagas aparecem só no painel do RH. A mesma regra de exibição ("Cidade – UF", só a cidade ou "—") fica numa função única, pronta para o portal usar quando ele for criado.

## Detalhes técnicos
- **Banco**: migração adiciona `uf text` e `cidade text` em `vagas`, com trigger de validação (UF entre as 27 siglas; cidade até 120 caracteres). As vagas antigas ficam com UF vazia, e a UF passa a ser exigida no formulário ao salvar ou editar. `localizacao` continua existindo para não perder dados antigos.
- **Constante `UFS`** em `src/lib/brasil.ts` com os 27 estados, mais a função `formatLocal(cidade, uf)`, que devolve "Cidade – UF", só a cidade ou "—". As cidades vêm da API pública do IBGE (`/api/v1/localidades/estados/{UF}/municipios`), com uma única chamada por estado. O cache do react-query guarda o resultado por 24 h (`staleTime`), e ele também é salvo no navegador (`localStorage`) por 7 dias. A busca no combobox usa um atraso de 250 ms (debounce). Se a API falhar, a cidade vira um campo de texto livre. O mesmo hook atende o formulário e o filtro da lista.
- **Sugestão de faixa** (`useSugestaoFaixa`): primeiro busca em `survey_data`, pelas pesquisas ativas da empresa (`survey_tables.root_company_id = activeCompanyId`, `is_active`). Procura primeiro por `job_code` = CBO, depois pelo título sem acento e sem diferenciar maiúsculas, e depois filtra pela grade quando ela existir. Usa `q1_value` como mínimo e `q3_value` como máximo; se não achar, usa o `salary_range_id` do cargo ligado (`salary_ranges.min/max`). Sem nenhum resultado, os campos ficam vazios. Um sinalizador `faixaEditada` impede que a sugestão sobrescreva o valor digitado.
- `useVagas.ts`: incluir `uf` e `cidade` em Vaga e VagaInput. `Vagas.tsx`: mostrar os dois nos cards e adicionar os filtros de estado e cidade.
- A lógica de família e nível atual fica como está.
- **Testes**: rodar lint, typecheck, test, dead-code e build até todos passarem. No Playwright, testar em 1280 e 390 px:
  - (a) a faixa sugerida aparece ao escolher cargo ou nível, e a edição manual é mantida;
  - (b) a vaga é salva com estado e cidade, e aparece no card e no filtro;
  - (c) os 3 cenários de família e nível: família existente com nível sugerido; família nova com nível editado; troca de senioridade depois de preencher, sem sobrescrever.
