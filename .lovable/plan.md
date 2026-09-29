# Fase 4 — 2 testes finais e publicação

## Teste 1: tela interna logado (super admin, no navegador)
- Entrar como super admin e abrir "Maturidade do RH" pelo menu do perfil.
- Criar o diagnóstico "Teste QA — apagar após" em uma empresa fictícia criada só para o teste.
- Gerar o link do RH e abrir em janela sem login. Responder 2 ou 3 afirmações e confirmar que nada é gravado nem enviado pela metade (o envio só libera com as 36 respondidas). Depois responder todas com valores conhecidos e enviar.
- Registrar 2 gestores fictícios pela tela, com valores conhecidos.
- Conferir scorecard, radar (12 pontas, séries RH e Gestores), relatório imprimível (cabeçalho, frase do gap) e roadmap de 90 dias, com fotos da tela.
- **Aprova se:** nenhuma tela branca ou erro, e médias, gap, nível e destaques batem com a conta feita à mão.

## Teste 2: regra do consultor (com desfazimento)
- Não é possível criar um usuário de login novo pelo ambiente. O teste usa, por alguns minutos, o usuário de teste colaborador já conhecido (652e57b6…), que recebe o papel de consultor. Antes, registro o estado dele.
- (a) Sem projeto ativo do RH Service na empresa fictícia: ele deve ver 0 diagnósticos, e o scorecard deve ser recusado.
- (b) Com um projeto temporário "em andamento" na empresa fictícia: ele deve ver só o diagnóstico dessa empresa, nenhum de outra.
- **Aprova se:** (a) mostra 0, (b) mostra só o da empresa fictícia, e nenhum dado real aparece.

## Limpeza (sempre, mesmo se algo falhar)
- Apagar diagnóstico, convite, gestores, respostas, projeto temporário e empresa fictícia.
- Retirar o papel de consultor e devolver o usuário ao estado anterior.
- Consulta final para comparar o antes e o depois. Diagnósticos reais, Carlos, Josue e Marli não são tocados.

## Publicação
- Só se os 2 testes passarem: publicar em https://www.compsmart.ia.br e aguardar o seu smoke test.
- Se algum falhar: não publicar e reportar o problema com a correção proposta.

## Detalhes técnicos
- Sessões: super admin injetado/mintado via `lovable auth-session`; o colaborador é mintado com `--user 652e57b6-…` (pede aprovação).
- Mudanças temporárias via SQL com IDs fixos (prefixo 66666666-…) para facilitar a limpeza: empresa em `organizational_structure` (type company), linha em `user_roles` (consultor), `rh_service_projetos` (status em_andamento, consultor_id preenchido).
- A regra atual (`maturidade_pode_gerir`) exige só o papel consultor e um projeto ativo na empresa, sem ligar o projeto a este consultor específico. Se o teste mostrar que qualquer consultor enxerga a empresa de outro, reporto antes de publicar.
