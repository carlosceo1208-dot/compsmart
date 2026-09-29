# Corrigir o looping da verificação anti-robô na candidatura

## Diagnóstico confirmado

- Os prints mostram o widget visível e a tela alternando entre "Verificando…" e a mensagem de falha.
- O componente ainda força `size: "normal"`, então o modo "Invisible" do painel não é aplicado.
- O looping ocorre porque cada falha muda o contador de tentativas, o que faz o componente remover e desenhar o widget de novo.
- Os registros do servidor mostram `invalid-input-secret` em todos os envios em www.compsmart.ia.br: a chave pública nova já está na página, mas a chave secreta guardada ainda é do widget antigo.
- A função de candidatura já envia o token e já chama o siteverify antes de gravar; o erro vem da chave secreta que não corresponde.

## Alterações

1. **Widget estável, sem looping**
   - Desenhar o widget uma única vez por página e guardar o identificador.
   - Contador de tentativas em referência interna, sem provocar novo desenho.
   - Usar `size: "invisible"`.
   - Após o limite de tentativas: aviso + "Tentar novamente", sem reinício automático.

2. **Token novo por reset, sem remontar**
   - Após rejeição do servidor ou "Tentar novamente": chamar `window.turnstile.reset(widgetId)` no widget existente e aguardar o novo token.
   - Nunca remover e redesenhar o widget; nunca limpar campos nem o PDF.

3. **Fluxo completo do token**
   - O formulário envia `turnstileToken` no corpo, com os demais campos e o PDF.
   - A função chama o siteverify antes de qualquer gravação (candidato, currículo, candidatura), com `secret`, `response` e `remoteip`.
   - Se `success !== true`: resposta 400 com "Falha na verificação anti-robô" e os `error-codes`.
   - Registrar o hostname devolvido pela Cloudflare para confirmar www.compsmart.ia.br.
   - Frontend: 200 → "Candidatura enviada!"; 400 → mostra o erro, reseta o widget e oferece "Tentar novamente".

4. **Par de chaves do mesmo widget COMPSMART**
   - Chave pública 0x4AAAAAAFJIAO_pENlxDUF6 no site.
   - Abrir o campo seguro para você colar a chave secreta desse mesmo widget em `TURNSTILE_SECRET_KEY` (nunca no chat).
   - Confirmar com você que os 4 domínios, incluindo www.compsmart.ia.br, estão na lista desse widget.
   - Republicar a função e o site.

5. **Roadmap**: registrar esta tarefa ao iniciar a implementação.

## Validação

- Lint, tipos, testes, código não usado e compilação.
- Site publicado, com recarga sem cache:
  - sem caixa "Confirme que é humano";
  - candidatura completa com PDF termina em "Candidatura enviada!";
  - falha simulada termina no aviso com "Tentar novamente", sem looping; nova tentativa mantém campos e PDF.
- Siteverify: essa chamada é feita pelo servidor, então não aparece na aba Network do navegador. A prova será nos registros da função (`success: true` no lugar de `invalid-input-secret`) e no painel Cloudflare, onde o aviso "Siteverify isn't being called" deve sumir.
- Painel do RH: origem Portal, etapa Triagem, currículo abre.
- Apagar os dados do teste.
