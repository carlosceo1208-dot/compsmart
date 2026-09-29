# Fase 5: NR-1, auditar, completar e reorganizar o card

Este plano segue o escopo final dos sócios. O que já existe é aproveitado, e as 40 questões atuais ficam sem nenhuma mudança. Os dados reais continuam como estão: 2 diagnósticos, 440 respostas e 16 ações. Nenhuma tabela é apagada.

## Etapa 1: Auditoria (só leitura, com relatório antes de construir)
Para cada item abaixo, marcar se está pronto, parcial ou se falta:
- Acompanhamento do Colaborador (Minha Jornada e Check up Semanal) dentro do card NR-1
- Plano NR-1 Essencial (grau CNAE/INSS, exigências, ações e status Trial/Conformidade) dentro do card
- Onde o FIB aparece hoje. Já vi uma aba "FIB" avulsa, que será fundida no Clima.
- Onde os cruzamentos aparecem hoje. Já vi um grupo "Cruzamentos" no menu do NR-1.
- Anonimato k=5, cortes 40/60/80 (a regra atual usa 25/50/75), envio tudo-ou-nada
- Isolamento por empresa e regra do consultor dono
- Importação com prévia e rollback
- Laudo em PDF e Excel
- Landing /nr1 com urgência, teaser e aceite LGPD

## Etapa 2: Novo layout do card NR-1
Hoje o card é uma lista de 12 itens misturados. Ele passa a seguir as etapas do trabalho, em 4 blocos numerados:

```text
1. Preparar      Visão Geral · Plano NR-1 Essencial · Universo · Importação
2. Diagnosticar  Novo Diagnóstico · Ciclos e Histórico (comparar evolução)
3. Agir          Matriz de Risco · Plano de Ação
4. Acompanhar    Minha Jornada · Check up Semanal
```

- Cada bloco mostra um passo numerado e uma frase curta ("o que fazer aqui").
- Destaque para o próximo passo sugerido. Exemplo: sem Universo cadastrado, o destaque vai para "Universo".
- Selo "LEGAL OBRIGATÓRIO" no topo.
- Segurança Psicológica, Sociodemográfico, Terceiros, Vitalidade e Inteligência vão para um bloco recolhido, "Mais recursos". As telas não mudam (Fase 5B).
- Biblioteca e Auditoria ficam num rodapé discreto.
- A matriz de risco ganha um endereço com nome próprio, em vez de "/fib". O endereço antigo continua funcionando e leva à nova página.

## Etapa 3: Saem do card NR-1 (viram opções contratáveis)
- **Clima Organizacional 360°:** sai do card NR-1 e passa a ser um cartão próprio, que só aparece com o módulo Clima contratado.
- **FIB dentro do Clima:** entra como um bloco do questionário de clima, com as perguntas atuais preservadas. Ganha score de 0 a 100 por dimensão e um indicador FIB geral no painel do Clima, com evolução por ciclo e por área. A aba FIB avulsa é removida e o endereço antigo leva ao Clima.
- **Cruzamentos:** a lógica fica no servidor. A interface só aparece quando o módulo correspondente está contratado (Clima, Core/9-Box ou Desempenho). No NR-1 Essencial não aparecem. Nenhum dado é apagado.

## Etapa 4: Completar o que faltar
- Só os itens marcados como parcial ou falta na auditoria.
- Mesmo padrão da Maturidade: link anônimo com prazo, envio tudo-ou-nada e resultados só por média de grupo.
- Agente Psi: recebe só dados agregados e nunca diagnostica pessoas. Em risco crítico, destaca a necessidade de ação imediata. Os registros guardam só contagens.

## Preços na landing /nr1
- Só o NR-1: R$ 5,00 por colaborador por mês
- NR-1 como 2º módulo: R$ 2,50 por colaborador por mês
- A mudança é só no texto. Checkout e pagamento não mudam.

## Validação
- Verificação completa (tipos, lint, testes e build) sem erros
- Cálculo conferido à mão com 10 respostas conhecidas
- Grupo com 3 respostas mostra "dados insuficientes"; grupo com 7 mostra as médias
- Envio tudo-ou-nada confirmado
- Não veem nada: colaborador sem módulo, consultor sem projeto e visitante
- Card reorganizado conferido no navegador, no computador e no celular
- Com Clima contratado aparecem Clima, FIB e cruzamentos; sem Clima, não aparecem
- Landing em 1280px e 390px; lead só grava com aceite LGPD
- Dados de teste 100% fictícios e apagados no fim
- Carlos, Josue, Marli e os dados reais do NR-1 intocados
- NÃO publicar até a revisão de vocês

## Roadmap
- Registrar a Fase 5, a Fase 5B e o novo layout do card
- Varredura de segurança completa segue como GATE antes do relançamento comercial

## Detalhes técnicos
- Reorganizar os NAV_GROUPS em Nr1Layout.tsx. O grupo Clima e o grupo Cruzamentos passam a ser filtrados por has_module no cliente e na função do servidor.
- Nova rota /nr1/matriz-risco. /nr1/fib e /nr1/fib-bem-estar passam a ser Navigate.
- Unificar calcRisco com os cortes 40/60/80 numa função única, com vitest nos limites 40/41, 60/61 e 80/81. Antes, confirmar o impacto nos scores já gravados e relatar.
- Uma função de acesso nr1_pode_gerir: super admin OU consultor_dono_ativo OU RH/admin da empresa com has_module('nr1').
- Agregação com k=5 no servidor.
