# Corrigir o título antigo da página NR-1 (/nr1)

## Diagnóstico (confirmado)
- O HTML bruto em produção já está correto em todos os domínios (www.compsmart.ia.br, compsmart.ia.br, lovable.app, smartcomp.ia.br, com cache-buster): `<title>NR-1 e Riscos Psicossociais: Diagnóstico COPSOQ | CompSmart</title>`. Não é cache nem CDN.
- A causa é a própria página NR-1: quando ela abre no navegador, um trecho antigo de `src/pages/public/LandingNr1.tsx` (linhas 105-116) sobrescreve o título pelo antigo "NR-1 Inteligente — Cruze risco psicossocial com 9Box e remuneração | CompSmart", e também a description e o og:title. Por isso a aba do navegador e as ferramentas que executam JavaScript (inclusive o Google) mostram o texto antigo.

## Correção
1. Em `LandingNr1.tsx`, remover a troca de `document.title`, description, og:title, og:description e og:type. O SEO fica só com `seoRoutes.ts` e `SeoHead`, que é a fonte única.
2. Manter o bloco JSON-LD do FAQ exatamente como está.
3. Não mexer em textos visíveis, layout nem outras páginas. A página de anúncios (/lp/nr1 em `LandingNr1Ads`) fica como está, porque é outra rota.

## Validação
- No preview: abrir /nr1 e conferir o `document.title` depois do carregamento. Também conferir description, og:title e canonical (Playwright).
- Publicar e depois conferir uma vez: HTML bruto com HTTP 200 e title, description, canonical, og e twitter corretos. Também conferir o título já renderizado no navegador em https://www.compsmart.ia.br/nr1.
