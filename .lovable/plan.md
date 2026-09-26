# Vagas: editar/excluir rascunho e corrigir a faixa salarial sugerida

## 1) Editar e excluir vaga em rascunho
- Clicar no card já abre o mesmo formulário preenchido e salva as alterações. Isso continua valendo para todos os status, como é hoje (o fluxo atual permite editar vaga publicada, então isso não muda).
- Novo botão **Excluir vaga** no rodapé do formulário, que aparece **somente** quando a vaga está salva como rascunho. Ele pede confirmação ("Excluir esta vaga? Esta ação não pode ser desfeita.") e depois apaga a vaga e atualiza a lista.
- No card de rascunho entra também um atalho com menu (Editar / Excluir), com a mesma confirmação.
- Segurança: a regra atual do banco já limita criar, editar e excluir ao RH/admin da própria empresa com o módulo contratado (ou super admin). Vou incluir também uma trava no servidor para que só rascunhos possam ser excluídos, mesmo se alguém tentar por fora da tela.

## 2) Por que a faixa sugerida não aparece (diagnóstico confirmado no banco)
- (a) **Pesquisa salarial:** as pesquisas de mercado cadastradas são **globais** (compartilhadas entre empresas, sem empresa dona). A busca atual procura só pesquisas "da empresa", então nunca encontra nada. Além disso, as linhas da pesquisa não têm CBO preenchido, e por isso o único jeito de achar é pelo nome do cargo.
- (b) **Tabela salarial do cargo:** está preenchida e ligada corretamente nos cargos da biblioteca (por exemplo, 557 de 564 cargos na empresa principal). Mas ela só é usada quando o RH escolhe um cargo **da biblioteca**. Com um cargo vindo do catálogo CBO, não existe ligação.
- (c) **Gatilho:** o nível/grade só entra na busca quando a opção "cadastrar na biblioteca" está marcada. Por isso, trocar o nível em outros casos não muda a sugestão.

### Correção
- Buscar nas pesquisas ativas da empresa **e** nas pesquisas globais ativas, dando preferência às da empresa.
- Comparar pelo nome do cargo sem acento e sem diferenciar maiúsculas, primeiro com nome exato e depois com nome parecido (um contém o outro). Onde houver CBO, ele continua tendo prioridade.
- Se o cargo veio do CBO e não da biblioteca, procurar na biblioteca da empresa um cargo com o mesmo CBO ou o mesmo nome e usar a faixa da tabela salarial dele.
- O nível/grade escolhido passa a sempre refinar a sugestão.
- A nota muda conforme a origem: "Sugestão baseada em pesquisa — ajuste se necessário." ou "Sugestão baseada na tabela salarial do cargo — ajuste se necessário." Sem dado, os campos ficam vazios. O valor digitado pelo RH continua nunca sendo sobrescrito.

## Testes
- lint, typecheck, test, dead-code e build até todos passarem.
- No navegador (1280 e 390 px):
  - escolher um cargo que existe na pesquisa e confirmar que mínimo e máximo aparecem com a nota;
  - editar os valores à mão e confirmar que ficam como o RH digitou;
  - escolher um cargo sem dado e confirmar que os campos ficam vazios;
  - criar uma vaga de rascunho de teste, editar, excluir com confirmação e confirmar que sumiu da lista;
  - confirmar que vaga publicada não mostra o botão Excluir.

## Detalhes técnicos
- `useVagas.ts`: novo `useDeleteVaga` (delete com `.eq("id").eq("root_company_id").eq("status","rascunho")`, invalida `["vagas"]`).
- Migração: trigger `BEFORE DELETE` em `vagas` que bloqueia quando `OLD.status <> 'rascunho'`. A política RLS atual (FOR ALL com has_module('talent')) continua valendo.
- `VagaDialog.tsx`: AlertDialog de confirmação; `grade` sempre recebe `nivel`/grade da vaga.
- `Vagas.tsx`: DropdownMenu no card de rascunho com `stopPropagation`.
- `useSugestaoFaixa.ts`: `survey_tables.or(root_company_id.eq.X,root_company_id.is.null)` + `is_active`, com prioridade para a empresa; match exato e depois parcial normalizado; fallback para `job_titles` por CBO/título quando não há `cargoId`; `fonte` controla o texto da nota.
