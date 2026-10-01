# Fase 5B-3 — Implementação da etapa "Acompanhar" (Minha Jornada + Check up Semanal)

Decisões aprovadas pelo CEO: manter as duas telas e o menu, evoluindo no mesmo lugar. O check-up continua sendo respondido de 1 a 10. A pessoa continua vendo o próprio histórico. O RH ganha uma visão de conjunto com mínimo de 5 pessoas (k=5) por área, somando também para a empresa toda. Os pontos 1 a 4 do diagnóstico serão corrigidos.

## Fato que muda o critério de "área"
Só 10 de 182 cadastros têm área preenchida, e a jornada não tem ligação com convite. Por isso o recurso de usar o grupo do convite não se aplica aqui. Regra proposta:
- Por área: só aparece a área que tiver pelo menos 5 pessoas com check-up no período. As demais ficam ocultas, com a mensagem "dados insuficientes".
- Quem não tem área preenchida entra apenas na soma da empresa, que também exige no mínimo 5 pessoas.
- A tela avisa o RH quando há muitos cadastros sem área: "preencha a área para ter o recorte".

## O que será feito
1. **Proteção de dados no agente de IA.** O agente deixa de enviar nome, cargo, área, liderança, modalidade e tempo de empresa. Envia só o setor da empresa e em que momento e semana a jornada está. O relatório vai listar exatamente o que é enviado.
2. **Trava do NR-1 em todas as camadas.** As regras de leitura e gravação da jornada, das mensagens e dos check-ups passam a exigir que a empresa tenha o NR-1 contratado (o super admin também passa). O agente confere o mesmo e recusa com aviso claro. A tela continua com a trava que já existe.
3. **Sem criação automática.** Abrir Minha Jornada não grava nada. Aparece um botão "Iniciar minha jornada", e só depois desse clique a jornada é criada e a primeira mensagem é gravada.
4. **Consultor.** A tela só libera o consultor quando ele é dono de um projeto ativo na empresa, usando a mesma conferência do banco.
5. **Visão de conjunto para o RH** (nova seção dentro de Check up Semanal, visível só para RH/admin com NR-1 e para o super admin):
   - Nota de 0 a 100 convertida do humor (1 vira 0, 10 vira 100), com selo: Saudável (70 ou mais), Atenção (de 40 a 69), Crítico (abaixo de 40). Os cortes seguem os do resto do NR-1 e serão confirmados no código antes de fechar.
   - Resultado por área e da empresa, com k=5; sem números quando os dados forem insuficientes.
   - Tendência semanal agregada.
   - Exportação só dos números agregados.
   - Cada consulta fica registrada no histórico de acessos, inclusive as recusas e tentativas entre empresas.
   - Correlação com o Clima só aparece se o Clima estiver contratado; se não estiver, aparece o convite para contratar.
   - Gestor, colaborador e consultor não veem essa seção.
6. **A pessoa continua vendo o próprio check-up** (registro de 1 a 10 e gráfico das 12 semanas), sem mudança.

## Validação (em empresa e logins de teste, tudo removido no final)
Os 10 itens do comando, comparando o esperado com o obtido:
- jornada só é criada no clique em "Iniciar";
- a pessoa registra o check-up e vê o próprio histórico;
- k=5 por área: área com 5 pessoas aparece, área com 4 fica oculta;
- ninguém lê a jornada de outra pessoa;
- consultor com e sem projeto ativo;
- empresa sem NR-1 recusada pelo banco, pelo agente e pela tela;
- o que é enviado ao agente, conferido no registro de chamadas da IA, sem nome, cargo nem área;
- recusa entre empresas registrada;
- telas em 1280px e 390px;
- verificação de código limpa.

**Pendência do Clima:** na mesma empresa de teste (NR-1 contratado e Clima não), conferir na tela o convite para contratar o Clima e fechar o item da 5B-2.

## Encerramento
- Contagens antes e depois, iguais à linha de base: acessos 3, auditoria 2, respostas 440/0/0, logins 18, jornadas 4, mensagens 16, check-ups 8, leads 2.
- Dados reais conferidos.
- Relatório em Arquivos (fase-5b3-acompanhar/) com prints, AGENTS.md e roadmap.md atualizados.
- Nada publicado até a sua aprovação.

## Detalhes técnicos
- Migração: novas regras de acesso em nr1_jornadas, nr1_jornada_mensagens e nr1_checkins_semanais com `has_module('nr1') or is_super_admin()`. Funções novas `nr1_checkup_agregado(company, periodo)` e `nr1_checkup_tendencia`, com acesso privilegiado e caminho de busca fixo; conferem papel e empresa via rh_admin_da_empresa, agrupam por profiles.department com k=5 e gravam em nr1_access_log (recusa via WARNING + RETURN, sem desfazer o registro).
- Agente nr1-jornada-agent: buildCompanyContext reduzido ao setor; checagem de módulo via has_module; recusa 403. Será reimplantado.
- Front: Nr1JornadaBemEstar.tsx (botão Iniciar), Nr1Layout.tsx (consultor via consultor_dono_ativo), Nr1Acompanhamento.tsx (seção RH com ModuleGate do Clima).
