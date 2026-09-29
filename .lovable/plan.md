# Fase 5 — NR-1: auditar e completar

A plataforma já tem boa parte do NR-1: a landing /nr1, o painel, o Universo, os diagnósticos e o plano de ação. As 40 questões atuais ficam como estão. Os 2 diagnósticos, as 440 respostas e as 16 ações gravados hoje não serão apagados nem alterados.

## Etapa 1 — Auditoria (só leitura, relatório antes de construir)
Comparar o que existe com cada item do documento da Fase 5 e montar uma tabela com três situações: pronto, parcial ou falta. Itens conferidos:
- Anonimato k=5: grupo com menos de 5 respostas mostra "dados insuficientes"
- Score de 0 a 100 por dimensão e os cortes 40/60/80
- Matriz Severidade x Probabilidade
- Envio tudo-ou-nada pelo link do respondente e limite de tentativas por link e por IP
- Isolamento por empresa, bloqueio de quem não tem o módulo e regra do "consultor dono do cliente"
- Importação com mapeamento de colunas, prévia e rollback
- Plano de ação em kanban com os 3 níveis de medida, Histórico e versões do PGR
- Laudo do agente Psi e exportação em PDF e Excel
- Landing: aviso de urgência, teaser de 6 perguntas e captura de lead com aceite LGPD

Entrego o relatório e só depois construo o que falta.

## Etapa 2 — Completar o que faltar (escopo Fase 5)
- Corrigir ou criar só os itens marcados como "parcial" ou "falta"
- Seguir o padrão já usado na Maturidade: acesso anônimo por link com prazo e resultados só por médias de grupo
- Agente Psi: recebe só médias, distribuições e contagens. Não diagnostica pessoas nem substitui profissional. Risco crítico sempre traz o aviso de ação imediata. Registros guardam só contagens.
- Badge "LEGAL OBRIGATÓRIO" no menu
- Fica para a Fase 5B, sem mexer: Segurança Psicológica, Sociodemográfico, Terceiros, Vitalidade e Inteligência. Essas telas já existem e continuam como estão.

## Preços na landing /nr1
- Só o módulo NR-1: R$ 5,00 por colaborador por mês
- NR-1 como 2º módulo: R$ 2,50 por colaborador por mês
- Só texto na landing. Checkout e cobrança não mudam. Confirmar antes se a tela de preços atual já aplica essa regra.

## Validação
- Verificação completa sem erros (tipos, lint, testes e build)
- Cálculo conferido à mão: grupo de teste com 10 respostas conhecidas
- Anonimato: grupo com 3 respostas mostra "dados insuficientes"; grupo com 7 mostra as médias
- Envio tudo-ou-nada: resposta parcial não grava; envio incompleto direto é recusado; link reaberto sem rascunho
- Acesso: colaborador sem o módulo, consultor sem projeto e visitante não veem nada; link inválido mostra mensagem clara
- Landing conferida no computador (1280px) e no celular (390px); lead só grava com aceite LGPD
- Dados 100% fictícios, apagados no fim; consulta antes/depois
- Carlos, Josue, Marli e os dados reais de NR-1 intocados
- NÃO publicar até a revisão de vocês

## Roadmap
- Registrar a Fase 5 e a Fase 5B
- A varredura de segurança completa segue como GATE antes do relançamento comercial

## Detalhes técnicos
- Reaproveitar as tabelas atuais (nr1_diagnosticos, nr1_diagnostico_respostas, nr1_planos_acao, nr1_questoes, nr1_importacoes_matriz). Mudanças só aditivas; sem as tabelas novas propostas no documento.
- Uma função de acesso do NR-1 no mesmo padrão: super admin OU consultor_dono_ativo OU RH/admin da empresa com has_module('nr1')
- Uma função de agregação que aplica k=5 no servidor
- Uma função única para os cortes de nível, com testes nos limites 40/41, 60/61 e 80/81
