# Fase 8 — Teste final: RH/admin de empresa sem NR-1 + contagens

## Objetivo
Confirmar que RH/admin de uma empresa sem NR-1 contratado vê 0 importações, sem erro, em 1280px e 390px. Reconfirmar 440/0/0 e Q1 2026 = 49,93. Nada é publicado nesta rodada.

## Passos
1. **Linha de base antes**: registrar as sete contagens (25 acessos · 2 auditorias · 440/0/0 · 9 check-ups · 190 logins · 2 leads · Q1 2026 = 49,93) e 0 importações.
2. **Empresa temporária** "[TESTE FASE 8] Sem NR-1": criada sem módulo NR-1 (só Core), com 1 usuário admin e 1 usuário RH de teste.
3. **Teste visual (admin e RH, 1280px e 390px)**:
   - Abrir /nr1/importacoes: a área NR-1 é travada para quem não contratou, então a tela esperada é o aviso de módulo não contratado, sem erro e sem nenhuma importação listada.
   - Sem erros no console nem respostas de erro do servidor.
   - Prova direta no banco com a sessão desse usuário: a consulta de importações devolve 0 linhas, sem erro. Isso vale também para a importação de teste da outra empresa.
   - Capturas de tela das 4 combinações (admin/RH × 1280/390).
4. **Contagens explícitas**: consultar e mostrar no relatório os números 440/0/0 (COPSOQ / Segurança Psicológica / Vitalidade) e 49,93 (risco do "Diagnóstico Q1 2026", com saúde 50,1 Crítico).
5. **Limpeza**: apagar os usuários de teste, a empresa temporária, a importação de teste ff254e3d… e o arquivo dela.
6. **Linha de base depois**: as sete contagens iguais às do passo 1, com 0 importações e 0 sobras de teste.
7. **Relatório**: atualizar o dossiê da Fase 8 e o roadmap. Depois disso, pedir a autorização de publicação.

## Ponto de atenção
Se o RH/admin sem NR-1 vir a tela comum de lista vazia ("Importar matriz") em vez do aviso de módulo não contratado, isso conta como falha. Eu registro o problema e paro antes de corrigir.

## Detalhes técnicos
- Criação e limpeza com a mesma chave de servidor já usada em rls-role-matrix.test.ts, rodando em um script em /tmp, sem mudar o código do app.
- Sessão do usuário de teste criada no próprio script e colocada no navegador local (Playwright, viewports 1280×1800 e 390×844).
- Consulta de 0 linhas feita via cliente anon com o token do usuário em nr1_importacoes_matriz, mais a assinatura de link no bucket, que precisa ser negada.
