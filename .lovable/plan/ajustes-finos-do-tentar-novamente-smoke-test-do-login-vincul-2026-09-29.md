# Ajustes finos do "Tentar novamente" + smoke test do "Login vinculado"

## O que o código atual já faz
- A cada nova tentativa, remove o script de verificação antigo antes de colocar o novo. Não sobra script duplicado na página.
- Temporizadores do ciclo anterior são cancelados ao recarregar.
- Os campos preenchidos e o PDF ficam guardados na página, então não se perdem no retry.

## O que falta corrigir
1. **Um só aviso de carregamento.** Cada retry hoje encadeia o aviso "script carregou" do ciclo anterior. Um carregamento atrasado de uma tentativa antiga ainda pode disparar. Passo a usar um número de tentativa: só a tentativa atual pode desenhar o widget, e o aviso antigo é descartado.
2. **Atalho quando o script já existe.** Se a verificação já carregou, o "Tentar novamente" vai direto a redesenhar ou pedir um token novo. Não baixa o script de novo.
3. **Mensagem clara quando o bloqueio continua.**
   - Durante o retry aparece "Verificando…" por no máximo 15 segundos. Nunca fica rodando sem parar.
   - Se ainda falhar, a mensagem vira: "Verificação bloqueada pelo seu navegador. Desative o bloqueador de anúncios ou tente outro navegador."
   - O "Tentar novamente" continua só manual.
4. **Envio após o retry:** a candidatura usa o token novo, e o token se renova depois de cada falha de envio, como já acontece hoje.

## Ponto que precisa da sua decisão (não vou mudar sozinho)
O widget **não está em modo invisível** hoje, e não existe chamada `execute()` no envio. Ele usa a verificação automática da Cloudflare, que aparece e se resolve sozinha. O widget recarregado vai manter exatamente esse mesmo modo. Se vocês quiserem o modo invisível, faço como um ajuste separado.

## Validação
- Automática: verificação completa (tipos, lint, testes, build).
- Playwright bloqueando o script da Cloudflare:
  - aparece a mensagem de erro e o retry mostra a mensagem clara, sem loop;
  - vários cliques seguidos deixam no máximo 1 script na página;
  - ao liberar o script, o widget é desenhado.
- A verificação real da Cloudflare não passa por robô (erro 600010). Então o fechamento com token real fica para o seu roteiro manual no site publicado, com e sem bloqueador.

## Smoke test do "Login vinculado" (dados fictícios, desfeito ao final)
- Coloco 2 usuários de teste temporariamente como consultores A e B. Crio o cadastro deles e um projeto em andamento na empresa de teste, com A como responsável.
- Como super admin, na tela: abrir o cadastro de consultor, ver o campo "Login vinculado", escolher um usuário e salvar.
- Como consultor A: vê só a empresa de teste na Maturidade.
- Remover o vínculo e recarregar a tela: o acesso some.
- Como consultor B: nada aparece, e o scorecard é recusado.
- Para entrar como os usuários de teste, o sistema vai pedir sua aprovação num cartão.
- Limpeza no fim, com consulta de antes e depois. Carlos, Josue e Marli não serão tocados.

## Publicação e roadmap
- Publico depois dos testes.
- A varredura de segurança e a conferência visual continuam no roadmap como etapas obrigatórias antes do relançamento comercial. A conferência visual será marcada como feita se o smoke test passar.

## Detalhes técnicos
- `TurnstileWidget.tsx`:
  - `geracaoRef` incrementada a cada `attempt`;
  - `window.onTurnstileLoad = () => { if (g === geracaoRef.current) render(); }`, sem encadear o `prev`;
  - se `window.turnstile` já existir, `render()` direto;
  - `setLoading(true)` no início do ciclo de retry;
  - nova prop `onBlocked` (ou `onError(tentativa > 0)`) para diferenciar o texto.
- `VagaPublica.tsx`: estado `bloqueado` troca o texto do alerta.
- Playwright: `page.route("**/challenges.cloudflare.com/**", abort)` para simular o bloqueio.
