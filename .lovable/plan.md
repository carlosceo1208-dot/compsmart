

## Atualizacao da Landing Page -- Versao Pos-Lancamento (22/02/2026)

### Contexto

Esta landing page sera publicada a partir de 22/02/2026, quando a promocao de 30% ja tera terminado. A Avaliacao de Desempenho passa a ser uma ferramenta permanente incluida em todos os planos (inclusive Enterprise). Nao deve haver nenhuma referencia a promocao de 30%, countdown, ou urgencia de lancamento. Os descontos que permanecem sao: **10% para plano anual** e **5% para pagamento via PIX**.

---

### Mudancas Planejadas

**1. PricingSection.tsx -- Remover toda logica de promocao de 30%**
- Remover constantes `LAUNCH_END_DATE`, `LAUNCH_DISCOUNT`, `isLaunchPeriod`, `timeRemaining`
- Remover countdown regressivo (linhas 377-407)
- Remover preco riscado e badge de desconto (linhas 482-491)
- Remover texto "Desconto valido ate 22/02/2026" (linhas 512-516)
- Simplificar `getDisplayPrice`: apenas preco cheio (mensal) ou com 10% anual
- Simplificar `getMonthlyEquivalent`: apenas desconto anual de 10%
- Remover `getFullPrice` (nao ha mais preco riscado)
- Atualizar nota no rodape (linha 573-577): trocar mensagem de "Promocao de Lancamento" por "Avaliacao de Desempenho integrada em todos os planos -- sem custo adicional"
- Habilitar badge "Desempenho Incluido" para Enterprise (remover condicao `!isEnterprise` na linha 467)
- Adicionar exibicao do preco por colaborador abaixo de cada preco:
  - Starter: "apenas R$ 5,98/colaborador"
  - Medium: "apenas R$ 4,50/colaborador"
  - Pro: "apenas R$ 3,80/colaborador"
- Adicionar badge de destaque: "2 ferramentas completas por menos de US$ 1/colaborador"

**2. DiscountCalculator.tsx -- Remover opcao de desconto de lancamento**
- Remover checkbox "30% Desconto de Lancamento" (linhas 137-178)
- Remover a prop `isLaunchPeriod` e constante `LAUNCH_DISCOUNT`
- Manter apenas descontos Anual (10%) e PIX (5%)

**3. planFeatures.ts -- Adicionar AVD ao Enterprise**
- Adicionar no array Enterprise: `{ text: "Avaliacao de Desempenho completa + PerformAI", tooltip: "Avaliacao 90, 180, 360, PDI, 9Box, Sucessao. PerformAI com analise preditiva e devolutivas.", isNew: true }`

**4. SocialProofSection.tsx -- Trocar icones por avatares humanos**
- Importar as imagens existentes: `avatar-man-1.png`, `avatar-woman-1.png`, `avatar-woman-2.png`
- Substituir o icone circular generico por `Avatar` com `AvatarImage` usando as fotos
  - Ricardo A. (CFO) -> avatar-man-1.png
  - Paula M. (Diretora RH) -> avatar-woman-1.png
  - Fernanda C. (CEO) -> avatar-woman-2.png

**5. CTASection.tsx -- Remover countdown e referencia a promocao**
- Remover countdown regressivo (linhas 57-83)
- Remover texto "Promocao ate 22/02/2026" (linha 122)
- Adicionar frase de impacto sobre valor: "Remuneracao + Desempenho integrados -- tudo por menos de R$ 6/colaborador"
- Manter CTA de trial 14 dias e botao de contato

**6. StickyCTABar.tsx -- Atualizar mensagem**
- Remover referencia a promocao e countdown de dias
- Trocar mensagem para: "2 ferramentas completas por menos de US$ 1/colab -- Trial 14 dias gratis"
- Remover logica de `LAUNCH_END` e `daysLeft`

**7. LaunchPromoBanner.tsx -- Transformar em banner de valor**
- Remover countdown e referencia a "30% OFF"
- Trocar para mensagem de lancamento da AVD: "Novidade! Avaliacao de Desempenho integrada -- Remuneracao + Desempenho em uma so plataforma"
- Manter CTA de "Comecar Agora"

**8. CompetitiveComparisonSection.tsx -- Atualizar linha de preco**
- Alterar a linha "Preco" para incluir valor por colaborador:
  - CompSmart: "A partir de R$ 3,80/colab"
  - Solucao Tradicional: "Sob consulta"
  - Ferramenta Isolada: "R$ 9+/colab (so AVD)"

**9. Index.tsx -- Remover FloatingTrialBanner (redundante)**
- Remover import e uso de `FloatingTrialBanner` para reduzir poluicao visual (ja existem StickyCTABar e LaunchPromoBanner)

---

### Secao Tecnica -- Resumo de Arquivos

| Arquivo | Alteracao |
|---|---|
| `src/components/landing/PricingSection.tsx` | Remover toda logica de promo 30%, adicionar preco/colaborador, badge Enterprise |
| `src/components/landing/DiscountCalculator.tsx` | Remover checkbox de lancamento, manter Anual + PIX |
| `src/config/planFeatures.ts` | Adicionar AVD no Enterprise |
| `src/components/landing/SocialProofSection.tsx` | Avatares humanos nos depoimentos |
| `src/components/landing/CTASection.tsx` | Remover countdown e promo, adicionar argumento de valor |
| `src/components/landing/StickyCTABar.tsx` | Mensagem de valor por colaborador |
| `src/components/landing/LaunchPromoBanner.tsx` | Transformar em banner de novidade AVD |
| `src/components/landing/CompetitiveComparisonSection.tsx` | Preco por colaborador na comparacao |
| `src/pages/Index.tsx` | Remover FloatingTrialBanner |

### Dados de Referencia para Preco por Colaborador

```text
Plano     | Limite | Mensal   | /colab  | Anual 10% | /colab anual | Anual+PIX 15% | /colab
Starter   | 50     | R$ 299   | R$ 5,98 | R$ 269    | R$ 5,38      | R$ 256        | R$ 5,11
Medium    | 200    | R$ 899   | R$ 4,50 | R$ 809    | R$ 4,05      | R$ 769        | R$ 3,84
Pro       | 500    | R$ 1.900 | R$ 3,80 | R$ 1.710  | R$ 3,42      | R$ 1.625      | R$ 3,25
```

Cotacao dolar ~R$ 5,80: todos os planos ficam abaixo de US$ 1/colaborador.

