
# Correção de Dados: Funcionários MediaGrowth na CompSmart

## Problema Identificado

8 funcionários da empresa **MediaGrowth** estão erroneamente vinculados a empresa **CompSmart** no banco de dados. Isso faz a CompSmart mostrar 24 funcionários em vez dos 16 corretos.

### Funcionários afetados

| Matricula | Nome | Email |
|-----------|------|-------|
| MG020 | Ursula Costa | ursula.costa@mediagrowth.test |
| MG021 | Vitor Moreira | vitor.moreira@mediagrowth.test |
| MG022 | Wanda Ribeiro | wanda.ribeiro@mediagrowth.test |
| MG044 | Sandra Ribeiro | sandra.ribeiro@mediagrowth.test |
| MG045 | Tiago Campos | tiago.campos@mediagrowth.test |
| MG046 | Ursulina Torres | ursulina.torres@mediagrowth.test |
| MG047 | Vinicius Ferreira | vinicius.ferreira@mediagrowth.test |
| MG048 | Wanessa Oliveira | wanessa.oliveira@mediagrowth.test |

## Solucao

Executar uma unica query SQL para corrigir o `root_company_id` desses 8 registros, movendo-os de volta para a empresa MediaGrowth (ID: `b5256e1e-b564-4ba5-adaf-4200f5076e9a`).

## Detalhes Tecnicos

- **Tabela**: `profiles`
- **Campo corrigido**: `root_company_id`
- **De**: `b4ef7367-2068-4939-b455-f61ad9d7bc8c` (CompSmart)
- **Para**: `b5256e1e-b564-4ba5-adaf-4200f5076e9a` (MediaGrowth)
- **Filtro seguro**: apenas registros com `employee_number LIKE 'MG%'` e `root_company_id` atual da CompSmart
- **Resultado esperado**: CompSmart passara a exibir exatamente 16 funcionarios

Nenhuma alteracao de codigo e necessaria -- trata-se apenas de correcao de dados no banco.
