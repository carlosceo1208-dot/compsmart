# Fase 5B-2 — Implementação do Vitalidade (NR-1)

Decisões vinculantes (já registradas): escala própria de 8–10 itens; 4 dimensões próprias (Energia, Recuperação, Equilíbrio, Satisfação); resultado individual só na tela final, sem identidade; agregação por grupo do convite com k=5. Tudo herda o padrão endurecido da Segurança Psicológica — nada de lógica sensível nova.

## 1. Escala
- Definir 8–10 itens próprios (base em vigor e bem-estar subjetivo), distribuídos nas 4 dimensões.
- Onde uma pergunta do COPSOQ já mede bem o tema (ex.: equilíbrio vida-trabalho), reaproveitá-la na dimensão em vez de perguntar de novo.
- Cada item entra com dimensão, ordem e indicação de pontuação invertida.

## 2. Questionário por convite
- Itens do Vitalidade entram ao final do questionário anônimo (COPSOQ 40 + Segurança Psicológica 11 + Vitalidade), mesmo link e mesmo consentimento.
- Envio continua atômico: tudo grava ou nada grava.
- Tela final mostra os scores do próprio respondente uma única vez, com aviso; nada é guardado sobre quem respondeu.

## 3. Painel /nr1/vitalidade
- Mesma rota e mesmo item no menu do NR-1; no layout do painel da Segurança Psicológica.
- Score global 0–100, 4 scores por dimensão, selo de status, distribuição das respostas, alertas por grupo (k≥5), tendência entre ciclos.
- Simulador e eixo "Entrega" inventado são retirados; números só vêm das respostas.
- Gestor sem grupo: "Seu acesso será liberado quando o RH vincular sua equipe a um grupo". Grupo com menos de 5: bloco oculto.
- Correlação com Clima: atalho só com Clima contratado; sem ele, bloqueado com convite para contratar.
- Exportação PDF e planilha sempre agregadas, com nota metodológica.

## 4. Acesso
- Colaborador: só responde. Gestor: só os próprios grupos, k≥5. RH, admin e consultor da mesma empresa: relatório agregado completo. Outra empresa: 0 linhas. Super admin: visão total.
- Trava do NR-1 mantida. Nenhuma regra existente alterada.

## 5. Validações (empresa de teste, tudo desfeito)
Os 10 itens do documento, com tabela esperado × obtido: RH e colaborador respondem; gestor k≥5/k<5/sem grupo; recusa entre empresas com registro; empresa sem NR-1 travada; questionário completo sem login em 1280px e 390px; PDF e planilha baixados e abertos; Clima com/sem contrato; 2 ciclos fictícios mostrando tendência; ci limpo e contagens idênticas (acessos 1, auditoria 2, diagnóstico 440, Segurança Psicológica 0, Vitalidade 0, logins 18; ciclos 49,93 Moderado e sem nota; Carlos, Josué e 2 registros da Marli intactos).

## 6. Entregáveis
Relatório com tabela, nomes finais da tabela e telas, contagens antes/depois, confirmação dos arquivos abertos, prints dos dois tamanhos, AGENTS.md e roadmap.md atualizados. Nada publicado sem aprovação explícita.

## Detalhes técnicos
- Tabelas novas: `nr1_vitalidade_questoes` (catálogo: dimensão, ordem, invertida, origem própria/COPSOQ) e `nr1_vitalidade_respostas` (diagnóstico, grupo do convite, questão, valor, timestamp; sem usuário, e-mail ou IP). GRANT + RLS: escrita só service_role; sem leitura direta de respostas; catálogo legível só com has_module('nr1') ou super admin, mesmo padrão da lista de perguntas da Segurança Psicológica.
- `nr1-questionario-publico`: acrescentar o bloco Vitalidade na leitura e no envio atômico (mesma transação da RPC de envio da 5B-1).
- Funções SECURITY DEFINER com search_path fixo: `nr1_vitalidade_agregar(diagnostico, grupo?)` e `nr1_vitalidade_tendencia(empresa)` — checam papel + empresa (rh_admin_da_empresa / consultor_dono_ativo / grupo do gestor), aplicam k=5, devolvem só agregados; recusa grava em nr1_access_log e devolve 0 linhas sem erro (para não desfazer o registro).
- Front: reescrever `src/pages/nr1/Nr1Vitalidade.tsx` reaproveitando os componentes do `Nr1SegPsi.tsx`; tela final em `Nr1Responder.tsx` ganha bloco Vitalidade.
- Usuários de teste via função administrativa do servidor, prefixo QA, apagados no final.
