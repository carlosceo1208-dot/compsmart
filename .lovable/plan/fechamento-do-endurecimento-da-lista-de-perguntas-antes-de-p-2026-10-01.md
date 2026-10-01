# Fechamento do endurecimento da lista de perguntas (antes de publicar)

Objetivo: fechar os 2 testes que ficaram em aberto, desfazer tudo e entregar a prova. Nada é publicado sem aprovação explícita.

## Contagens iniciais (conferir de novo antes de começar)
Acessos NR-1 1 | auditoria 2 | diagnóstico 440 | Segurança Psicológica 0 | logins 18. Também ficam intactos: ciclo "Diagnóstico Q1 2026" 49,93 Moderado e o ciclo sem nota, Carlos, Josué e os 2 registros da Marli.

## A1. Envio completo do questionário por convite
- Usar uma empresa de teste marcada como QA, com NR-1 ativo, e um diagnóstico e um convite de teste reais.
- Abrir o link do convite sem login e responder tudo (COPSOQ + 11 de Segurança Psicológica) em 1280px e em 390px. Fazer 2 envios, um em cada tamanho de tela.
- Conferir: todas as perguntas aparecem, o envio termina, o resultado individual aparece uma única vez na tela final com o aviso, e reabrir ou voltar não mostra o resultado de novo.
- No banco: as respostas não têm nada que identifique a pessoa (sem usuário, e-mail ou IP). O convite fica marcado como usado.
- A Vitalidade ainda não faz parte do questionário. Ela entra nesse mesmo teste quando for implementada.

## A2. Registro da tentativa negada
- Na mesma empresa de teste, desligar o NR-1 (ou usar uma segunda empresa de teste sem NR-1). Criar um login RH de teste vinculado a ela.
- Logado com esse RH, chamar a consulta da lista de perguntas. Resultado esperado: 0 perguntas, mensagem "módulo NR-1 não contratado" e uma linha nova em nr1_access_log (blocked=true, reason='sem_modulo_nr1', empresa de teste). Essa linha precisa ser identificável como teste pela empresa QA.
- Repetir com o papel admin. Repetir com consultor somente se der para montar o cenário sem mexer em projetos reais.
- Tirar print do registro de auditoria.

## B. Limpeza e prova
- Apagar o convite, as respostas, os registros de acesso, os vínculos, os logins e a empresa de teste, todos filtrados pelos ids QA.
- Conferir de novo se as contagens batem exatamente com as iniciais e se os dados reais estão intactos.
- Rodar bun run ci limpo.

## C. Entregáveis (em Arquivos)
- Tabela esperado × obtido de A1 e A2, com prints nos dois tamanhos de tela e o print do registro de auditoria.
- Contagens antes, durante e depois da limpeza.
- Atualizar o roadmap: endurecimento verde e aguardando aprovação para publicar.

## Decisões do Vitalidade registradas (para a próxima rodada, não implementadas agora)
- Escala própria e enxuta (cerca de 8 a 10 itens), com base no vigor da UWES e no WHO-5. Antes de fechar, reaproveitar as perguntas do COPSOQ que já medem bem alguma dimensão, no mesmo padrão "escala + complementos" da Segurança Psicológica.
- 4 dimensões próprias: Energia, Recuperação, Equilíbrio e Satisfação. Não usar as 6 do diagnóstico. A coerência com o NR-1 vem do mesmo padrão de score, status e relatório e do cruzamento com o Clima quando ele for contratado.
- Salvar essas decisões na memória do projeto.

## Detalhes técnicos
- O login de teste é criado pela função administrativa do servidor e apagado no final. A tentativa negada é feita com o token desse login, chamando nr1_segpsi_questoes_listar.
- Toda escrita de teste usa um prefixo QA no nome da empresa e no e-mail, para facilitar a limpeza e a identificação.
- Nenhuma mudança em código, políticas ou funções. Esta rodada é só de teste.
