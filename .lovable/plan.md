# Campo "Observação" + novas senioridades no cadastro de vaga

## Objetivo
1. Dar ao recrutador um campo de escrita livre para registrar informações importantes do processo seletivo (ex.: particularidades da vaga, combinações com o gestor, prazos internos).
2. Ampliar as opções de senioridade da vaga: hoje Júnior, Pleno, Sênior, Especialista — passam a incluir **Profissional** e **Consultor**, nesta ordem, após Especialista.

## O que muda

1. **Banco de dados**
   - Nova coluna `observacao` (texto livre, opcional, sem limite rígido além de um teto de 2.000 caracteres validado no banco) na tabela de vagas.
   - Vagas existentes ficam com o campo vazio — nada muda nelas.

2. **Cadastro/edição da vaga (VagaDialog)**
   - Novo campo "Observação" (caixa de texto de várias linhas), opcional, com contador de caracteres.
   - Posicionado ao final do formulário, depois dos requisitos.
   - Texto livre: sem validação de conteúdo, só o limite de tamanho.

3. **Lista de vagas**
   - A observação aparece no card da vaga (resumida, com "ver mais" quando longa) apenas quando preenchida.
   - Não entra nos filtros nem na busca.

4. **Hook de dados (useVagas)**
   - Incluir `observacao` no tipo e no salvamento/carregamento.

## O que NÃO muda
- Nenhum outro campo, texto, cor ou layout da tela.
- Nada no site público, landing page ou demais módulos.
- A observação é interna do RH — não é enviada ao agente de IA (Talent) nem exposta em telas públicas.

## Verificação
- lint, typecheck, test, dead-code e build até todos passarem.
- Teste no navegador (desktop e celular): criar vaga com observação, editar, salvar vazio, confirmar exibição no card.
- Depois de validado, publicar o app.
