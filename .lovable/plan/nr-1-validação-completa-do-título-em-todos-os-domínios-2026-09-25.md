# NR-1: validação completa do título em todos os domínios

## Diagnóstico confirmado agora
- O arquivo local `dist/nr1/index.html` contém exatamente: `<title>NR-1 e Riscos Psicossociais: Diagnóstico COPSOQ | CompSmart</title>`.
- Foram feitas três consultas sem cache em cada endereço: `www.compsmart.ia.br`, `compsmart.ia.br`, `www.smartcomp.ia.br`, `smartcomp.ia.br` e `compsmart-ia-br.lovable.app`. Todas devolveram o título novo no HTML bruto.
- Os cinco endereços entregaram conteúdo com o mesmo hash. Não há um nó identificado servindo o título antigo.
- `www.compsmart.ia.br` é o endereço principal e responde HTTP 200 com `no-cache`; os outros quatro respondem HTTP 302 e encaminham para ele. Portanto, eles não mantêm cópias independentes da página.

## Conclusão
A publicação atual já cumpre o resultado pedido em todos os domínios. Não existe cache de rota para invalidar nem uma versão divergente que justifique republicar novamente. O título antigo visto na verificação independente está numa cópia local da ferramenta, navegador, proxy ou provedor de internet usado naquela consulta.

## Próximo passo
1. Revalidar no mesmo ambiente independente usando `view-source:https://www.compsmart.ia.br/nr1?nocache=20260925-final` ou o comando solicitado.
2. Se ainda aparecer o antigo, registrar o comando completo, horário e ferramenta utilizados. Com esses dados, comparar o resolvedor DNS e a resposta recebida naquele ambiente com o deployment atual.
3. Não alterar código nem republicar enquanto todos os endereços oficiais continuarem entregando de forma consistente o título novo, evitando uma publicação redundante.
