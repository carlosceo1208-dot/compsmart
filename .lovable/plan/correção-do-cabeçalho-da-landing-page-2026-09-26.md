# Correção do cabeçalho da landing page

## Causa confirmada

O componente compartilhado continua contendo os links, **Entrar** e **Agendar demonstração**. A regressão é de responsividade: o ponto em que o menu completo aparece foi alterado de `lg` para `xl`, fazendo larguras de desktop/tablet horizontal entre 1024 e 1279 px exibirem somente o menu hamburger. O portal de vagas usa o mesmo layout público, mas a inclusão de **Vagas** não removeu os botões.

## Implementação

1. Restaurar deliberadamente o breakpoint original: menu completo a partir de `lg` (1024 px) e hamburger somente abaixo de 1024 px.
2. Manter todos os itens atuais, incluindo **Vagas**, **Entrar/Dashboard** e **Agendar demonstração**, visíveis a partir de 1024 px sem aperto, sobreposição ou corte horizontal. Somente se o teste comprovar que isso é inviável, usar `xl` de forma documentada e garantir por outro arranjo que as ações continuem visíveis em 1024 px.
3. Organizar os itens responsivamente sem remover ações:
   - 1024 px e desktop: menu completo com todos os links e ações;
   - abaixo de 1024 px: hamburger com a mesma navegação e ações.
4. Preservar logo, estilos, textos e comportamento atual de autenticação; não alterar o conteúdo da landing nem as páginas de vagas.
5. Garantir que abrir um link no menu móvel feche o menu corretamente.

## Validação

- Conferir no navegador a landing `/` em celular, 1024 px, 1280 px e desktop amplo.
- Tratar 1024 px como validação principal: confirmar menu completo com todos os itens, incluindo **Vagas**, **Entrar/Dashboard** e **Agendar demonstração**, sem sobreposição nem corte horizontal.
- Confirmar que o hamburger aparece somente abaixo de 1024 px e contém a mesma navegação e ações.
- Conferir `/vagas` e uma página `/vagas/[slug]` em desktop e celular, incluindo abertura dos links do menu.
- Verificar ausência de sobreposição, corte horizontal e erros no navegador.
- Executar a verificação completa: lint, typecheck, testes, dead-code e build, corrigindo qualquer falha até todos passarem.

## Retorno

Informar a causa confirmada, o ajuste responsivo realizado e os resultados dos testes por largura e página.
