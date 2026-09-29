# Publicar correção + esconder botões para colaborador

## 1. Publicar a correção da fila (já pronta)
- A verificação completa (lint, tipos, testes, build) já passou depois da correção.
- Publicar em https://www.compsmart.ia.br.

## 2. Ajuste rápido: esconder "Colar da planilha" e "Novo candidato"
- Na tela Candidatos, os dois botões só aparecem para admin, RH e super admin, com a mesma regra que já esconde o botão de análise.
- O servidor já bloqueia: as regras de acesso de candidatos e candidaturas só deixam gravar admin/RH da empresa com o módulo de R&S (ou super admin). Um colaborador não consegue criar registro, nem órfão.
- Conferir no preview como colaborador (botões ausentes) e como admin (botões presentes), e mandar um insert direto como colaborador para confirmar que é recusado.
- Rodar a verificação completa de novo e publicar outra vez.

## 3. Teste rápido no site oficial
- Abrir Candidatos → Triagem na vaga "Consultor Organizacional", com a página recarregada sem cache.
- Conferir Carlos (72) e Josue (74) na coluna Triagem, e o filtro Todos / Com análise / Sem análise carregando.
- Atualizar roadmap.md.

## Detalhes técnicos
- `src/pages/recrutamento/Candidatos.tsx`: usar `useCurrentUserRole()` e montar os dois botões (e os diálogos) só quando `isAdmin || isHR || isSuperAdmin`.
- Nenhuma mudança no banco nem nas funções do servidor.
