# Refinamento do funil de contratação

## Objetivo
Transformar o funil atual da página `/modulos/selecao-rs` em um componente visual unificado e profissional, integrado à seção “O que você passa a acompanhar”.

## Alterações

### 1. Funil unificado
- Envolver o funil em um único card com fundo de superfície, borda sutil, sombra suave e cantos coerentes com os cards da página.
- Adicionar o título **“Funil de contratação”** e um subtítulo curto sobre o avanço dos candidatos pelas etapas.
- Manter as cinco etapas, sem números ou percentuais:
  **Triagem → Entrevista RH → Entrevista Gestor → Proposta → Contratado**.
- Apresentar cada etapa como um card com ícone e progressão visual azul → teal → verde, usando os tokens existentes.
- Substituir as setas soltas por ícones gráficos de chevron, com alinhamento e espaçamento uniformes.
- No celular, empilhar as etapas e girar os chevrons para indicar o avanço vertical.

### 2. KPI ilustrativo
- Adicionar ao mesmo conjunto visual o rótulo discreto **“Exemplo ilustrativo de tela”**.
- Exibir o destaque **“Tempo médio de fecho: 21 dias”** com badge verde **“↓ −40%”**.
- Manter esse dado claramente identificado como simulação de produto, não como resultado de cliente.

### 3. Integração visual
- Harmonizar métricas, funil e KPI com o mesmo padrão de bordas, superfícies, tipografia e espaçamento.
- Manter o componente compacto, centralizado e contido na largura da página.
- Não alterar a listagem ilustrativa de vagas nem outras seções.

## Validação
- Rodar lint, tipos, testes, verificação de código não utilizado e build completo.
- Conferir a página em 1280 px e 390 px: alinhamento, chevrons gráficos, KPI visível e empilhamento sem cortes.
- Confirmar a faixa “Em reconstrução” em `/modulos/selecao-rs` e sua ausência em `/vagas`.
- Registrar imagens do antes e depois para apresentar no retorno final.

## Detalhes técnicos
- Reutilizar componentes de ícone e tokens semânticos já presentes no projeto.
- Preservar `aria-label="Etapas do funil de contratação"` na lista ordenada.
- Respeitar a preferência do sistema por movimento reduzido; o novo conjunto não terá animação própria.
