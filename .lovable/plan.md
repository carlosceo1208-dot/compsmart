# Nova Home da CompSmart (versão final v2)

A nova landing passa a ser a página inicial em compsmart.ia.br, sem criar /plataforma. A Home é reformulada por dentro: o que já existe evolui e só entram as seções realmente novas. O menu e o rodapé atuais não mudam. O app, o painel, o banco e a cobrança também não. Nada vai ao ar sem aprovação.

## Endereços confirmados
- **Maturidade:** `/maturidade` (página pública). O questionário por convite é `/maturidade/responder/:token`. `/diagnostico` é outra página.
- **Landing de Recrutamento:** `/modulos/selecao-rs`. `/recrutamento/vagas` e `/recrutamento/candidatos` são telas internas do app.
- **Página antiga /pricing:** já não está no SEO nem no menu público. Ela continua funcionando só para os avisos de dentro do app.

## Seções, nesta ordem
1. **Faixa superior NR-1**: substitui a faixa de urgência atual, com fundo de alerta e boa leitura.
2. **Topo**: novo título e subtítulo.
   - "Diagnóstico gratuito em 2 min" abre o formulário. Depois do envio, mostra uma confirmação e leva para `/maturidade`.
   - "Ver demonstração" desce até o vídeo.
   - Logo abaixo, mantém a faixa de proteção de dados (LGPD).
3. **Contraponto**: 3 cards.
4. **Plataforma + Consultoria** (nova): HR Services, com Outcome as a Service (OaaS) escrito por extenso.
5. **Diferencial**: 4 módulos convergindo para um painel, desenhado em código.
6. **Maturidade** (nova): 5 níveis × 2 eixos e diagnóstico misto. O botão "Descobrir meu nível" leva para `/maturidade`. Inclui a nota sobre os consultores.
7. **8 agentes de IA**, com selo "IA". O HR Services fica fora desta grade.
8. **Recrutamento com inteligência** (nova): faixa salarial sugerida, triagem e match, com link para `/modulos/selecao-rs`. Aqui entra também o bloco de integração com a folha.
9. **Simulação de investimento**: reaproveita o simulador atual com botões configuráveis.
   - Botões: "Fale com um especialista", "Diagnóstico gratuito" e link para `/precos`.
   - Enquanto carrega, mostra um bloco de espera. Se a leitura falhar, mostra "Sob consulta".
   - Sem teste, sem R$ 1 e sem R$ 225.
10. **Materiais** (nova, a mesma seção usada também na página `/materiais`):
    - Remuneração Estratégica: disponível para baixar.
    - NR-1 e Clima/9-Box: "em breve", com captura de interesse.
    - Botão "Ver todos os materiais".
11. **Ver demonstração**: o vídeo atual.
12. **Empresas-piloto**:
    - Espaços reservados para logos.
    - "Exemplo real anonimizado": 10 respondentes, risco 49,93 (crítico).
    - Sem a frase "plano gerado em minutos".
    - Abaixo, os 4 painéis com o selo "Exemplo ilustrativo".
13. **FAQ**: 7 perguntas. Os dados para o Google usam as mesmas 7.
14. **Fechamento e rodapé**: "Fale com um especialista" (WhatsApp), links de LGPD e privacidade.

Saem da Home: o resumo de preços (o simulador ocupa esse lugar) e o "Como funciona".

## Pendências (não bloqueiam)
- E-books de NR-1, Maturidade e Clima/9-Box ficam para depois. A captura de interesse já funciona, e a entrega é manual por enquanto.
- A frase "plano gerado em minutos" só entra se for confirmada.
- Redirecionar ou alinhar a página antiga `/pricing` fica para uma etapa separada.

## Detalhes técnicos
- Tudo é feito em `src/pages/Index.tsx` e `src/components/landing/pivot/`, sem pasta `home/` paralela.
- Componentes novos: `PlatformConsultingSection`, `MaturitySection`, `RecruitmentSection` e `MaterialsSection`. `MaterialsSection` tem uma variante compacta e outra completa, e também passa a ser usada em `Materiais.tsx`.
- Evoluem: `UrgencyBanner`, `PivotHero`, `PainSection`, `CrossDataSection`, `ModulesGridSection`, `SocialProofPlaceholder`, `PivotFAQSection` e `PreFooterCTA`.
- Mantidos: `SecurityAssuranceStrip`, `VideoSection` e `VisualProofSection`.
- `PayrollIntegrationsSection` é incorporada em `RecruitmentSection`.
- Removidos da Home: `PricingSummarySection` e `PivotHowItWorks`. Arquivos que ficarem sem uso são apagados, conferindo com o verificador de código morto.
- `PricingSimulator` passa a receber os botões por props, sem duplicar a lógica. `usePublicPricing`, `perEmployeePrice` e `simulateMonthlyTotal` não mudam. Novo teste unitário: 100×4 = R$ 1.250 e 100×3 = R$ 1.000.
- `EbookDownloadDialog` passa a receber `origem` e `lead_magnet` de cada card.
- `LeadOrigem` ganha `"diagnostico-home"`. Os e-books usam as origens que já existem, `ebook:nr1` e `ebook:clima-9box`. A coluna `origem` da tabela de leads não tem restrição de valores, então o banco não muda.
- Âncoras das seções: `#modelo`, `#maturidade`, `#precos`, `#materiais`, `#demonstracao` e `#faq`. A rolagem por âncora que já existe na Home é mantida.
- Ids e telemetria nos botões: `cta-hero-diagnostico`, `cta-hero-demo`, `cta-maturidade`, `cta-simulador-especialista`, `cta-ebook-remuneracao`, `cta-ebook-nr1`, `cta-ebook-clima-9box` e `cta-footer-whatsapp`.
- Visual: só tokens do projeto, fonte Inter, cards de 16 a 20px e badges pílula, sem fotos de banco de imagens. SEO só por `src/config/seoRoutes.ts`.
- Validação:
  - Telas de 1280px e 390px.
  - Formulários gravando a origem correta.
  - Links e âncoras funcionando.
  - Simulador com os dois exemplos, batendo com `get_public_pricing`.
  - Nenhum R$ 1, R$ 225 ou teste grátis na página.
  - `bun run ci` limpo e `roadmap.md` atualizado.
