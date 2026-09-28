# Testes finais da Fase 2 + publicação

## Situação atual (conferida no banco agora)
- Candidatos: **0** no banco. Os 5 candidatos de teste (Ana, Bruno, Carla, Eduardo, Fernanda) já foram apagados na rodada anterior.
- Vaga "Consultor Organizacional" (publicada, link `/vagas/consultor-organizacional`): o título salvo **já não tem espaço no final** (24 caracteres).

## O que será feito
1. **Candidatura anônima no portal** (navegador sem login, em `/vagas/consultor-organizacional`):
   - Enviar sem marcar o aceite LGPD: deve bloquear e mostrar a mensagem.
   - Enviar com um arquivo que não é PDF (ex.: .txt renomeado): deve recusar com "Envie um arquivo PDF válido".
   - Enviar completo: nome, e-mail, telefone com máscara, cargo pretendido, senioridade, PDF real e aceite. Confirmar a tela de confirmação.
   - Entrar como RH da empresa dona da vaga, abrir `/recrutamento/candidatos`: conferir fonte "Portal", etapa "Triagem" e abrir o currículo.
2. **Isolamento entre empresas**: entrar como usuário de outra empresa e confirmar que não vê o candidato nem consegue abrir o currículo (leitura da tabela devolve 0 linhas e o link assinado é recusado).
3. **Candidatos de teste**: como já estão apagados, o candidato criado no passo 1 também será apagado ao final (com o currículo), deixando o ambiente limpo, sem dados fictícios de demonstração.
4. **Título com espaço**: o dado já está correto; para não voltar a acontecer, o cadastro/edição de vaga passará a remover espaços no início e fim do título ao salvar.
5. Rodar lint, tipos, testes, dead-code e build até tudo passar; checar segurança; publicar e conferir `/vagas` e a página da vaga no site publicado.
6. Relatório passo a passo do que foi clicado e o resultado.
7. **Candidatura sem currículo** (antes de publicar, não bloqueia): enviar candidatura válida sem anexo; confirmar tela de confirmação e que o candidato fica sem currículo, sem erro.
8. **Reaplicação na mesma vaga** (antes de publicar, não bloqueia): reenviar com o mesmo e-mail na mesma vaga; a tela deve dizer "Você já se candidatou a esta vaga" (hoje o texto é "Você já estava inscrito nesta vaga" e será trocado) e o banco deve continuar com 1 candidatura só.
Os dados dos testes 7 e 8 também são apagados ao final. As tarefas 7 e 8 entram no `roadmap.md`.

## Detalhes técnicos
- No preview o anti-robô aceita falha do widget (origem de desenvolvimento), então o teste roda no preview; depois do publish, só conferência visual das páginas (sem nova candidatura real no site publicado).
- Trim em `titulo` no salvar de `useVagas.ts`.
- Sessões de teste via `lovable auth-session`; limpeza: apagar candidatura, candidato e `curriculos/{empresa}/{candidato}.pdf`.
