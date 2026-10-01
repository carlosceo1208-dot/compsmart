# Fase 5B-3 — Publicação + reserva por grupo (1º incremento)

## Resposta à condição 1 (reserva pelo grupo do convite)
**Não está implementada.** No banco, o check-up e a jornada estão ligados à pessoa logada. O grupo do convite fica no link anônimo do diagnóstico, que não guarda quem respondeu. Hoje não existe nenhum dado que ligue uma pessoa ao grupo do convite, e criar essa ligação por quem respondeu quebraria o anonimato do diagnóstico. Por isso ela entra como **1º incremento depois da publicação**, com teste próprio, como você autorizou.

## Passo 1 — Publicar a 5B-3 (agora)
- Publicar em compsmart.ia.br.
- Conferência rápida em produção, como RH:
  - a visão de conjunto mostra a média da empresa e o selo, ou "dados insuficientes" quando houver menos de 5 pessoas (hoje são 8 check-ups reais);
  - o convite do Clima aparece onde o Clima não está contratado.
- Registrar no roadmap:
  - decisão "selo único em todo o NR-1": 70 ou mais Saudável, 55 a 69 Atenção, abaixo de 55 Crítico;
  - pauta de negócio: preencher a área no cadastro, por campanha ou pela importação de planilhas.

## Passo 2 — 1º incremento: grupo como reserva da área
- **Escolha do grupo:** ao clicar em "Iniciar minha jornada" (e depois, nas configurações da jornada), a pessoa escolhe o próprio grupo. A lista é a mesma de grupos que a empresa já usa nos convites e no vínculo de gestores. A escolha é opcional, com a opção "prefiro não informar".
- **Regra do recorte:** usa a área do cadastro; se ela estiver vazia, usa o grupo escolhido; sem nenhum dos dois, a pessoa entra só na média da empresa. Continua valendo o mínimo de 5 pessoas (k=5), as mesmas regras de acesso e o registro de acessos.
- **Tela do RH:** passa a mostrar se cada recorte é "Área" ou "Grupo".
- **Testes (em empresa de teste, removida no final):**
  - grupo com 5 pessoas aparece e grupo com 4 fica oculto;
  - área preenchida tem prioridade sobre o grupo;
  - ninguém lê o grupo de outra pessoa;
  - telas em 1280px e 390px;
  - contagens iguais à linha de base no final.
- Será publicado só com a sua aprovação.

## Passo 3 — Ressalva da reativação do módulo
Teste com empresa de teste: com NR-1 ativo, a pessoa cria jornada e check-up; o NR-1 é desligado e a tela fica bloqueada; o NR-1 é ligado de novo e os dados voltam iguais. O resultado vai para o relatório.

## Detalhes técnicos
- Migração: coluna `grupo text null` em nr1_jornadas; o próprio dono atualiza, pela regra de acesso que já existe.
- `nr1_checkup_agregado`: o recorte passa a usar `coalesce(nullif(department,''), j.grupo)`, com um campo `tipo` (area/grupo) em cada linha.
- Opções de grupo: lista distinta de nr1_grupo_gestores/nr1_convites da própria empresa, via função de leitura, sem números.
