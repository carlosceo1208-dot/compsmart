

## Recuperar Seções Essenciais e Adicionar Avaliação de Desempenho

### Problema Identificado

Quatro seções importantes da landing page publicada atualmente existem como componentes prontos, mas foram **removidas ou nunca incluídas** no `Index.tsx`:

1. **LogoSlider** -- "Empresas de todos os tamanhos confiam na CompSmart" (carrossel animado de setores)
2. **SolutionSection** -- "O que o CompSmart entrega" (3 pilares com tabs)
3. **TargetAudienceSection** -- "CompSmart para Todos os Portes" (PE, ME, GE)
4. **DifferentialsSection** -- "Por que somos diferentes?" (6 diferenciais)

### Mudancas Planejadas

**1. Index.tsx -- Adicionar as 4 secoes de volta**

Inserir na ordem correta para manter o fluxo narrativo:

```text
Header
HeroSection
VideoSection
LogoSlider              <-- ADICIONAR (logo apos video, prova social rapida)
BeforeAfterSection
SolutionSection         <-- ADICIONAR (o que entregamos, com AVD)
InteractiveDemoSection
IntegrationSection
HowItWorksSection
TargetAudienceSection   <-- ADICIONAR (portes de empresa)
SmartAgentsSection
DifferentialsSection    <-- ADICIONAR (por que somos diferentes)
SocialProofSection
CompetitiveComparisonSection
SecuritySection
PricingSection
FAQSection
CTASection
Footer
LaunchPromoBanner
StickyCTABar
```

**2. SolutionSection.tsx -- Adicionar 4o pilar "Avaliacao de Desempenho"**

Transformar de 3 pilares para 4, adicionando uma nova tab:

- Tab: "Avaliacao de Desempenho" (icone: Target, cor: orange)
- Cards dentro da tab:
  - **Avaliacao 360** -- "Ciclos de avaliacao 90, 180 e 360 graus com feedback estruturado e devolutivas com IA"
  - **Matriz 9Box e PDI** -- "Classificacao automatica de performance x potencial com planos de desenvolvimento individual"
  - **Plano de Sucessao** -- "Mapeamento de sucessores por posicao-chave com analise de prontidao e gaps"
- Ajustar o grid da TabsList de `grid-cols-3` para `grid-cols-4`

**3. DifferentialsSection.tsx -- Adicionar diferencial de AVD integrada**

Adicionar um 7o diferencial (ou substituir um existente):
- Titulo: "Desempenho + Remuneracao Integrados"
- Descricao: "Unica plataforma que conecta avaliacao de desempenho a decisoes salariais -- merito, bonus e promocoes baseados em dados reais"

### Secao Tecnica

| Arquivo | Alteracao |
|---|---|
| `src/pages/Index.tsx` | Importar e adicionar LogoSlider, SolutionSection, TargetAudienceSection, DifferentialsSection |
| `src/components/landing/SolutionSection.tsx` | Adicionar 4o pilar "Avaliacao de Desempenho" com 3 cards (360, 9Box/PDI, Sucessao), ajustar grid para 4 colunas |
| `src/components/landing/DifferentialsSection.tsx` | Adicionar diferencial "Desempenho + Remuneracao Integrados" |

