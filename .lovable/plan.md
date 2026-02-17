

# Plano: Landing Page CompSmart 2.0 -- Secoes Prioritarias

## Resumo Estrategico

Implementacao focada nas secoes de maior impacto na conversao, mantendo o que ja funciona bem e adicionando os novos elementos interativos que diferenciam a CompSmart 2.0. Fotos de pessoas serao substituidas por ilustracoes vetoriais/icones profissionais. Video institucional sera removido do Hero. Concorrentes usarao nomes genericos.

---

## Fase 1 -- Secoes Prioritarias (esta implementacao)

### 1. Novo Hero Section com Calculadora Interativa
- **Substituir** o HeroSection atual (remover video, particulas, orbs)
- Split screen: 45% calculadora / 55% preview animado do dashboard
- **Calculadora "Calcule Seu Impacto"**: 3 inputs com sliders (colaboradores 50-5000, horas/mes 10-200, custo/hora R$50-500)
- Resultado em tempo real: custo anual perdido, dias de trabalho desperdicados, economia de 85%
- 2 CTAs: "Eliminar Esse Custo Agora" (vai para /auth) + "Ver Como Funciona" (scroll para demo)
- Trust badge: "14 dias gratis - Sem cartao - Cancele quando quiser"
- Lado direito: icone ilustrativo de dashboard com animacoes CSS (contadores, barras preenchendo, cards em fade-in)
- Badge flutuante: "87 empresas testando agora" com pulso
- Eyebrow: "GESTAO INTEGRADA DE DESEMPENHO + REMUNERACAO"
- Mobile: stack vertical, sliders touch-friendly, botoes full-width

### 2. Secao "Antes vs Depois" (novo componente)
- **Novo arquivo**: `BeforeAfterSection.tsx`
- Split visual com 2 colunas: "Sem CompSmart" (tom negativo, header cinza escuro) vs "Com CompSmart" (tom positivo, header verde)
- Listas com icones (circulos vermelhos vs checks verdes)
- Ilustracoes com icones Lucide (nao fotos)
- CTA centralizado abaixo

### 3. Demo Interativa -- Wizard 4 Passos (novo componente)
- **Novo arquivo**: `InteractiveDemoSection.tsx`
- Progress bar com 4 circulos (ativo/completo/futuro)
- **Passo 1**: Avaliar "Ana Silva" -- 4 competencias com estrelas clicaveis, calculo automatico da nota
- **Passo 2**: Recomendacao salarial -- gauge visual semicirculo, faixa R$5.500-7.500, salario atual vs recomendado, alerta de distorcao
- **Passo 3**: Simular impacto -- slider de novo salario, 3 cards de impacto (aumento, mensal, anual) atualizando em tempo real, grafico barras antes/depois
- **Passo 4**: Aprovar decisao -- resumo com checks verdes, botao "Aprovar" que dispara confete CSS e mensagem de sucesso
- CTA final: "Faca isso de verdade na sua empresa"
- Nao requer cadastro -- tudo roda no frontend com dados ficticios

### 4. Secao Integracao Desempenho + Remuneracao (novo componente)
- **Novo arquivo**: `IntegrationSection.tsx`
- Diagrama visual com 2 blocos (Desempenho azul + Remuneracao verde) conectados por setas animadas
- Sub-icones em grid 2x3 para cada bloco
- Badge flutuante: "Desempenho + Remuneracao incluidos -- Sem custo adicional"
- Texto explicativo e CTA

### 5. Atualizacao da PricingSection
- Adicionar badge "Desempenho + Remuneracao incluidos" em cada card de plano
- Feature adicional: "Modulo completo de Avaliacao (90, 180, 360, PDI, 9Box)"
- Nota de lancamento: "Promocao ate 22/02/2026 -- assine agora e garanta para sempre"
- Manter countdown existente (ja aponta para 22/02/2026)
- Badge "MAIS ESCOLHIDO" no plano Medium (ja existe como "Mais Popular")

### 6. Atualizacao do CTA Final
- Atualizar textos: "Pronto para eliminar planilhas e tomar decisoes justas baseadas em dados?"
- Countdown atualizado para 22/02/2026 (atualmente aponta para 07/01/2026)
- Trust badges atualizados
- Remover referencia a "Lancamento Oficial Janeiro 2026"

### 7. Atualizacao da FAQ
- Adicionar novas perguntas sobre integracao Desempenho + Remuneracao
- Atualizar pergunta sobre precos (data de lancamento 22/02)
- Adicionar pergunta sobre promocao de lancamento

### 8. Social Proof Dinamico (novo componente)
- **Novo arquivo**: `SocialProofSection.tsx`
- Notificacoes animadas (fade-in/fade-out sequencial, 4s cada)
- 3 micro-cases com icones ilustrativos (nao fotos), metricas destacadas
- Dados ficticios mas realistas

### 9. Comparacao Competitiva (novo componente)
- **Novo arquivo**: `CompetitiveComparisonSection.tsx`
- Tabela responsiva: CompSmart vs "Solucao Tradicional" vs "Ferramenta Isolada"
- Checks verdes, X vermelhos, alertas amarelos
- Scroll horizontal em mobile

### 10. Atualizacao do Index.tsx
- Reordenar secoes na nova sequencia:
  1. Hero (calculadora)
  2. Before/After
  3. Demo Interativa
  4. Integracao Desempenho+Remuneracao
  5. Como Funciona (manter HowItWorksSection existente, atualizar para 5 passos)
  6. Agentes IA (manter SmartAgentsSection existente)
  7. Social Proof
  8. Comparacao Competitiva
  9. Seguranca (manter SecuritySection existente)
  10. Precos
  11. FAQ
  12. CTA Final
- Remover secoes redundantes: TrustBar, LogoSlider, AIShowcaseSection, WhatsNewSection, PainPointsSection, SolutionSection, TargetAudienceSection, DifferentialsSection, TestimonialsSection
- Manter: LaunchPromoBanner, FloatingTrialBanner

### 11. Sticky CTA Bar (novo componente)
- **Novo arquivo**: `StickyCTABar.tsx`
- Aparece apos 30s ou 50% scroll
- Fixo no bottom (mobile) ou top (desktop)
- Dismissivel, reaparece apos 2min
- Texto: "Promocao termina em [X dias] - Trial 14 dias gratis"

---

## Secoes Existentes Mantidas (sem alteracao)
- `SecuritySection.tsx` -- ja cobre LGPD e seguranca
- `SmartAgentsSection.tsx` -- ja tem os 3 agentes
- `Header.tsx` -- navegacao existente
- `Footer.tsx` -- manter + adicionar links para calculadora, demo, FAQ

## Secoes Removidas da Pagina (arquivos mantidos mas nao importados)
- TrustBar, LogoSlider, AIShowcaseSection, WhatsNewSection
- PainPointsSection, SolutionSection, TargetAudienceSection
- DifferentialsSection, TestimonialsSection

---

## Detalhes Tecnicos

### Novos Arquivos
| Arquivo | Finalidade |
|---------|-----------|
| `src/components/landing/ImpactCalculator.tsx` | Calculadora interativa do Hero |
| `src/components/landing/BeforeAfterSection.tsx` | Secao Antes vs Depois |
| `src/components/landing/InteractiveDemoSection.tsx` | Demo wizard 4 passos |
| `src/components/landing/IntegrationSection.tsx` | Diagrama integracao |
| `src/components/landing/SocialProofSection.tsx` | Notificacoes + micro-cases |
| `src/components/landing/CompetitiveComparisonSection.tsx` | Tabela comparativa |
| `src/components/landing/StickyCTABar.tsx` | Barra fixa de CTA |

### Arquivos Modificados
| Arquivo | Alteracao |
|---------|----------|
| `src/components/landing/HeroSection.tsx` | Reescrita completa com calculadora |
| `src/components/landing/PricingSection.tsx` | Badges de desempenho, nota de lancamento |
| `src/components/landing/CTASection.tsx` | Textos e countdown atualizados |
| `src/components/landing/FAQSection.tsx` | Novas perguntas |
| `src/components/landing/Footer.tsx` | Links adicionais |
| `src/pages/Index.tsx` | Nova ordem de secoes |

### Dependencias
- Nenhuma nova dependencia necessaria
- Usa: React, Tailwind CSS, Lucide icons, Radix UI (Slider), Recharts (grafico barras da demo)
- Confete do Passo 4: animacao CSS pura (sem biblioteca adicional)

### Performance
- Lazy loading via IntersectionObserver para secoes abaixo do fold
- Calculadora e demo sao componentes leves (dados ficticios, sem API)
- Animacoes CSS com will-change e GPU acceleration
- Sem imagens pesadas (tudo icones/SVG)

---

## Fase 2 (futura, nao incluida agora)
- Chatbot IA no canto inferior direito
- Barra de busca na FAQ com autocomplete
- HowItWorksSection atualizado para 5 passos com timeline vertical
- Atualizacao da SmartAgentsSection com fundo escuro e particulas
- SEO meta tags

