# Importação universal de colaboradores (base de folha)

Evolui a importação de colaboradores que já existe no Core para aceitar a planilha exportada por qualquer sistema de folha (TOTVS, Senior, Domínio, ADP e outros), com mapeamento de colunas assistido por IA, validação, preview, gravação transacional e histórico auditável.

O fluxo atual de colar dados, a exportação de planilhas e o design system continuam como estão — o novo assistente reaproveita a mesma janela de importação, agora com etapas.

## Como o RH usa

1. **Arquivo** — arrasta ou escolhe um `.xlsx`, `.xls` ou `.csv` exportado da folha. Se a planilha tiver várias abas, escolhe a aba.
2. **Mapeamento** — a plataforma sugere automaticamente qual coluna da planilha corresponde a cada campo (matrícula, nome, CPF, cargo, salário base, admissão, e-mail, telefone, nascimento, unidade, gestor, salário variável, nota de desempenho). A sugestão vem de dicionário de cabeçalhos comuns + IA para os casos não óbvios; o RH ajusta qualquer correspondência. Pode salvar o mapeamento com um nome e reutilizá-lo nas próximas importações (ou carregar um mapeamento já usado).
3. **Validação e preview** — resumo com total de linhas, válidas, com erro, novas, a atualizar e ignoradas. Abas "Válidas" e "Com erro"; cada linha com erro mostra o motivo e a coluna. Aqui o RH escolhe o comportamento para quem já existe: **Atualizar existentes** (padrão), **Ignorar existentes** ou **Somente novos**.
4. **Importação** — grava só as linhas válidas. Ao final, resumo com importadas / atualizadas / ignoradas / com erro e link para o log.
5. **Histórico** — aba "Histórico de importações" com arquivo, data, autor, contagens, mapeamento utilizado e log de erros por linha. O RH pode corrigir as linhas com erro dentro da própria tela e reimportar só elas, sem reenviar o arquivo.

## Regras de validação

- Obrigatórios: nome e (matrícula ou CPF).
- CPF: dígitos verificadores válidos; normaliza pontuação; duplicado dentro do arquivo é erro.
- Matrícula: duplicada dentro do arquivo é erro.
- Datas: aceita DD/MM/AAAA, AAAA-MM-DD e data serial do Excel; inválida é erro.
- Valores: aceita `4.500,00`, `4500.00`, `R$ 4.500,00`; não numérico é erro.
- E-mail: formato válido quando informado.
- Cargo: casado por código ou nome (como hoje); não encontrado é aviso — a linha entra sem cargo.
- Unidade e gestor: casados por código e e-mail; não encontrado é aviso.
- **Conflito matrícula × CPF**: se a matrícula aponta para um colaborador e o CPF para outro, a linha não é gravada e fica registrada como conflito para revisão manual.

## Atualização e rollback

- Atualiza **somente os campos mapeados**. Campo não mapeado nunca é sobrescrito (protege dados enriquecidos na plataforma, como cargo interno, grade e avaliações).
- Cada atualização registra antes → depois dos campos alterados no log.
- Toda a gravação roda em uma única transação no banco: se ocorrer falha crítica (conexão, banco, integridade), nada é gravado — sem importação parcial.
- Linhas com erro não entram na gravação; ficam no log com o motivo.

## Acesso

- Disponível com o módulo Core ativo. Sem Core, o cartão aparece bloqueado com o CTA "Ativar módulo Core".
- Podem importar: administrador, RH e consultor CompSmart. Demais papéis não veem a ação.
- A base importada é a mesma consumida por Core, NR-1, Clima e Desempenho — importação centralizada, sem cópia por módulo.

Não faz parte desta etapa: landing page, checkout, pagamentos e qualquer cálculo de folha. A plataforma apenas importa a base exportada pela folha.

## Detalhes técnicos

**Banco (migração)**
- `employee_import_runs`: company_id, criado_por, nome do arquivo, aba, sistema de origem (livre), estratégia de duplicados, mapeamento aplicado (jsonb), totais (linhas, importadas, atualizadas, ignoradas, com erro), status, timestamps.
- `employee_import_row_errors`: run_id, número da linha, tipo (`validacao` | `conflito` | `gravacao` | `ignorado`), campo, mensagem, payload da linha (jsonb), resolvido.
- `employee_import_changes`: run_id, profile_id, campo, valor anterior, valor novo.
- `employee_import_mappings`: company_id, nome, sistema de origem, mapeamento (jsonb), criado_por, contador de uso.
- RLS por tenant via `get_user_company_id()` / `is_super_admin()`; escrita restrita a admin, hr_manager, consultor e super_admin; GRANT para `authenticated` e `service_role`, sem `anon`.
- RPC `import_employees_batch(run jsonb, rows jsonb)` `SECURITY DEFINER`: valida módulo com `has_module('core')`, faz upsert em `profiles` só nos campos mapeados, registra erros/mudanças e retorna o resumo — tudo em uma transação (rollback automático em exceção).

**Frontend**
- `EmployeeBulkImport.tsx` evolui para um assistente de 4 passos, preservando o modo atual "colar dados" como opção. Componentes novos em `src/components/employee-import/`: `FileStep`, `MappingStep`, `PreviewStep`, `ResultStep`, `ImportHistory`.
- `src/lib/employeeImport/`: `parseSpreadsheet.ts` (usa `xlsx`, já instalado), `fieldCatalog.ts` (campos da plataforma + sinônimos de cabeçalho), `suggestMapping.ts` (heurística local), `validateRows.ts` (CPF, datas, números, duplicados, conflitos), `normalize.ts`.
- `src/hooks/useEmployeeImport.ts`: parse, mapeamento, validação, chamada da RPC, histórico e mapeamentos salvos.
- Gating com o `ModuleGate`/`useModuleAccess` existentes (`core`).

**Edge function**
- `suggest-import-mapping`: recebe apenas os cabeçalhos e o catálogo de campos (nenhum dado pessoal) e retorna o mapeamento sugerido em JSON, via Lovable AI. Usada só quando a heurística local não resolve; falha da IA cai silenciosamente na heurística.
