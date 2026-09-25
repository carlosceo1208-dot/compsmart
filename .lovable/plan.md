# SEO técnico completo (sem mudança visual)

## O que já existe hoje
- `index.html` já tem `lang="pt-BR"`, title, description, OG, Twitter Card e `og:image` (compsmart-social.png).
- As páginas públicas (Home, Sobre nós, Preços, Parceiros, Materiais, Contato, Módulos, Cargos e Salários) já definem title/description/canonical por página, mas só no navegador. No "ver código-fonte" todas mostram o head da Home.
- Rotas NR-1: `/nr1` (página real), `/modulos/nr1` e `/nr1-publico` já redirecionam para `/nr1`. Header, rodapé, banners e anúncios usam `/nr1`.
- `robots.txt` já tem `Allow: /` + `Sitemap:` e bloqueia as áreas logadas.
- `sitemap.xml` está desatualizado: inclui páginas privadas (/dashboard, /auth, /checkout, /onboarding...) e slugs de módulos que não existem (`selecao-rs`, `td-pdi`, `potencial-9box`). Os corretos são `talent`, `evolve`, `potencial-sucessao`.
- Não existe a rota `/consultoria`. Ela fica de fora, e nenhuma página nova será criada.

## 1. Canonical NR-1: manter `/nr1` (mudança em relação à sugestão)
Recomendo `/nr1` como canônica, e não `/modulos/nr1`. Motivos:
- Os links do site, os anúncios e o sitemap já usam `/nr1`, e ela já está indexada.
- Todo o painel logado da NR-1 fica em `/nr1/...`.
- Inverter o redirecionamento agora causaria perda de indexação sem ganho.

Ações:
- `/modulos/nr1` e `/nr1-publico`: redirecionamento 301 para `/nr1`, declarado no arquivo de redirecionamentos, com canonical para `/nr1`.
- Conferir no cartão NR-1 da grade de módulos e no rodapé se o link aponta direto para `/nr1`, sem passar por redirecionamento.

## 2. Meta tags por página
Revisar e ajustar cada página pública para ter: title único (50-60 caracteres, com palavra-chave), description única (140-160), canonical própria, og:title/description/url/image, twitter summary_large_image com o mesmo texto. As imagens de compartilhamento continuam a mesma já usada hoje. Páginas: `/`, `/nr1`, `/sobre-nos`, `/materiais`, `/precos`, `/parceiros`, `/contato`, `/plano-de-cargos-e-salarios`, `/modulos/{core, insight, match, clima, talent, evolve, potencial-sucessao, rh-service}`, `/glossario`, `/termos-de-uso`, `/politica-de-privacidade`. Só as tags do cabeçalho mudam; nada que aparece na tela.

## 3. Sitemap e robots
- Gerar o sitemap a partir de uma lista única de rotas públicas canônicas (Home com prioridade 1.0), sem páginas privadas nem redirecionadas, e sem datas inventadas.
- Manter `robots.txt` como está, incluindo `Allow: /`, os bloqueios atuais e a linha do Sitemap. Adicionar só `Disallow` para `/modulos/nr1` não é necessário, porque o 301 resolve.

## 4. "Ver código-fonte" com head próprio por página
O site monta as páginas no navegador, então o código-fonte hoje é igual em todas as páginas. Para cada rota mostrar seu próprio title, description e canonical sem mudar nada visual: na publicação, gerar uma cópia do HTML de cada rota pública (ex.: `nr1/index.html`) já com as tags daquela página. O conteúdo visível continua o mesmo.

## 5. Validação
- Localmente: conferir que cada HTML gerado tem title, description e canonical próprios, e que não há canonical duplicado.
- Após publicar: `curl` em cada rota do domínio oficial (código-fonte), `curl -I /modulos/nr1` esperando 301 para `/nr1`, e abrir `/sitemap.xml` e `/robots.txt`.
- Ponto não confirmado: não sei se a hospedagem respeita o 301 do servidor e as cópias de HTML por rota. Vou verificar após publicar. Se não respeitar, o redirecionamento continua funcionando no navegador, e aviso você. O que resolve de vez é a migração para renderização no servidor (TanStack Start).

## Detalhes técnicos
- Novo `src/config/seoRoutes.ts`: fonte única (path, title, description, priority) usada pelas páginas (Helmet via PublicLayout), pelo gerador de sitemap e pelo prerender.
- `scripts/generate-sitemap.ts` em `predev`/`prebuild`, com saída em `public/sitemap.xml`.
- Plugin Vite `closeBundle` que escreve `dist/<rota>/index.html` substituindo title/description/canonical/og/twitter no HTML base. Canonical será removido do `index.html` base quando cada rota ganhar o seu.
- `public/_redirects`: adicionar `/modulos/nr1 /nr1 301`. O `<Navigate>` do app continua como fallback.
- Registrar em AGENTS.md: "SEO de rotas públicas vem de seoRoutes.ts (fonte única para Helmet, sitemap e prerender)."
