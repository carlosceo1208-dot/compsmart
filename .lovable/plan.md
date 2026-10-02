# Nova Home da CompSmart (versão corrigida)

A nova landing passa a ser a página inicial em compsmart.ia.br, sem criar /plataforma. A navegação para Preços, Maturidade, Landing NR-1, Landing de Recrutamento e Materiais continua. O app, o painel, o banco e a cobrança não mudam. Nada vai ao ar sem aprovação.

A Home atual vai ser reformulada por dentro: as seções que já existem são evoluídas e só entram as realmente novas. Não haverá cópia paralela da página.

## Seções, nesta ordem
1. **Faixa superior**, no lugar da faixa de urgência atual: "Fiscalização da NR-1 começou. Portaria MTE 1.419/2024 — riscos psicossociais agora fazem parte do PGR." Fundo de alerta/crítico, com contraste adequado para leitura.
2. **Topo**:
   - Título: "O RH virou obrigação legal e alavanca estratégica. A CompSmart faz os dois."
   - Subtítulo: 8 agentes de IA mais consultoria sob demanda.
   - Botão "Diagnóstico gratuito em 2 min": abre o formulário de captura.
   - Botão "Ver demonstração": abre a demonstração ou desce até o vídeo.
3. **Contraponto**: 3 cards de 2 linhas cada:
   - Consultoria cara e dependente de humanos.
   - Clima que vira PDF esquecido na gaveta.
   - Anonimato de fachada.
4. **Plataforma + Consultoria** (nova): "A estrutura a gente entrega. O resultado, também."
   - Coluna Plataforma: 8 módulos, automação e dados que se cruzam.
   - Coluna HR Services: consultores seniores por demanda, com "Outcome as a Service (OaaS)" escrito por extenso na primeira vez.
5. **Diferencial**: "Só a CompSmart cruza NR-1 × Clima × 9-Box × Remuneração", com um desenho dos 4 módulos convergindo, feito em código, sem imagem.
6. **Maturidade** (nova):
   - 5 níveis × 2 eixos.
   - Diagnóstico misto, comparando o que é percebido com o que os dados mostram.
   - Botão "Descobrir meu nível", que leva à página de Maturidade.
   - Nota sobre os consultores.
7. **8 agentes de IA**: Remu, Insight, Match, Psi, Clima, Talent, Evolve e Potencial. Cada card traz nome, agente, uma frase e o selo "IA". O HR Services fica fora desta grade.
8. **Recrutamento com inteligência** (nova):
   - Faixa salarial sugerida ao criar a vaga, com base em CBO, descrição e nível/grade.
   - Triagem e match.
   - Link para a Landing de Recrutamento (/modulos/selecao-rs).
9. **Simulação de investimento**:
   - Usa o simulador que já existe em /precos, sem mudar a regra de preço, que já tem o desconto progressivo.
   - Botões "Fale com um especialista" e "Diagnóstico gratuito", mais um link para /precos.
   - Mostra um bloco de carregamento enquanto lê os preços; se a leitura falhar, mostra "Sob consulta".
   - Sem "Começar teste", sem R$ 1 e sem R$ 225.
10. **Materiais**: link para /materiais, com os cards na situação real:
    - Remuneração Estratégica: disponível para baixar.
    - NR-1 e Riscos Psicossociais: em breve, com captura de interesse.
    - Clima e 9-Box: em breve, com captura de interesse.
    - Nenhum e-book novo é criado agora.
11. **Ver demonstração**: o vídeo atual.
12. **Empresas-piloto**:
    - Espaços reservados para logos, sem nomes.
    - Exemplo marcado "Exemplo real anonimizado": 10 respondentes, risco 49,93 (crítico).
    - A frase "plano gerado em minutos" fica de fora até ser confirmada.
    - Abaixo, os 4 painéis com o selo "Exemplo ilustrativo".
13. **FAQ**: as 7 perguntas, com respostas objetivas e sem prometer o que a plataforma não faz.
14. **Rodapé**: chamada "Fale com um especialista" (WhatsApp), links de LGPD e privacidade, nome e símbolo da plataforma.

## Pendências, sem bloquear a publicação
- **E-books de NR-1, Maturidade e Clima/9-Box**: ficam para depois. A captura de interesse já funciona e a entrega é manual até os arquivos existirem.
- **Frase "plano gerado em minutos"**: só entra se for confirmada.
- **Página antiga /pricing** (planos fixos de R$ 299, R$ 899 e R$ 1.900): os avisos de fim de teste e a tela de cobrança de dentro do app levam para ela. Por isso, mexer nela altera o app, que está fora do escopo desta etapa. Nesta etapa ela fica fora do menu, do sitemap e dos links da landing. Se ela deve ser redirecionada para /precos ou alinhada ao modelo por colaborador fica para sua decisão, numa etapa à parte.

## Detalhes técnicos
- Reformular `src/pages/Index.tsx` e os componentes de `src/components/landing/pivot/`: `PivotHero`, `UrgencyBanner`, `PainSection`, `CrossDataSection`, `ModulesGridSection`, `SocialProofPlaceholder`, `PivotFAQSection` (o JSON-LD acompanha as 7 perguntas) e `PreFooterCTA`.
- Seções novas também em `pivot/`: `PlatformConsultingSection`, `MaturitySection`, `RecruitmentSection` e `MaterialsSection`.
- Reaproveitar `PublicLayout`, `LeadForm`, `DemoDialog`, `EbookDownloadDialog`, `PricingSimulator`, `VideoSection`, `VisualProofSection`, `src/config/visualProofData.ts` e `src/config/landingModules.ts`.
- `PayrollIntegrationsSection`, `PivotHowItWorks`, `PricingSummarySection` e `SecurityAssuranceStrip` não estão na nova ordem. Cada um será incorporado a outra seção ou removido, conferindo com o verificador de código morto.
- `LeadOrigem`: incluir `"diagnostico-home"` e reaproveitar `ebook:nr1` e `ebook:clima-9box`. A coluna `origem` da tabela `leads` não tem restrição de valores, então o banco não muda.
- Preço: manter `usePublicPricing` e `perEmployeePrice` como estão. Novo teste unitário: 100 colaboradores com 4 módulos = R$ 1.250; com 3 módulos = R$ 1.000.
- Ids e telemetria nos botões: `cta-hero-diagnostico`, `cta-hero-demo`, `cta-maturidade`, `cta-simulador-especialista`, `cta-ebook-nr1`, `cta-ebook-remuneracao` e `cta-footer-whatsapp`.
- Visual: só tokens do projeto, fonte Inter, cards de 16 a 20px e badges pílula. Sem fotos de banco de imagens.
- SEO só por `src/config/seoRoutes.ts`.
- Validação na prévia:
  - Telas de 1280px e 390px.
  - Formulários gravando o lead com a origem correta.
  - Todos os links, incluindo "Descobrir meu nível".
  - Simulador com os dois exemplos.
  - Nenhum teste grátis, R$ 1 ou R$ 225 na página.
- Rodar `bun run ci` até ficar limpo e atualizar `roadmap.md`.
