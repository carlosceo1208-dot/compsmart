# Consolidar Maturidade Estrutural × Estilo de Gestão no hero da Home

## Estado confirmado
- O `PivotHero` atual contém o título, o subtítulo aprovado e os dois CTAs, mas ainda não contém a tag nem o quadro 5×2.
- A antiga `MaturitySection` já foi removida da Home e não será recriada.
- Os nomes oficiais já estão centralizados em `src/lib/maturidade.ts`, nas listas `NIVEIS_ESTRUTURAIS` e `ESTILOS_GESTAO`.
- O CTA principal atual abre o formulário com origem `diagnostico-home` e encaminha para `/maturidade` após a captura; esse funil será preservado.

## Alteração no topo da Home
- Reorganizar somente o `PivotHero` em duas áreas lado a lado no desktop:
  - **Esquerda:** tag “Maturidade da Gestão de Pessoas”, título atual, subtítulo atual e os CTAs “Diagnóstico gratuito em 2 min” e “Ver demonstração”.
  - **Direita:** quadro 5×2 com as colunas “MATURIDADE ESTRUTURAL” e “ESTILO DE GESTÃO”.
- Renderizar os cinco níveis estruturais diretamente de `NIVEIS_ESTRUTURAIS` e os cinco estilos diretamente de `ESTILOS_GESTAO`, sem listas ou rótulos duplicados no componente.
- Exibir no rodapé do quadro a nota exata: “O diagnóstico gratuito apresenta o nível de maturidade estrutural. O estilo de gestão integra o modelo completo conduzido com nossos consultores.”
- Logo abaixo da nota, incluir o link secundário “Descobrir meu nível →”, apontando diretamente para `/maturidade`.
- Manter o CTA principal de captura e “Ver demonstração” com seus destinos e identificadores atuais; o novo link não compete visualmente como terceiro botão primário.
- Preservar a imagem/símbolo atual como apoio da composição, ajustando apenas seu posicionamento dentro do novo arranjo.

## Responsividade
- Em 1280px, manter texto à esquerda e quadro à direita, ambos visíveis na primeira dobra.
- Em 390px, empilhar texto, CTAs e quadro nessa ordem; manter as duas colunas internas do quadro quando houver largura suficiente, com nomes completos, sem cortes ou sobreposição.
- Ajustar dimensões e espaçamentos apenas no hero para preservar a hierarquia e evitar que o quadro fique truncado.

## Escopo preservado
- Não recriar `MaturitySection` nem adicionar outro bloco de maturidade após “Só a CompSmart cruza…”.
- Não afirmar cruzamento entre percepção e realidade nem cálculo do Estilo de Gestão.
- Não alterar as demais seções, `/maturidade`, simulador, materiais, SEO, âncoras existentes, ids de telemetria, menu ou rodapé.
- Não publicar sem nova aprovação explícita.

## Validação
- Conferir a Home em 1280px e 390px: quadro na primeira dobra, ordem correta no celular e textos completos.
- Confirmar que “Descubra o nível de maturidade da sua gestão de pessoas.” aparece exatamente uma vez na Home.
- Confirmar que não existe quadro 5×2 abaixo da seção de cruzamentos.
- Testar o link “Descobrir meu nível →” até `/maturidade` e preservar o formulário do CTA “Diagnóstico gratuito em 2 min” e a âncora de “Ver demonstração”.
- Revalidar as âncoras existentes e o simulador: 100 colaboradores × 3 módulos = R$ 1.000; × 4 módulos = R$ 1.250.
- Rodar o verificador de código morto e `bun run ci`; revisar erros de prévia e garantir resultado limpo.
