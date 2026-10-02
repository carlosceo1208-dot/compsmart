# Nova Home da CompSmart (versão final v2 + adendo)

A nova landing vira a página inicial em compsmart.ia.br, sem criar /plataforma. A Home atual é reformulada por dentro: o que já existe evolui, e só as seções realmente novas são acrescentadas. O menu, o rodapé e a faixa "Estamos reconstruindo a CompSmart…" continuam como estão. O app, o painel, o banco e a cobrança não mudam. Nada vai ao ar sem aprovação.

## Endereços confirmados
- **Maturidade:** `/maturidade` (página pública). O questionário por convite é `/maturidade/responder/:token`, e `/diagnostico` é outra página.
- **Landing de Recrutamento:** `/modulos/selecao-rs`. Os endereços `/recrutamento/vagas` e `/recrutamento/candidatos` são telas internas do app.
- **Página antiga /pricing:** já não aparece no SEO nem no menu público. Continua funcionando só para os avisos de dentro do app.

## Seções, nesta ordem
1. **Aviso da NR-1**: substitui a faixa de urgência atual. Para não empilhar duas faixas no topo, o aviso vira um selo em cor de alerta, com bom contraste, na primeira linha do topo da Home: "Fiscalização da NR-1 começou. Portaria MTE 1.419/2024 — riscos psicossociais agora fazem parte do PGR." A faixa "Estamos reconstruindo…", que aparece no site inteiro, continua sozinha acima do menu.
2. **Topo**: novo título e subtítulo.
   - O botão "Diagnóstico gratuito em 2 min" abre o formulário. Depois do envio, mostra uma confirmação e leva para `/maturidade`.
   - O botão "Ver demonstração" desce até o vídeo.
   - Logo abaixo continua a faixa de proteção de dados (LGPD).
3. **Contraponto**: 3 cards.
4. **Plataforma + Consultoria** (nova): HR Services, com "Outcome as a Service (OaaS)" escrito por extenso.
5. **Diferencial**: os 4 módulos convergindo para um painel, desenhados em código.
6. **Maturidade** (nova): 5 níveis × 2 eixos e diagnóstico misto. O texto apresenta o modelo sem prometer o que a página `/maturidade` ainda não mostra, como o cruzamento entre o que a empresa percebe e o que os dados dela mostram. O botão "Descobrir meu nível" leva a `/maturidade`, e a nota sobre os consultores fica logo abaixo.
7. **8 agentes de IA**, cada um com o selo "IA". O HR Services fica fora desta grade.
8. **Recrutamento com inteligência** (nova): faixa salarial sugerida, triagem e match, com link para `/modulos/selecao-rs`. A integração com a folha entra nesta seção.
9. **Simulação de investimento**: usa o simulador atual.
   - Os botões "Fale com um especialista" e "Diagnóstico gratuito" abrem o mesmo formulário do topo.
   - Há um link para `/precos`.
   - Enquanto os preços carregam, aparece um bloco de espera. Se a leitura falhar, aparece "Sob consulta".
   - Se a lista de módulos vier vazia, a escolha fica desativada com um aviso, sem quebrar a página.
   - Não aparecem teste grátis, R$ 1 nem R$ 225.
10. **Materiais** (nova): a Home e a página `/materiais` leem a mesma lista de materiais.
    - Remuneração Estratégica: disponível para baixar, com o download funcionando como hoje.
    - NR-1 e Clima/9-Box: marcados "em breve", com captura de interesse. O texto avisa que o material será enviado quando estiver pronto, sem prometer envio imediato.
    - Botão "Ver todos os materiais".
11. **Ver demonstração**: o vídeo atual.
12. **Empresas-piloto**:
    - Espaços reservados para os logos.
    - "Exemplo real anonimizado": 10 respondentes, risco 49,93 (crítico).
    - Os 4 painéis com o selo "Exemplo ilustrativo".
    - A frase "plano gerado em minutos" não entra.
13. **Perguntas frequentes**: 7 perguntas. Os dados para o Google usam as mesmas 7.
14. **Fechamento e rodapé**: "Fale com um especialista" pelo WhatsApp e os links de LGPD e privacidade.

Saem da Home: o resumo de preços, que dá lugar ao simulador, e a seção "Como funciona".

No celular (390px):
- A grade dos agentes fica em 2 colunas, sem cortar os selos "IA".
- No seletor de módulos, os itens ficam um embaixo do outro, sem cortar os nomes dos agentes.

## Pendências (não bloqueiam)
- E-books de NR-1, Maturidade e Clima/9-Box ficam para depois. A captura de interesse já funciona, e a entrega é manual.
- A frase "plano gerado em minutos" só entra se for confirmada.
- Alinhar a página `/maturidade` ao modelo 5×2 com diagnóstico misto é uma etapa futura e vai para o roadmap.
- Redirecionar a página antiga `/pricing` ou alinhá-la ao novo modelo de preço fica para uma etapa separada.

## Detalhes técnicos
- Tudo é feito em `src/pages/Index.tsx` e `src/components/landing/pivot/`, sem uma pasta `home/` paralela.
- Componentes novos: `PlatformConsultingSection`, `MaturitySection`, `RecruitmentSection` e `MaterialsSection` (variantes compacta e completa; a completa também é usada em `Materiais.tsx`).
- Configuração única em `src/config/materiais.ts`, com slug, título, descrição, status (`disponivel` / `em_breve`), origem, lead_magnet e link.
- `EbookDownloadDialog` ganha dois modos: entrega (material disponível) e só interesse (material em breve).
- Componentes que mudam: `UrgencyBanner` (vira o selo do topo, ou é removido se ficar sem uso), `PivotHero`, `PainSection`, `CrossDataSection`, `ModulesGridSection`, `SocialProofPlaceholder`, `PivotFAQSection` e `PreFooterCTA`.
- Ficam como estão: `SecurityAssuranceStrip`, `VideoSection`, `VisualProofSection` e `AnnouncementBar`.
- `PayrollIntegrationsSection` passa para dentro de `RecruitmentSection`.
- `PricingSummarySection` e `PivotHowItWorks` são removidos.
  - Uma busca em todo o `src/` mostrou que eles e `PIVOT_FAQ_ITEMS` só aparecem em `Index.tsx`.
  - O `id="precos"` sai de `PricingSummarySection` e passa para o envoltório do simulador, sem ficar duplicado.
  - `#faq` continua em `PivotFAQSection`.
  - O verificador de código morto confere a remoção.
- `PricingSimulator` passa a receber os botões por props, e a Home reusa os mesmos handlers do topo. `usePublicPricing`, `perEmployeePrice` e `simulateMonthlyTotal` não mudam. Novo teste unitário: 100 colaboradores × 4 módulos = R$ 1.250; × 3 módulos = R$ 1.000.
- `LeadOrigem` ganha `"diagnostico-home"`. Os e-books reaproveitam `ebook:nr1` e `ebook:clima-9box`. A coluna `origem` da tabela de leads não tem restrição, então o banco não muda.
- Âncoras: `#modelo`, `#maturidade`, `#precos`, `#materiais`, `#demonstracao` e `#faq`. A rolagem por âncora que já existe na Home continua.
- Ids e telemetria: `cta-hero-diagnostico`, `cta-hero-demo`, `cta-maturidade`, `cta-simulador-especialista`, `cta-ebook-remuneracao`, `cta-ebook-nr1`, `cta-ebook-clima-9box` e `cta-footer-whatsapp`.
- Visual: só os tokens do projeto, fonte Inter, cards com cantos de 16 a 20px e badges pílula, sem fotos de banco de imagens. O SEO segue só por `src/config/seoRoutes.ts`.
- Validação:
  - Telas de 1280px e 390px.
  - Formulários gravando a origem correta.
  - Links e âncoras funcionando.
  - Simulador conferido com os dois exemplos e batendo com `get_public_pricing`.
  - Nenhum R$ 1, R$ 225 ou teste grátis na página.
  - Download da Remuneração Estratégica funcionando.
  - Cards "em breve" capturando o interesse sem prometer entrega.
  - Sem duas faixas empilhadas no topo.
  - Busca no código sem referências quebradas.
  - Selos "IA" e nomes dos agentes inteiros no celular.
  - `bun run ci` limpo e `roadmap.md` atualizado.

## Adendo final (execução fina)
- **Simulador em /precos:** hoje o `PricingSimulator` não recebe props, e `Precos.tsx` mostra o botão "Falar com especialista" fora dele.
  - Os botões novos entram como props opcionais. Sem as props, nada aparece, e `/precos` continua exatamente como está.
  - A Home passa os dois botões com os mesmos handlers do topo.
  - `usePublicPricing`, `perEmployeePrice` e `simulateMonthlyTotal` não mudam.
- **Teste de preço:** novo arquivo `src/hooks/usePublicPricing.test.ts`, que roda pelo Vitest dentro do `bun run ci`. Casos cobertos:
  - 100 colaboradores × 4 módulos = R$ 1.250.
  - 100 colaboradores × 3 módulos = R$ 1.000.
  - 100 colaboradores × 1 módulo = R$ 500.
  - Valor do módulo adicional (`additionalModulePrice`) = R$ 2,50.
- **Download do e-book:** hoje o arquivo vem de `src/assets/ebook-remuneracao-estrategica.pdf.asset.json`, entregue pelo `EbookDownloadDialog` com a origem atual `materiais-ebook-remuneracao`.
  - A configuração de materiais aponta para esse mesmo arquivo e esse mesmo fluxo, sem trocar o destino.
  - Validar o download completo pela Home e por `/materiais`.
- **SEO da Home:** em `src/config/seoRoutes.ts`, só a rota `/` muda.
  - Título: "CompSmart — O RH virou obrigação legal e alavanca estratégica".
  - Descrição: "8 agentes de IA e consultoria sob demanda que cruzam NR-1, clima, remuneração, desempenho e sucessão."
  - O endereço canônico e as demais rotas ficam intactos. A FAQ continua sendo enviada ao Google com as 7 perguntas.
- **Selo NR-1:** o conteúdo do `UrgencyBanner` vira o selo de alerta do topo da Home, sem criar outro componente. Se o arquivo ficar sem uso, é removido. O selo não entra no `AnnouncementBar`.
- **Validação extra:**
  - `/precos` carrega e o simulador funciona.
  - O teste de preço passa no CI.
  - O download funciona a partir da configuração.
  - O novo título e a nova descrição aparecem na Home.
  - O selo NR-1 aparece com bom contraste em 1280px e 390px, sem duas faixas empilhadas no topo.
