# Confirmar e republicar o SEO da rota NR-1

## Estado confirmado agora
- O valor final no projeto para `/nr1` é **“NR-1 e Riscos Psicossociais: Diagnóstico COPSOQ | CompSmart”**.
- Trecho exato confirmado em `src/config/seoRoutes.ts`:
  ```ts
  { path: "/nr1", priority: "0.9", changefreq: "weekly",
    title: "NR-1 e Riscos Psicossociais: Diagnóstico COPSOQ | CompSmart",
    description: "Prepare sua empresa para a NR-1: diagnóstico de riscos psicossociais COPSOQ-III anônimo (LGPD), matriz de risco, plano de ação e laudos em um só lugar." },
  ```
- A meta description final é **“Prepare sua empresa para a NR-1: diagnóstico de riscos psicossociais COPSOQ-III anônimo (LGPD), matriz de risco, plano de ação e laudos em um só lugar.”**
- Na consulta feita agora, o código-fonte servido em `https://www.compsmart.ia.br/nr1` já mostrou exatamente esses dois textos e o canonical `https://www.compsmart.ia.br/nr1`. Como você recebeu o título antigo, o diagnóstico também verificará se há respostas divergentes entre a geração local e a camada de publicação/cache.
- `/sobre-nos` e `/parceiros` também continuam com os títulos novos.

## Execução
1. Executar o processo local completo de produção, incluindo as etapas anteriores ao build.
2. Abrir o arquivo gerado `dist/nr1/index.html` e registrar o title, a description, o canonical, Open Graph e Twitter.
3. Decidir pelo resultado:
   - **HTML local novo:** tratar como inconsistência da publicação/cache; conferir a segurança e solicitar nova publicação. Se o título antigo persistir depois da implantação concluída, verificar as opções disponíveis para limpar a rota específica ou encaminhar o caso ao suporte da hospedagem.
   - **HTML local antigo:** não publicar ainda; corrigir a geração da rota `/nr1`, confirmar novamente o arquivo gerado e só prosseguir quando ele contiver os valores novos.
4. Não alterar textos, layout ou outras páginas; qualquer correção ficará restrita ao gerador, caso o diagnóstico demonstre necessidade.
5. Após a geração local correta, conferir a segurança da versão atual e solicitar nova publicação.
6. Após a publicação, validar diretamente no HTML bruto retornado pelo domínio oficial:
   - status HTTP 200;
   - title final;
   - meta description final;
   - canonical da própria `/nr1`;
   - `og:title`, `og:description` e `og:url` corretos;
   - `twitter:card` como `summary_large_image`, com title e description correspondentes.
7. Informar o endereço publicado e o resultado observado. Se a implantação ainda estiver processando, deixar isso explícito sem declarar conclusão prematuramente.

## Detalhes técnicos
- A geração de `dist/nr1/index.html` já lê `src/config/seoRoutes.ts`; não é necessária correção no gerador.
- A leitura atual indica que o gerador importa `SEO_ROUTES` e escreve `dist/nr1/index.html`, mas o build local confirmará o resultado real antes de concluir se há defeito ou cache.
- A checagem pós-publicação será feita no HTML bruto retornado pelo servidor, não apenas no título exibido pelo navegador.
