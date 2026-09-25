# NR-1: título antigo no HTML bruto, diagnóstico

## Verificado agora (20:25 UTC)
- `dist/nr1/index.html` (build local de 20:02): `<title>NR-1 e Riscos Psicossociais: Diagnóstico COPSOQ | CompSmart</title>`. O gerador está correto, então o cenário B está descartado.
- `curl -s https://www.compsmart.ia.br/nr1` responde HTTP 200 com o mesmo title novo. O resultado é igual com cache-buster (`?v=...`) e com `Cache-Control: no-cache`.
- Depois do carregamento no navegador (Playwright), title, description, og:title e canonical estão todos novos.

## Conclusão
O site oficial não serve mais o title antigo. O texto antigo que você viu vem de uma cópia guardada do seu lado: o cache do navegador, da ferramenta de SEO ou do "ver código-fonte" aberto antes da última publicação. Não é preciso mudar código nem republicar.

## Passos
1. Você revalida sem cache:
   - aba anônima com `view-source:https://www.compsmart.ia.br/nr1?nocache=1`, ou
   - o comando `curl -s https://www.compsmart.ia.br/nr1 | grep -o "<title>[^<]*</title>"`.
2. Se ainda aparecer o title antigo, me diga qual ferramenta ou endereço você usou. Aí eu:
   - rodo um build novo e confiro `dist/nr1/index.html`;
   - republico;
   - comparo cada domínio (www, sem www, smartcomp) no HTML bruto.
