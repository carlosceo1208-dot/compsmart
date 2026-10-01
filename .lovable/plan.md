# Fase 6 — Módulo Inteligência do NR-1 (cruzamentos)

Reaproveita as telas atuais de Inteligência e Correlação Clima. Não reconstrói do zero. Nenhuma regra de acesso que já existe é alterada.

## O que o cliente vai ver

Uma única tela, "Inteligência", com 4 abas:

1. **Visão Executiva**: os três cruzamentos juntos, com uma lista do que resolver primeiro (causa raiz, talentos em risco, custo) e os alertas por unidade.
2. **Correlação Clima x NR-1**: as causas raiz e o botão "Gerar plano unificado" que já existem. A aba só aparece se a empresa contratou o Clima. Se não contratou, aparece o convite "Ativar módulo".
3. **Talentos em Risco (NR-1 x 9Box)**: exige o módulo Potencial & Sucessão. Sem ele, aparece o convite.
4. **Custo do Risco (NR-1 x Remuneração)**: exige o Insight. Sem ele, aparece o convite.

Em todas as abas usamos um selo só: 70 ou mais é Saudável, de 55 a 69 é Atenção, abaixo de 55 é Crítico. Ele substitui o "Baixo/Moderado/Alto/Crítico".

Unidades com menos de 5 pessoas: a contagem aparece, mas a nota não. O bloco fica oculto e aparece o aviso "N recorte(s) oculto(s)".

Exportação em PDF e planilha, sempre com dados agregados e uma nota sobre o método. Vou abrir os arquivos para conferir, não só gerar.

O endereço antigo /clima/correlacao passa a levar para a aba nova. O card do Clima continua separado no painel.

## Ponto de atenção sobre o selo

A nota do COPSOQ é de risco: quanto maior, pior. O selo 70/55 trata nota alta como boa. Por isso, na Inteligência a nota mostrada vai ser de saúde, calculada como 100 menos o risco. Exemplo: o "Diagnóstico Q1 2026", com risco 49,93, aparece com 50,1, Crítico. As telas de Diagnóstico e Matriz de Risco ficam como estão. Se preferir outra regra, me diga antes de aprovar.

## Etapas

1. Juntar as duas telas em uma, com as abas e o redirecionamento.
2. Fazer as contas por unidade no servidor (hoje elas são feitas no navegador). A função confere papel, empresa, NR-1 e o módulo de origem de cada cruzamento. Sem permissão, a recusa fica registrada no log de acessos e a consulta devolve 0 linhas, sem dar erro. O grupo mínimo de 5 também é aplicado no servidor.
3. Montar a Visão Executiva com a lista de prioridades. A lista segue regras fixas, sem usar IA, para não inventar números.
4. Trocar para o selo único em todo o módulo.
5. Travar cada cruzamento em 3 camadas: tela, banco e agente. Hoje a Inteligência não tem agente próprio. Por isso a trava do agente vale para os agentes que já leem esses dados, sem criar um agente novo.
6. Fazer a exportação agregada com a nota sobre o método.
7. Validar numa empresa de teste, que será apagada no fim.

## Validação

- Comparar o resultado esperado com o obtido, em telas de 1280px e 390px. Casos testados:
  - empresa com e sem Clima, Potencial e Insight;
  - empresa sem NR-1;
  - unidade com 5 pessoas (aparece) e com 4 (fica oculta);
  - outra empresa vê 0 linhas;
  - consultor com e sem projeto ativo.
- Abrir o PDF e a planilha exportados para conferir.
- Depois da limpeza, as contagens precisam bater com a linha de base: 4 acessos, 2 auditorias, respostas 440/0/0, 9 check-ups, 18 logins, 2 leads.
- Rodar `bun run ci` sem erros. Atualizar AGENTS.md e roadmap.md.
- Nada vai ser publicado sem a sua aprovação explícita.

## Detalhes técnicos

- Nova função `nr1_inteligencia_unidades(p_inicio, p_fim)`, SECURITY DEFINER e com search_path fixo. Usa `rh_admin_da_empresa`/`get_user_root_company_id_strict`, `has_module('nr1')` e `nr1_consultor_liberado`. Só preenche as colunas de 9Box se `has_module('potencial-sucessao')` e as de salário se `has_module('insight')`. Esconde a unidade quando houver menos de 5 pessoas (`n<5`). Recusa: grava em `nr1_access_log`, emite WARNING e faz RETURN.
- A visão `vw_nr1_clima_copsoq_correlacao` passa a ser lida por uma função com a mesma trava e com `has_module('clima')`.
- `useNr1Intelligence` deixa de ler a `v_talent_intelligence_dashboard` direto e passa a usar a função nova.
- `src/lib/nr1Selo.ts` (`seloSaude`) reaproveita os limites de `statusSegPsi`. `calcRisco` continua existindo para as outras telas.
- Exportação com `csvExport`/`pdfExport` e cabeçalho metodológico (k=5, período, fórmula da nota de saúde).
- Rotas: `/nr1/inteligencia?aba=…` e `/clima/correlacao` → redirecionamento.
