
## Objetivo
Reformular a Landing NR-1 com pricing por faixa de colaboradores, simulador de desconto idêntico ao da Gestão de Remuneração e nova navegação no header (Planos, FAQ, Novidades).

## 1. Modelo de preços NR-1 (mensal recorrente, R$ 5/colaborador)

| Faixa | Colaboradores | Mensal | Por colaborador |
|---|---|---|---|
| Essencial | até 50 | R$ 250 | R$ 5,00 |
| Crescimento | 51–200 | R$ 1.000 | R$ 5,00 (teto) |
| Consolidação | 201–500 | R$ 2.500 | R$ 5,00 (teto) |
| Performance | 501–750 | R$ 3.750 | R$ 5,00 (teto) |
| Corporate | 751–1.000 | R$ 5.000 | R$ 5,00 (teto) |
| Enterprise | +1.000 | Sob consulta | — |

Observação: como o valor por colaborador é constante (R$ 5), o card destaca a **faixa** e o **valor mensal** — o "por colaborador" aparece como microcopy ("a partir de R$ 5/colaborador").

## 2. Componentes a criar

```
src/components/landing/nr1/
├── Nr1Header.tsx           ← header com Planos, FAQ, Novidades, NR-1, Ativar conta
├── Nr1PricingCards.tsx     ← 6 cards (5 faixas + Sob Consulta)
├── Nr1DiscountSimulator.tsx← reaproveita lógica do DiscountCalculator (anual -10%, PIX -5%)
└── Nr1Novidades.tsx        ← seção com 3 destaques
```

## 3. Cards de preço — layout

- Grid responsivo: `lg:grid-cols-6 md:grid-cols-3 grid-cols-1`
- Card "Crescimento" (51–200) marcado como **"Mais Popular"** (faixa típica do mercado-alvo)
- Card "Enterprise" com badge **"Sob Consulta"** e CTA "Falar com especialista"
- Cada card: ícone + nome da faixa + range de colaboradores + preço mensal grande + microcopy "R$ 5/colaborador" + lista enxuta de 4 features + CTA "Começar trial 14 dias"
- Toggle **Mensal / Anual** no topo (mostra preço com -10% quando Anual)
- Paleta `.nr1-scope` (azul #007BFF / verde #28A745)

## 4. Simulador de desconto (idêntico ao módulo de Remuneração)

Reaproveitar a lógica de `DiscountCalculator`:
- Selecionar plano base (Essencial/Crescimento/Consolidação/Performance/Corporate)
- Checkboxes: Plano Anual (-10%), Pagamento via PIX (-5%), demais descontos existentes
- Cálculo em tempo real com preço final destacado
- CTA "Solicitar proposta" → ancora em `#fale-conosco`

## 5. Header novo (substitui o atual da LandingNr1)

Botões: **Funcionalidades · Planos · FAQ · Ativar conta · NR-1 (ativo) · Novidades · Ir para Dashboard · Sair**

Cada item é uma âncora interna (`#planos`, `#faq`, `#novidades`) que faz smooth scroll para a seção correspondente na própria landing NR-1.

## 6. Seção "Novidades NR-1"

Três cards destacando:
1. **Cruzamento NR-1 × 9Box × Remuneração** — único no mercado; identifica talentos de alto desempenho em zona de burnout
2. **Pesquisa de Clima integrada + correlação COPSOQ** — causa raiz unificada entre clima organizacional e risco psicossocial
3. **Relatórios LGPD-compliant** — exportação PDF anonimizada pronta para fiscalização do MTE

## 7. Seção FAQ
Reaproveita o `Nr1Faq` existente, agora ancorado em `#faq`.

## 8. Ordem das seções na Landing
1. Header (novo)
2. Hero
3. Perguntas CHRO
4. Como Funciona
5. Prova de Correlação
6. **Planos (novo)** — 6 cards + simulador de desconto
7. **Novidades (novo)** — 3 destaques
8. Tabela Categoria
9. Gestão Terceiros
10. FAQ
11. Fale Conosco / Security / Footer

## Detalhes técnicos

- Criar `src/lib/nr1Pricing.ts` com array tipado das 6 faixas (id, label, range, monthlyPrice, isPopular, isCustom)
- `Nr1DiscountSimulator` aceita prop `plans` no mesmo shape do `DiscountCalculator` (id, name, priceMonthly) para máxima reutilização visual
- Sem mudanças em backend/DB — pricing é estático na landing (lead capture continua via formulário existente)
- Tipografia/cores: usar tokens `.nr1-scope` já definidos em `index.css`
- Mobile: cards empilham; toggle Mensal/Anual continua acessível

## Fora de escopo
- Não altera tabela `nr1_subscriptions` nem regras de billing reais
- Não cria checkout para NR-1 (continua "Solicitar proposta")
- Não toca na landing principal (`/`) nem em `Pricing.tsx`
