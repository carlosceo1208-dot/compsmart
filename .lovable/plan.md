# Fase 4: 2 testes finais e publicação

## Teste 1: tela interna com login de super admin, no navegador
- Entrar como super admin e abrir "Maturidade do RH" pelo menu do perfil.
- Criar o diagnóstico "Teste QA — apagar após" em uma empresa fictícia criada só para o teste.
- Gerar o link do RH e abrir em janela sem login.
- **Envio tudo ou nada:**
  - Responder 2 ou 3 afirmações e fechar. Ao reabrir o link não pode haver rascunho nem nada pendente, e o banco não pode ter gravado nada.
  - O botão de enviar só libera com as 36 respondidas (na tela).
  - O servidor também recusa um envio incompleto feito direto, sem passar pela tela.
  - As funções públicas não podem guardar respostas parciais em nenhum registro (tabela de tentativas ou log). Isso é conferido no banco e no código das funções.
- Depois responder todas com valores conhecidos e enviar.
- Registrar 2 gestores fictícios pela tela, com valores conhecidos.
- Conferir o scorecard, o radar (12 pontas, séries RH e Gestores), o relatório para imprimir (cabeçalho e frase do gap) e o roadmap de 90 dias, com fotos da tela.
- **Aprova se:** nenhuma tela branca nem erro; médias, gap, nível e destaques batem com a conta feita à mão; o envio tudo ou nada funciona nas 2 camadas (tela e servidor).

## Teste 2: regra do consultor, com desfazimento
- O ambiente não permite criar um usuário de login novo. Por alguns minutos, o teste usa o usuário colaborador de teste já conhecido (652e57b6…) com o papel de consultor. O estado dele é registrado antes.
- (a) Sem projeto ativo do RH Service na empresa fictícia: ele vê 0 diagnósticos e o scorecard é recusado.
- (b) Com um projeto temporário "em andamento" na empresa fictícia: ele vê só o diagnóstico dessa empresa.
- **Visibilidade cruzada, só relatar:** hoje a regra parece exigir apenas "é consultor" e "existe projeto ativo na empresa", sem conferir quem é o consultor do projeto. O teste confirma isso com um projeto temporário cujo consultor é outra pessoa. Se ele enxergar mesmo assim, **o código não muda**: reporto com exemplos e a escolha fica com os sócios (equipe compartilhada ou consultor dono do cliente). Nesse caso **a publicação fica suspensa** até a decisão.
- **Aprova se:** (a) mostra 0; (b) mostra só a empresa fictícia; nenhum dado real aparece.

## Limpeza: só no banco, sem arquivos nesta fase (sempre, mesmo se algo falhar)
- Apagar as linhas de maturidade_* (diagnóstico, convite, gestores, respostas, tentativas do teste), a empresa fictícia em organizational_structure, a linha de consultor em user_roles e o projeto temporário em rh_service_projetos.
- Devolver o usuário de teste ao estado anterior.
- Consulta final comparando o antes e o depois. Diagnósticos reais, Carlos, Josue e Marli ficam intocados.

## Publicação
- Aguardar o cartão de aprovação das sessões de login do teste (esperado).
- Publicar em https://www.compsmart.ia.br só se os 2 testes passarem **e** não houver visibilidade cruzada pendente de decisão. Depois, aguardar o seu smoke test.
- Se algo falhar: não publicar e reportar com a correção proposta.

## Detalhes técnicos
- Sessões: super admin mintado via `lovable auth-session`; o colaborador com `--user 652e57b6-…` (pede aprovação).
- Registros temporários com IDs fixos (prefixo 66666666-…) para facilitar a limpeza.
- Como o modo de planejamento não permite editar outros arquivos, as 3 condições entram em roadmap.md no início da execução.
