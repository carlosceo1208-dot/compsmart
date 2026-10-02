# Nova Home da CompSmart (descritivo do CEO)

A nova landing substitui a página inicial em compsmart.ia.br. Não cria /plataforma. Mantém a navegação para Preços, Maturidade, Landing NR-1 e Landing de Recrutamento. Nada do app, do painel, do backend ou da cobrança muda. Nada é publicado sem aprovação.

## Seções, nesta ordem
1. **Faixa superior**: "Fiscalização da NR-1 começou. Portaria MTE 1.419/2024 — riscos psicossociais agora fazem parte do PGR." Fundo de alerta/crítico com contraste AA. Substitui a faixa de urgência atual.
2. **Topo**: título e subtítulo do descritivo. Botão "Diagnóstico gratuito em 2 min" abre formulário leve (nome, e-mail, empresa, porte, telefone/WhatsApp) e grava o lead. Botão "Ver demonstração" leva à seção do vídeo.
3. **Contraponto**: 3 cards com 2 linhas cada (consultoria cara, clima na gaveta, anonimato de fachada).
4. **Plataforma + Consultoria**: "A estrutura a gente entrega. O resultado, também." Duas colunas: Plataforma (8 módulos) e HR Services (Outcome as a Service (OaaS) por extenso na primeira menção).
5. **Diferencial**: "Só a CompSmart cruza NR-1 × Clima × 9-Box × Remuneração", com desenho dos 4 módulos convergindo para um painel (feito em código, sem imagem).
6. **Maturidade**: 5 níveis × 2 eixos, diagnóstico misto, botão "Descobrir meu nível" para a página de Maturidade que já existe, e a nota sobre os consultores.
7. **8 agentes de IA**: Remu, Insight, Match, Psi, Clima, Talent, Evolve, Potencial. Cada card com nome, agente, 1 frase e selo "IA". O HR Services fica fora da grade (seção 4).
8. **Recrutamento com inteligência**: faixa salarial sugerida ao criar a vaga (CBO, descrição, nível/grade), triagem e match. Link para a Landing de Recrutamento.
9. **Simulação de investimento** (detalhes abaixo).
10. **Dois e-books lado a lado**: "O que muda com a NR-1 de Saúde Mental" e "Guia de Maturidade da Gestão de Pessoas", cada um com campo de e-mail que grava o lead.
11. **Ver demonstração**: o vídeo da Home atual.
12. **Prova social / Empresas-piloto**: espaços reservados para logos (sem nomes), mais o exemplo marcado "Exemplo real anonimizado": empresa com 10 respondentes, risco psicossocial 49,93 (crítico). A frase "plano de ação gerado em minutos" só entra se você confirmar que isso foi medido. Abaixo, entram os 4 painéis da prova visual atual, com o selo "Exemplo ilustrativo".
13. **FAQ**: as 7 perguntas, com respostas objetivas e sem prometer o que a plataforma não faz.
14. **Rodapé**: chamada final "Fale com um especialista" (WhatsApp), links de LGPD e privacidade, nome e símbolo da plataforma.

## Simulação de investimento (seção 9)
- Os valores vêm do cadastro de preços. Nenhum valor fica escrito na página, e não há selo de teste nem oferta de "R$ 1".
- O visitante informa o número de colaboradores e marca os módulos. Cada módulo aparece com o nome do seu agente.
- Fórmula: o 1º módulo custa colaboradores × valor cheio (R$ 5,00). Cada módulo adicional custa colaboradores × 50% (R$ 2,50). O total aparece na hora, em R$, com o detalhamento "x módulos · y colaboradores".
- Conferência: 100 colaboradores com 4 módulos = R$ 1.250/mês; com 3 módulos = R$ 1.000/mês.
- Enquanto o cadastro carrega, aparece um bloco de carregamento. Se a leitura falhar, aparece "Sob consulta", nunca um valor de reserva.
- Os botões são "Fale com um especialista" e "Diagnóstico gratuito", sem "Começar teste". Há um link para a página de Preços.
- Decisão: reaproveitar o cálculo de preço que já existe, apenas conferindo e trocando a regra pela de desconto progressivo, em vez de criar outro. Assim, a Home e a página de Preços dão sempre o mesmo resultado.

## Pendências de conteúdo
- Os e-books "NR-1 de Saúde Mental" e "Guia de Maturidade" ainda não estão no projeto. A captura funciona, e a entrega fica manual até você enviar os PDFs. Se "NR-1 de Saúde Mental" for o Manual NR-1 que já está no projeto, a entrega passa a ser automática.
- Falta confirmar a frase "plano gerado em minutos".

## Detalhes técnicos
- Reescrever `src/pages/Index.tsx` com novos componentes em `src/components/landing/home/`. Reaproveitar `PublicLayout`, `DemoDialog`, `LeadForm`/`usePublicLead`, `usePublicPricing`, `VideoSection`, `VisualProofSection` e `visualProofData`.
- Somar ao tipo `LeadOrigem` (só no código) as origens `diagnostico-home`, `ebook:nr1-saude-mental` e `ebook:maturidade`. Os textos de origem são livres na tabela de leads, então não há alteração no banco. Se o campo de origem tiver restrição, conferir antes de gravar.
- Cálculo único em `src/lib/` lendo `get_public_pricing()`, com teste unitário dos dois exemplos de referência. A página `/precos` passa a usar o mesmo cálculo.
- Botões de conversão com ids rastreáveis (`cta-hero-diagnostico`, `cta-hero-demo`, `cta-maturidade`, `cta-simulador-especialista`, `cta-ebook-nr1`, `cta-ebook-maturidade`, `cta-footer-whatsapp`) e evento de telemetria.
- Usar só os tokens de cor do projeto, a fonte Inter e cards com cantos de 16 a 20px. Sem fotos de banco de imagens.
- SEO só por `seoRoutes.ts`. O JSON-LD da FAQ passa a usar as 7 perguntas novas.
- Componentes da Home antiga que ficarem sem uso serão removidos e conferidos pelo verificador de código morto.
- Verificação na prévia: 1280px e 390px, envio dos formulários, links para Preços, Maturidade, NR-1 e Recrutamento, o botão "Descobrir meu nível" e o simulador com os dois exemplos. Rodar `bun run ci` até ficar limpo e atualizar o roadmap.
