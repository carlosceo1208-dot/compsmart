# Liberar o anti-robô no site publicado e testar a candidatura

## Por que fica em "Verificando…"
O anti-robô (Cloudflare Turnstile) recusa o site publicado porque os endereços compsmart.ia.br e www.compsmart.ia.br não estão na lista de domínios autorizados da chave (erro 110200). Enquanto isso não for ajustado, nenhuma candidatura real passa, e nada no código resolve isso sozinho.

## O que será feito
1. **Conectar sua conta Cloudflare** (vai aparecer um cartão no chat). O token precisa ser um **token de usuário** (Meu perfil → Tokens de API) com a permissão **Account → Turnstile → Edit**, porque o Turnstile não aceita token de conta.
2. **Ler o widget atual** (chave 0x4AAAAAACKfut…) e mostrar a lista de domínios de hoje.
3. **Pedir sua confirmação** e então adicionar compsmart.ia.br, www.compsmart.ia.br, smartcomp.ia.br e www.smartcomp.ia.br, sem remover os domínios que já estão lá.
4. **Testar no site publicado**: o botão sai de "Verificando…" e vira "Enviar candidatura"; candidatura completa com PDF até "Candidatura enviada!"; forçar uma falha e usar "Reenviar" com token novo; confirmar no painel do RH (fonte Portal, etapa Triagem, currículo abrindo).
5. **Limpar**: apagar o candidato, a candidatura e o currículo de teste (volta a 0).

## Caminho alternativo (se você preferir não conectar o Cloudflare)
Você mesmo faz no painel: Cloudflare → Turnstile → widget da chave 0x4AAAAAACKfut… → Settings → Hostname Management → adicionar os 4 domínios → Save. Depois me avisa e eu rodo os passos 4 e 5.

## Detalhes técnicos
- Leitura: `GET /accounts/{account_id}/challenges/widgets/{sitekey}`; alteração: `PUT` no mesmo caminho, mandando a lista completa de `domains` junto com `name` e `mode` atuais.
- Sem mudanças no código, no banco ou na lógica da função da candidatura.
