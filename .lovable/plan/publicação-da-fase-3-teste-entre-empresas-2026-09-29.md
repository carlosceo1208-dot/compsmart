# Publicação da Fase 3 + teste entre empresas

## 1. Publicar
- Conferir o relatório de segurança antes. Se houver achado crítico novo da Fase 3, eu mostro antes de publicar. Os 86 achados antigos ficam como estão.
- Publicar e passar o endereço do site. A publicação leva cerca de 1 minuto, mas esse tempo pode variar.

## 2. Teste entre empresas (usuários descartáveis)
- Criar uma empresa temporária "B" com um admin e um gestor de RH, os dois com o módulo Talent liberado.
- Logado como B, tentar ver e mexer nos dados da empresa do Carlos:
  - listar candidaturas, candidatos e histórico → precisa voltar vazio
  - abrir o currículo do Carlos (curriculo-download) → precisa ser recusado
  - mover a candidatura dele (talent_mover_candidatura) → precisa ser recusado
  - pedir análise da candidatura dele (agent-talent analisar) → precisa ser recusado
  - gravar direto no histórico → precisa ser recusado
- Teste de controle: com a própria vaga e candidatura fictícia da empresa B, as mesmas ações precisam funcionar.
- No fim, apagar a empresa B, os usuários, a vaga e a candidatura fictícia dela. Não mexer no Carlos nem em nenhum outro dado. Conferir com uma consulta que ele continua em Triagem.

## 3. Conferir os 2 itens pendentes
- **Regras da função que move candidatos:** só o sistema pode executá-la. Usuário comum chamando direto recebe negação. Não aceita mover para a mesma etapa. Arquivar exige motivo.
- **Registros do agente sem dados pessoais:** ler os registros recentes do agent-talent e confirmar que só aparecem tamanhos e contagens, sem nome, e-mail, telefone ou CPF.

## 4. Entrega
- Mostrar uma tabela com cada teste: esperado x obtido, usando só o que as ferramentas retornarem.
- Atualizar roadmap.md.

## Detalhes técnicos
- Os usuários de teste são criados e apagados com a chave de serviço, em script temporário em /tmp. Nada fica no código do projeto.
- Se algum teste falhar, eu paro e mostro o resultado antes de corrigir.
