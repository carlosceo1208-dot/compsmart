# Confirmar e republicar o SEO da rota NR-1

## Estado confirmado agora
- O valor final no projeto para `/nr1` é **“NR-1 e Riscos Psicossociais: Diagnóstico COPSOQ | CompSmart”**.
- A meta description final é **“Prepare sua empresa para a NR-1: diagnóstico de riscos psicossociais COPSOQ-III anônimo (LGPD), matriz de risco, plano de ação e laudos em um só lugar.”**
- O código-fonte servido agora em `https://www.compsmart.ia.br/nr1` já mostra exatamente esses dois textos e o canonical `https://www.compsmart.ia.br/nr1`.
- `/sobre-nos` e `/parceiros` também continuam com os títulos novos.

## Execução
1. Não alterar textos, layout ou outras páginas, pois os valores corretos já estão na fonte única de SEO.
2. Conferir a segurança da versão atual antes de publicar.
3. Solicitar uma nova publicação para garantir uma geração limpa do HTML pré-renderizado de `/nr1`.
4. Após a publicação, validar diretamente no código-fonte do domínio oficial:
   - status HTTP 200;
   - title final;
   - meta description final;
   - canonical da própria `/nr1`;
   - Open Graph e Twitter com os mesmos textos.
5. Informar o endereço publicado e o resultado observado. Se a implantação ainda estiver processando, deixar isso explícito sem declarar conclusão prematuramente.

## Detalhes técnicos
- A geração de `dist/nr1/index.html` já lê `src/config/seoRoutes.ts`; não é necessária correção no gerador.
- A checagem pós-publicação será feita no HTML bruto retornado pelo servidor, não apenas no título exibido pelo navegador.
