# Card visual do funil de contratação em /modulos/selecao-rs

## Objetivo
Na página "Recrutamento & Seleção" (`/modulos/selecao-rs`), adicionar na seção **"O que você passa a acompanhar"** (id `metricas`) um card compacto com a imagem do funil de contratação — mockup "Seleção & R&S — Funil de Contratação", com as etapas **Triagem → Entrevista RH → Entrevista Gestor → Proposta → Contratado**.

## 1. Gerar a imagem do mockup
A imagem não existe no projeto — será criada com o gerador de imagens:
- Título visível na imagem: "Seleção & R&S — Funil de Contratação"
- 5 etapas em sequência com setas: Triagem, Entrevista RH, Entrevista Gestor, Proposta, Contratado
- Proporção ~4:3 (1024×768), fundo branco, estilo dashboard limpo CompSmart: azul #2563EB, navy, cantos arredondados, tipografia Inter
- **Sem números/métricas inventados** (sem contagens, percentuais ou tempos — apenas as etapas e setas)
- Qualidade "premium" (a imagem contém texto em português e precisa ficar legível)
- Salvar em `src/assets/funil-rs.png` e importar como imagem normal do projeto
- Conferir o texto renderizado abrindo o arquivo; refazer/editar se houver erro de escrita

## 2. Adicionar o card na seção `metricas`
Em `src/pages/public/LandingRecrutamento.tsx`:
- Card compacto (não full-width), **largura máxima ~640px, centralizado**, abaixo do grid de 4 métricas (ou ao lado delas — mantido abaixo para não mexer no grid)
- proporção da imagem ~4:3, cantos arredondados (rounded-2xl), borda e fundo do card como nos outros cards da página
- `alt` obrigatório: `"Funil de contratação do Recrutamento & Seleção"`
- Responsivo: no mobile o card empilha (imagem em coluna, dentro da largura da página); `loading="lazy"`; sem animação para quem usa movimento reduzido (respeitar prefers-reduced-motion — nenhuma animação se adicionada)
- Sem new code além do card: reutiliza classes/tokens existentes da página

## 3. Validação
- lint, tipos, testes, dead-code e build (bun run ci) até passar
- Playwright no preview: desktop 1280px e mobile 390px — card contido na largura da página, empilhado no mobile, alt correto
- A faixa "Em reconstrução" continua visível nesta página; /vagas segue sem ela
