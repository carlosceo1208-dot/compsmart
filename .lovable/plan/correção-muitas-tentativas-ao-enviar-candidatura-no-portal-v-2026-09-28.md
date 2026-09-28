# Correção: "Muitas tentativas" ao enviar candidatura no portal /vagas

## O que foi verificado
- Seu IP fez só 3 tentativas nos últimos minutos (17:06, 17:06, 17:11). O limite real é 5 em 10 min, então **não foi excesso de tentativas**.
- A mesma mensagem "Muitas tentativas" é usada também quando a **verificação anti-robô falha** (token ausente, inválido ou já usado). Esse é o motivo real — a mensagem está enganosa.
- Causas prováveis, a confirmar no passo 1:
  1. O token anti-robô é de uso único; ao clicar "Reenviar", o formulário reaproveita o token já consumido e sempre falha.
  2. O widget pode não gerar token no domínio publicado (modo silencioso) e o envio segue com token vazio.
  3. O domínio (compsmart.ia.br / www) pode não estar autorizado na chave anti-robô.

## O que será feito
1. **Diagnóstico**: registrar no servidor o motivo exato da recusa (sem dados pessoais: só código do erro do anti-robô, se havia token e o domínio de origem) e reproduzir no site publicado.
2. **Mensagens corretas**: separar "Muitas tentativas" (limite real) de "Não conseguimos confirmar que você não é um robô — aguarde a verificação e tente de novo".
3. **Token novo a cada envio**: após qualquer falha, reiniciar o widget anti-robô; o botão "Enviar"/"Reenviar" fica desabilitado até existir token válido, com aviso "Verificando…".
4. **Contagem justa**: só contar a tentativa no limite depois que o anti-robô for aprovado (falhas de verificação não bloqueiam a pessoa).
5. **Domínio na chave anti-robô**: confirmar que compsmart.ia.br e www.compsmart.ia.br estão autorizados (pelo código de erro do anti-robô no site publicado). Se não estiverem, avisar você do ajuste necessário — sem isso toda candidatura real falha, mesmo com a correção.
6. Rodar lint, tipos, testes, dead-code e build; publicar.
7. **Testes no site publicado** (não só no preview, onde as chaves de teste sempre aprovam):
   - Botão "Enviar" desabilitado com "Verificando…" até existir token válido.
   - Forçar uma falha, clicar "Reenviar" e confirmar que o novo envio passa com token novo (widget reiniciado). Se falhar, o reset não funcionou e será corrigido.
   - Candidatura completa com PDF até "Candidatura enviada!"; depois apagar o candidato de teste.

## Detalhes técnicos
- `supabase/functions/portal-candidatura/index.ts`: códigos distintos (`rate_limit` vs `captcha_missing`/`captcha_invalid` com `error-codes` do siteverify em log), mover o insert em `portal_rate_limit` para depois do siteverify.
- `src/pages/public/VagaPublica.tsx`: mapear `code` para mensagem própria, `turnstile.reset` após erro (expor reset no `TurnstileWidget`), desabilitar envio sem token.
- Sem mudanças em banco, RLS ou outras telas.
