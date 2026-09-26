# Renomear o módulo na landing: "Recrutamento & Seleção (Aquisição de Talentos)"

O painel e a base já usam o nome novo; o site público ainda mostra "Seleção & Recrutamento" / "Seleção & R&S". Este plano troca a grafia em todos os pontos do site, sem alterar textos dos outros módulos, cores, fontes, layout ou o funcionamento do app.

## O que muda no site (o que você vê)

1. **Cards da Home, menu "Módulos", menu do celular e rodapé** — passam a mostrar **Recrutamento & Seleção** (nome curto, uma linha só, sem quebrar o layout).
2. **Pílula do card e da página do módulo** — hoje "SELEÇÃO & RECRUTAMENTO", passa a **AQUISIÇÃO DE TALENTOS**.
3. **Página do módulo** (`/modulos/selecao-rs`) — título e cabeçalho: **Recrutamento & Seleção (Aquisição de Talentos)**.
4. **Prova visual da Home** — a moldura do funil deixa de dizer "Seleção & R&S" e passa a dizer **"Recrutamento & Seleção — Funil de contratação"**.
5. **Resultado de busca (Google)** — título e descrição da página do módulo passam a usar o nome novo, mantendo o tamanho dentro do limite (título até ~60 caracteres).
6. **Grafia padronizada** — "Talentos" com maiúscula em todo lugar: site, painel e cadastro de módulos. Só a grafia muda, nenhuma funcionalidade.

## Detalhes técnicos

- `src/config/landingModules.ts` (entrada `talent`): `nome` = "Recrutamento & Seleção (Aquisição de Talentos)", `nomeCurto` = "Recrutamento & Seleção", `selo` = "AQUISIÇÃO DE TALENTOS". Esse é o único catálogo lido por menu, rodapé, cards da Home e página do módulo — uma mudança cobre os quatro lugares.
- `src/config/seoRoutes.ts` (rota `/modulos/selecao-rs`): `title` e `description` com o nome novo. É a fonte única de SEO: Helmet, sitemap e HTML estático continuam saindo do mesmo lugar.
- `src/components/landing/pivot/VisualProofSection.tsx`: título da moldura do funil.
- Padronização da grafia no app (só texto do rótulo): `src/hooks/useModuleAccess.ts` (nome de fallback do módulo), `src/components/dashboard/ModuleGrid.tsx` (card do painel), `src/pages/recrutamento/Vagas.tsx` (subtítulo da tela de vagas).
- Nova migração: `UPDATE public.modules SET nome = 'Recrutamento & Seleção (Aquisição de Talentos)' WHERE slug = 'talent';` — a base hoje tem "talentos" minúsculo. Sem tocar em outras linhas nem em leads.

## O que NÃO muda

- **A URL `/modulos/selecao-rs` continua igual** — canonical, sitemap, links já publicados e anúncios continuam válidos. Trocar a URL exigiria redirecionamentos e mexeria no SEO das rotas públicas.
- Textos, chamadas e números dos demais módulos; cores, fontes, espaçamentos e layout.
- App/dashboard (fora da grafia do rótulo), backend, pagamentos e checkout.
- O formulário `/diagnostico` (a lista de "módulo de interesse" não traz este módulo) e os leads já registrados — o campo de interesse é texto livre, então os contatos antigos continuam como foram gravados; os novos entram com o nome novo.
- O lead da Marli e os demais contatos reais não são tocados.

## Verificação

Rodar lint, typecheck, test, dead-code e build até todos passarem. Conferir no navegador (desktop e celular): menu "Módulos", menu hambúrguer, rodapé, cards da Home, página do módulo e a moldura da prova visual — sem quebra de linha nem estouro de largura. Conferir o HTML gerado da página do módulo (título, descrição, canonical). Depois, publicar para valer em compsmart.ia.br. Registrar em roadmap.md.
