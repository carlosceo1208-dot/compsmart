# Correção do cabeçalho da landing page

## Causa confirmada

O componente compartilhado continua contendo os links, **Entrar** e **Agendar demonstração**. A regressão é de responsividade: o ponto em que o menu completo aparece foi alterado de `lg` para `xl`, fazendo larguras de desktop/tablet horizontal entre 1024 e 1279 px exibirem somente o menu hamburger. O portal de vagas usa o mesmo layout público, mas a inclusão de **Vagas** não removeu os botões.

## Implementação

1. Ajustar o cabeçalho público para voltar a exibir ações de desktop a partir da largura adequada.
2. Organizar os itens em faixas responsivas para evitar aperto ou sobreposição:
   - desktop intermediário: navegação principal e ações essenciais;
   - desktop amplo: todos os links atuais, incluindo **Vagas**;
   - celular: hamburger com a mesma navegação e ações.
3. Preservar logo, estilos, textos e comportamento atual de autenticação; não alterar o conteúdo da landing nem as páginas de vagas.
4. Garantir que abrir um link no menu móvel feche o menu corretamente.

## Validação

- Conferir no navegador a landing `/` em celular, 1024 px, 1280 px e desktop amplo.
- Confirmar **Entrar/Dashboard**, **Agendar demonstração**, links de navegação e hamburger nas larguras correspondentes.
- Conferir `/vagas` e uma página `/vagas/[slug]` em desktop e celular, incluindo abertura dos links do menu.
- Verificar ausência de sobreposição, corte horizontal e erros no navegador.
- Executar a verificação completa: lint, typecheck, testes, dead-code e build, corrigindo qualquer falha até todos passarem.

## Retorno

Informar a causa confirmada, o ajuste responsivo realizado e os resultados dos testes por largura e página.
