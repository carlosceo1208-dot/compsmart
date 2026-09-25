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
- Publicar e depois seguir estes passos:
  1. Conferir o HTML bruto especificamente em https://www.compsmart.ia.br/nr1 (`curl -s ... | grep -o "<title>[^<]*</title>"`). O resultado esperado é `<title>NR-1 e Riscos Psicossociais: Diagnóstico COPSOQ | CompSmart</title>`, com HTTP 200.
  2. Se o title continuar antigo, olhar `dist/nr1/index.html` no build local:
     - Se o arquivo estiver correto, é cache ou inconsistência entre domínios. Nesse caso, republicar e conferir cada domínio.
     - Se o arquivo estiver antigo, o gerador não está escrevendo o title da /nr1. Nesse caso, comparar `seoRoutes.ts` com a geração, corrigir e republicar.
  3. Só então validar no navegador (Playwright), em https://www.compsmart.ia.br/nr1 depois do carregamento: `document.title`, description, og:title e canonical.
