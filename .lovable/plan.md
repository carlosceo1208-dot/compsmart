# Publicar e validar a correção do cabeçalho

## Estado confirmado

- A correção já está no projeto: menu completo a partir de 1024 px (`lg`) e hamburger somente abaixo dessa largura.
- O cabeçalho mantém **Vagas**, **Entrar/Dashboard**, **Agendar demonstração** e os demais links.
- A última compilação registrada está aprovada.

## Execução

1. Consultar a verificação de segurança mais recente, conforme exigido antes da publicação.
2. Se não houver bloqueio crítico, publicar a versão atual no site oficial.
3. Após a solicitação de publicação, validar o site publicado com cache limpo:
   - largura de 1280 px: links, Entrar/Dashboard e Agendar demonstração visíveis; hamburger oculto;
   - largura de 390 px: hamburger visível, menu com os mesmos itens e fechamento ao clicar em um link.
4. Validar no domínio publicado a landing, `/vagas` e `/vagas/consultor-organizacional`, sem sobreposição ou corte horizontal.
5. Executar novamente lint, verificação de tipos, testes, dead-code e build; corrigir qualquer falha antes de encerrar.

## Retorno

Informar a URL publicada, as larguras testadas e o resultado de cada página e comportamento. Se a hospedagem ainda estiver propagando a nova versão, informar isso sem declarar publicação concluída antes da confirmação.
