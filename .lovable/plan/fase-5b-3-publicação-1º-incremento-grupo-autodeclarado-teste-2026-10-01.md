# Fase 5B-3 — Publicação + 1º incremento (grupo autodeclarado) + teste de reativação

Registro de status: a condição 1 **não está corrigida**. A reserva pelo grupo do convite foi agendada como 1º incremento pós-publicação, dentro do caminho autorizado. O formato muda para "grupo autodeclarado", para preservar o anonimato do diagnóstico.

## Passo 1 — Publicar a 5B-3 (autorizado)
- Registrar no roadmap:
  - o novo incremento e o teste de reativação;
  - a decisão do selo único: 70 ou mais Saudável, 55 a 69 Atenção, abaixo de 55 Crítico;
  - a pauta de negócio: preencher a área no cadastro.
- Publicar em compsmart.ia.br.
- Pós-publicação, como RH:
  - conferir a visão de conjunto: média da empresa + selo se houver 5 pessoas ou mais com check-up no período; "dados insuficientes" se houver menos. O número real de pessoas é conferido na hora; os 8 check-ups não são necessariamente 8 pessoas;
  - conferir o convite do Clima onde ele não está contratado.

## Passo 2 — Incremento: grupo autodeclarado como reserva da área
- **Escolha:** ao "Iniciar minha jornada" (e depois, nas configurações), a pessoa escolhe o próprio grupo, que é opcional, com a opção "prefiro não informar". A lista é a dos grupos da própria empresa.
- **Ligação pela pessoa:** o check-up está ligado à jornada da própria pessoa logada, e é dali que vem o grupo. Quem tem check-up sem grupo (ou nunca iniciou a jornada) entra só na média da empresa.
- **Ordem do recorte:**
  1. área do cadastro;
  2. se a área estiver vazia, o grupo escolhido;
  3. se não houver nenhum dos dois, "Sem recorte — média da empresa".
- **Tela do RH:** cada linha mostra o tipo ("Área" ou "Grupo"). Há uma linha informativa "Sem recorte — média da empresa", com a contagem de pessoas sem área nem grupo, sem nota própria, porque elas só entram na média da empresa. Continua valendo k=5 em tudo.
- **Grupo removido depois:** o valor gravado fica como histórico. A agregação usa o texto gravado e não depende de o grupo continuar na lista.
- **Testes** (em empresa de teste, removida no final), comparando o esperado com o obtido:
  1. grupo com 5 pessoas aparece; grupo com 4 fica oculto;
  2. área preenchida tem prioridade sobre o grupo;
  3. pessoa sem área e sem grupo aparece apenas na média da empresa;
  4. pessoa com check-up sem grupo escolhido entra só na média da empresa;
  5. grupo retirado da lista continua agregado;
  6. ninguém lê o grupo nem o check-up de outra pessoa; recusas registradas;
  7. telas em 1280px e 390px; verificação de código limpa;
  8. contagens iguais à linha de base no final.
- Relatório esperado × obtido. **Nada publicado antes da sua revisão.**

## Passo 3 — Teste de reativação do NR-1
Em empresa de teste:
1. Com o NR-1 ativo, a pessoa cria a jornada, as mensagens e um check-up.
2. O NR-1 é desligado: tela, banco e agente recusam.
3. O NR-1 é religado: os mesmos registros voltam, com as mesmas contagens e o mesmo conteúdo.

O resultado vai para o relatório e fecha a ressalva.

## Detalhes técnicos
- Migração: `nr1_jornadas.grupo text null`. A atualização fica restrita ao dono pela regra de acesso que já existe. A nova função `nr1_grupos_empresa()` lista, sem números, os grupos de nr1_grupo_gestores e nr1_convites da empresa da pessoa logada.
- `nr1_checkup_agregado`: o recorte passa a ser `coalesce(nullif(p.department,''), j.grupo)`, ligado por `checkin.jornada_id → jornada.user_id = profile.id`. Cada linha ganha o campo `tipo` (area/grupo), e o campo `sem_recorte` traz a contagem de quem não tem nenhum dos dois.
