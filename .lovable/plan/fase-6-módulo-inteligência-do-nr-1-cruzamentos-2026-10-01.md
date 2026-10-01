# Fase 6 — Módulo Inteligência do NR-1 (cruzamentos)

Reaproveita as telas atuais de Inteligência e Correlação Clima. Não reconstrói do zero. Nenhuma regra de acesso que já existe é alterada.

## O que o cliente vai ver

Uma única tela, "Inteligência", com 4 abas:

1. **Visão Executiva**: os três cruzamentos juntos, com uma lista do que resolver primeiro (causa raiz, talentos em risco, custo) e os alertas por unidade.
2. **Correlação Clima x NR-1**: as causas raiz e o botão "Gerar plano unificado" que já existem. A aba só aparece se a empresa contratou o Clima. Se não contratou, aparece o convite "Ativar módulo".
3. **Talentos em Risco (NR-1 x 9Box)**: exige o módulo Potencial & Sucessão. Sem ele, aparece o convite.
4. **Custo do Risco (NR-1 x Remuneração)**: exige o Insight. Sem ele, aparece o convite.

Unidades e grupos com menos de 5 pessoas: a contagem aparece, mas a nota não. O bloco fica oculto e aparece o aviso "N recorte(s) oculto(s)".

O endereço antigo /clima/correlacao passa a levar para a aba nova. O card do Clima continua separado no painel e ganha o atalho "Ver correlação com riscos psicossociais" (A6).

## Ajustes aprovados

- **A1 — Selo único em todo o NR-1.** O selo é: 70 ou mais, Saudável; de 55 a 69, Atenção; abaixo de 55, Crítico. A nota mostrada é a nota de saúde, calculada como 100 menos o risco. Exemplo: risco 49,93 dá saúde 50,1, que é Crítico.
  - O selo vale também para Diagnóstico, Matriz de Risco e Visão Geral, para a mesma nota não ganhar rótulos diferentes em telas diferentes.
  - Na Inteligência, uma nota de rodapé com dica explica a conta: "nota de saúde = 100 − risco psicossocial".
  - Se alguma tela antiga precisar ficar como está, isso vai para o dossiê como decisão explícita.
- **A2 — Custo de turnover com regra fixa, sem IA.** A conta é: nº de estrelas em ambiente de risco × salário médio anual dessas estrelas × 0,5.
  - O salário anual é o mensal × 13,33.
  - "Estrela em ambiente de risco" é quem está nos quadrantes 7 a 9 do 9Box, numa unidade com selo Atenção ou Crítico.
  - A fórmula aparece na tela e no cabeçalho da exportação.
- **A3 — Grupo mínimo de 5 também no grupo autodeclarado**, além da unidade.
- **A4 — Filtro por unidade feito na própria tela.** A função devolve todas as unidades, e o seletor que já existe continua funcionando.
- **A5 — Trava nos agentes que já existem**: nr1-bem-estar-agent, nr1-jornada-agent e nr1-plano-acao-assistant. Eles só usam dados de cruzamento se a empresa tiver o módulo de origem. Isso ganha um teste próprio.
- **A6 — Atalho dentro do Clima**, além do redirecionamento.
- **A7 — Ordem fixa da Visão Executiva.** As unidades seguem esta ordem:
  - primeiro, as que têm causa raiz confirmada, ou seja, Crítico no Clima e no NR-1 (só quando a empresa tem Clima);
  - depois, as com selo Crítico que têm estrelas em risco;
  - por fim, as demais, da maior para a menor estimativa de custo de turnover.
  - Em caso de empate, vem primeiro a unidade com mais colaboradores.
- **A8 — Área e grupo como recortes separados.** A área vem do cadastro do colaborador. O grupo autodeclarado vem da jornada que o próprio colaborador iniciou. São fontes diferentes, então não junto as duas numa coisa só, para não perder dados sem perceber.
  - O recorte por área traz todos os cruzamentos.
  - O recorte por grupo traz só a contagem e a nota de saúde, nunca ligadas a uma pessoa e sempre com o mínimo de 5.
  - O grupo não é ligado a 9Box nem a salário, para não identificar ninguém.
- **A9 — Mudança de rótulo precisa da sua aprovação.** Com o selo único, o "Diagnóstico Q1 2026", que tem risco 49,93, deixa de aparecer como Moderado e passa a Crítico, com nota de saúde 50,1. Isso aparece nas telas que já estão publicadas: Diagnóstico, Matriz de Risco e Visão Geral.
  - Na conferência, mostro essas telas antes e depois da mudança.
  - A mudança fica registrada no dossiê como item que só segue com a sua aprovação.

## Etapas

1. Juntar as duas telas em uma, com as 4 abas, o redirecionamento e o atalho no Clima (A6).
2. Fazer as contas por unidade e por grupo no servidor, com o mínimo de 5 pessoas (A3, A4).
   - A função confere papel, empresa, NR-1 e o módulo de origem.
   - Sem permissão, a recusa fica registrada no log de acessos e a função devolve 0 linhas, sem dar erro.
3. Montar a Visão Executiva com a lista de prioridades, por regras fixas, e o custo de turnover (A2).
4. Aplicar o selo único em todo o NR-1, com a explicação na tela (A1).
5. Travar cada cruzamento em 3 camadas: tela, banco e agentes (A5).
6. Fazer a exportação agregada com a nota de método: mínimo de 5 pessoas, período, fórmula da nota de saúde e fator de reposição.
7. Validar numa empresa de teste, que será apagada no fim.

## Validação

- Comparar o esperado com o obtido em 1280px e 390px, nestes casos:
  - empresa com e sem Clima, Potencial e Insight;
  - empresa sem NR-1;
  - unidade com 5 pessoas (aparece) e com 4 (fica oculta);
  - grupo autodeclarado com 5 (aparece) e com 4 (fica oculto);
  - outra empresa vê 0 linhas;
  - consultor com e sem projeto ativo;
  - agentes respeitando o módulo de origem;
  - a mesma nota com o mesmo selo em todas as telas;
  - o filtro por unidade continua funcionando;
  - o endereço /clima/correlacao abre a aba certa, e o atalho do card Clima leva ao mesmo lugar;
  - a Visão Executiva segue a ordem fixa da A7.
- Abrir o PDF e a planilha exportados para conferir.
- Depois da limpeza, as contagens batem com a linha de base: 4 acessos, 2 auditorias, respostas 440/0/0, 9 check-ups, 18 logins, 2 leads.
- `bun run ci` limpo. AGENTS.md e roadmap.md atualizados.
- Nada é publicado sem a aprovação explícita do CEO.

## Detalhes técnicos

- `nr1_inteligencia_unidades(p_inicio, p_fim)`:
  - SECURITY DEFINER, com search_path fixo.
  - Usa `rh_admin_da_empresa`/`get_user_root_company_id_strict`, `has_module('nr1')` e `nr1_consultor_liberado`.
  - Preenche as colunas de 9Box só com `has_module('potencial-sucessao')` e as de salário só com `has_module('insight')`.
  - Recorte por `coalesce(department, grupo)` com n≥5. A recusa grava em `nr1_access_log` e termina com WARNING + RETURN.
- `nr1_clima_correlacao()` passa a ler `vw_nr1_clima_copsoq_correlacao`, com a mesma trava mais `has_module('clima')`.
- `useNr1Intelligence` passa a usar a função nova, e não mais `v_talent_intelligence_dashboard` direto.
- `src/lib/nr1Selo.ts` (`seloSaude`, `notaSaude = 100 − risco`) reaproveita os limites de `statusSegPsi`. As telas do NR-1 que hoje usam `calcRisco` para mostrar o rótulo passam a usar `seloSaude`. Hoje existe o teste `nr1-risk-thresholds`; ele ganha um teste equivalente para o selo.
- Agentes: conferência com `has_module` do módulo de origem antes de incluir dados de cruzamento no contexto. Sem o módulo, os dados ficam de fora e a resposta diz "módulo não contratado".
- Rotas: `/nr1/inteligencia?aba=…` e o redirecionamento de `/clima/correlacao`.
