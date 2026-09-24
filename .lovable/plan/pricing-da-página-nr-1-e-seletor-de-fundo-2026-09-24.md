# Pricing da página NR-1 e seletor de fundo

## 1. Pricing da página `/nr1`
Substituir o bloco atual por uma apresentação completa, baseada na mesma configuração pública usada em `/precos`:

- Título: **“NR-1 a partir de R$ 5,00 por colaborador/mês”**.
- Subtítulo: **“Mesma regra dos demais módulos: R$ 5,00 por colaborador/mês no 1º módulo e R$ 2,50 nos módulos adicionais (50% de desconto). Semestral 5% · Anual 10% de desconto.”**
- Os valores exibidos continuarão vindo da configuração pública central, evitando preços duplicados no código.

### O que você recebe
Manter uma seção própria com os mesmos 13 recursos em todas as faixas:
Visão Geral, Universo, Matriz de Risco, Importação de Mapa de Risco, Segurança Psicológica, Sociodemográfico, Etapas, Novo Diagnóstico, Histórico, Plano de Ação, Gestão de Terceiros, Vitalidade e Inteligência.

### Faixas por porte
Apresentar quatro cards, deixando claro que o valor por colaborador é igual e que as faixas organizam atendimento e implantação:
- Essencial: 1 a 50 colaboradores.
- Profissional: 51 a 250 colaboradores.
- Corporativo: 251 a 1.000 colaboradores.
- Enterprise: 1.001+ colaboradores ou demandas especiais, sob consulta.

As três primeiras faixas exibirão o preço público por colaborador/mês no primeiro módulo; Enterprise exibirá “Sob consulta”.

### Simulador
Reutilizar o simulador de `/precos`, com:
- número de colaboradores;
- número de módulos;
- ciclo Mensal, Semestral e Anual;
- preço por colaborador/mês;
- total mensal após o desconto do ciclo;
- total do período para Semestral e Anual, incluindo o desconto aplicado.

Abaixo dele, incluir a nota exata:
> NR-1 conta como 1º módulo para o desconto dos adicionais. A contratação é feita dentro da plataforma, após o acesso. Grandes contratos podem ser negociados diretamente com o time comercial.

## 2. Limpeza de referências antigas
- Remover da apresentação pública da NR-1 nomes e valores antigos usados como pricing: Crescimento, Consolidação, Performance, Corporate, Pro e valores fixos anteriores.
- Ajustar qualquer texto de Gestão de Terceiros para **“incluso em todas as faixas do NR-1”**.
- Preservar sem mudanças as demais áreas: Mapa de Risco, Plano de Ação, Importação de Matriz, anonimato LGPD, FAQ, formulário de proposta e Diagnóstico grátis NR-1.
- Manter o título SEO atual: **“NR-1 Inteligente — Cruze risco psicossocial com 9Box e remuneração | CompSmart”**.

## 3. Seletor de fundo “Normal / Dark”
Adicionar um controle de duas opções nos dois cabeçalhos públicos:
- header da página principal e demais páginas públicas;
- header específico da página NR-1.

O seletor alternará o site inteiro entre **Normal** e **Dark**, usando o tema já existente e preservando a escolha durante a navegação e em visitas futuras. Ele ficará acessível também no menu móvel, sem criar conflito com os demais botões do header.

## Detalhes técnicos
- Reaproveitar `usePublicPricing`, `PricingSimulator` e os tokens de tema existentes.
- Extrair/reaproveitar a lista dos 13 recursos sem reativar os componentes antigos de planos ou checkout.
- Não alterar o checkout, as páginas autenticadas ou a lógica de contratação.
- Arquivos principais: `LandingNr1.tsx`, `PricingSimulator.tsx`, `PublicHeader.tsx`, `Nr1Header.tsx` e um controle compartilhado de tema, se necessário.

## Verificação
- Conferir no desktop e no celular a página `/nr1`, os quatro cards, os 13 recursos e o simulador.
- Validar exemplos de cálculo mensal, semestral e anual, incluindo o total do período.
- Confirmar que “Normal / Dark” aparece e funciona nos dois headers, persiste entre páginas e mantém textos e controles legíveis.
- Buscar na página pública da NR-1 qualquer referência residual aos preços e nomes de planos antigos.
- Confirmar compilação sem erros.
