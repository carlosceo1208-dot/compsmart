# Corrigir o looping da verificação anti-robô na candidatura

## Diagnóstico confirmado

- Os prints mostram o widget visível e a tela alternando entre “Verificando…” e a mensagem de falha.
- O componente ainda envia `size: "normal"`, portanto a configuração “Invisible” feita no painel não está sendo aplicada na página.
- A repetição ocorre porque cada falha altera o contador de tentativas; isso recria a função de erro e faz o componente remover e renderizar o widget novamente, iniciando outro ciclo.
- Os registros do envio no site publicado retornam `invalid-input-secret`: a chave pública nova já está na página, mas `TURNSTILE_SECRET_KEY` ainda não corresponde ao novo widget.

## Alterações

1. **Estabilizar o ciclo do Turnstile**
   - Trocar o contador de tentativas que provoca novas renderizações por uma referência interna estável.
   - Renderizar o widget uma única vez por montagem.
   - Cancelar temporizadores no descarte do componente e impedir callbacks atrasados.
   - Encerrar definitivamente após o limite de tentativas, mostrando “Tentar novamente” sem reinício automático infinito.

2. **Aplicar corretamente o modo invisível**
   - Configurar o widget com `size: "invisible"`.
   - Manter a mensagem de progresso somente enquanto a verificação estiver realmente em andamento.
   - Preservar o botão “Tentar novamente” como reinício manual e controlado.

3. **Corrigir os estados do formulário**
   - Separar claramente: verificando, verificado e falha.
   - Bloquear “Enviar candidatura” somente enquanto a verificação estiver pendente ou durante o envio.
   - Em falha, exibir o aviso e a ação de tentar novamente, sem spinner permanente.
   - Após uma rejeição do servidor, gerar um token novo sem apagar os dados e o PDF já preenchidos.

4. **Atualizar a chave secreta correspondente**
   - Abrir o campo seguro para substituir `TURNSTILE_SECRET_KEY` pela chave secreta do novo widget.
   - Republicar a função de candidatura para carregar a chave atualizada.
   - A chave secreta não será colocada no código nem enviada pelo chat.

## Validação

- Rodar lint, tipos, testes, verificação de código não utilizado e compilação.
- Testar no navegador em desktop e celular:
  - modo invisível sem caixa “Confirme que é humano”;
  - sucesso gera token e libera o envio;
  - falha simulada termina no aviso com “Tentar novamente”, sem looping;
  - nova tentativa não perde os campos nem o PDF;
  - candidatura completa no site publicado termina em “Candidatura enviada!”.
- Conferir no painel do RH que a candidatura entrou como origem Portal, etapa Triagem, e que o currículo abre.
- Remover os dados criados pelo teste final.
