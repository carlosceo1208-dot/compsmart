# Roadmap

- [x] Ajustes finais aprovados da landing pública: cores, marca/favicon, vídeo, contato, NR-1, preços e Termos.
- [ ] Publicação da landing: aguarda revisão da prévia e conferência da razão social no cartão CNPJ pelo cliente.
- [x] Verificar e tratar os três alertas de segurança das regras de leitura pública.
- [x] Etapa 2: aplicar gating por módulo no dashboard centralizado, preservando visual e sem alterar backend.
- [x] Ajuste aprovado: cards Jurídico Smart, R&B Smart e People Analytics visíveis, bloqueados salvo Core ou serviço já ativo.
- [x] Ajuste aprovado: CTAs bloqueados usando o nome legível vindo do catálogo de módulos.
- [x] Etapa 3.5: página /rh-service com abas Consultores, Projetos, Horas e Diagnósticos, ligada ao card do dashboard.
- [x] Ajuste aprovado: papel consultor reconhecido apenas no RH Service (helper local isRhServiceEditor).
- [x] Ajuste aprovado: detalhe do diagnóstico com práticas, níveis, módulos recomendados e justificativa.
- [x] Alinhar o pricing público de /nr1 à regra per capita de /precos e validar o seletor Normal/Dark nos headers públicos.
- [x] Exibir o seletor de tema compacto, somente com ícones, nos cabeçalhos principal e NR-1.

- [x] Quem Somos: card Nossa História, bio Josué, fotos reais dos sócios
- [x] Aplicar as sete imagens reais nas páginas públicas e padronizar os retratos dos sócios
- [x] Reposicionar imagens da Home e NR-1 e substituir as fotos de Nossa História e Parceiros
- [x] Aplicar o símbolo temático na Home, em Materiais e no favicon
- [x] Funil de download do e-book Remuneração Estratégica em /materiais (com ajustes de validação)
- [x] Painel de Leads em /admin/leads (lista, filtros, detalhe, responder, status, CSV)
- [x] Diagnosticar o HTML pré-renderizado de /nr1, republicar e validar as tags SEO no domínio oficial.

- [x] Contatos NR-1 no painel de leads (somente leitura)
- [x] Campo "Segmento da empresa" no /diagnostico
- [x] Home: novos textos + seção de prova visual (4 telas ilustrativas)
- [x] Home: ajustes finos da prova visual, botão Contato e cabeçalho responsivo
- [x] Corrigir regressão do cabeçalho público em 1024 px e validar landing/portal de vagas em desktop e celular

- [x] Recrutamento & Seleção — Fase 1: vagas, busca na biblioteca/CBO, perfil com IA (Talent), cadastro de cargo sem duplicidade
- [x] Nome do módulo na landing: "Recrutamento & Seleção (Aquisição de Talentos)" + selo "AQUISIÇÃO DE TALENTOS", grafia padronizada no app e na base

- [ ] Fase 3: excluir candidato/candidatura (LGPD), só RH/admin da empresa, apagando o currículo
- [x] Testes finais Fase 2: candidatura anônima, LGPD/PDF inválido, isolamento, sem currículo, reaplicação, trim do título, publicar
- [x] Fechamento Fase 2: nova verificação de segurança (sem alertas críticos), confirmação visual de /vagas no site publicado (desktop + celular), Fase 2 concluída e publicada
- [x] Marca empregadora na vaga: logo, "Sobre a empresa", faixa salarial destacada (opt-in), limpeza de logos, testes no preview
- [x] Candidatura no site publicado: domínios autorizados na chave anti-robô (Cloudflare) e envio real concluído
- [x] Faixa "Em reconstrução" no topo (institucional + app; oculta em /vagas)
- [x] Teste ponta a ponta no site oficial: confirmação "Candidatura enviada!", aceite LGPD com data/IP/navegador, PDF no storage, entrada em Triagem
- [x] Página Recrutamento & Seleção (/modulos/selecao-rs): abertura, problema, solução, métricas, CTA navy, SEO, navegação rápida, demo no celular
- [x] /modulos/selecao-rs: substituir cards de imagem por componentes HTML/CSS (funil 5 etapas + listagem de vagas ilustrativa), validar 1280/390
- [x] /modulos/selecao-rs: refinar o funil em card unificado com ícones, chevrons gráficos e KPI ilustrativo separado

- [x] Anti-robô da candidatura: widget sem looping (reset), siteverify no servidor, chave do widget COMPSMART, envio real aprovado no site publicado
- [x] Fase 3 R&S: kanban de triagem por vaga, histórico auditável, análise do agente Talent (currículo anonimizado, nota 0–100, recomendação aplicada só pelo RH)
- [x] Fase 3: publicada + teste entre empresas (RH de outra empresa vê 0 e não move/grava; desfeito com rollback)
- [x] Card da vaga: "N candidatos · Triagem" abre o funil da vaga (?aba=triagem&vaga=id)
- [ ] Aceite final: abrir currículo e "Analisar currículo" logado como 2ª empresa real (aguarda conta de cliente real)

## Agente Talent visível na Triagem (lote + card + filtro)
- [x] Filtro com/sem análise, botão em lote, sparkle por card, reanálise no histórico, papel+empresa no servidor
- [x] Teste do lote (3 fictícios), limite de 2, 429 simulado, 403 para colaborador; fictícios apagados
- [x] Troca de vaga no meio do lote (vaga de teste temporária): 2 em voo concluíram, 3º não iniciou
- [x] Outra empresa (B temporária): currículo 403, análise recusada, 0 linhas, nada gravado; revertido
- [x] Botão de análise oculto para colaborador
- [x] Troca de empresa no meio do lote: sem vazamento; corrigido envio de pendente após troca (fila parada ao sair da tela)
- [x] Fase 3 R&S fechada (testes F/G/H/I); dados temporários apagados
- [x] "Colar da planilha" e "Novo candidato" ocultos para colaborador (servidor já recusa); publicado e conferido no site oficial

## Fase 4 — Diagnóstico de Maturidade do RH
- [x] Estrutura, 48 afirmações exatas, regras de acesso e limites anti-abuso
- [x] Página /maturidade com teaser de 10 perguntas e captura de lead (LGPD com data e versão)
- [x] Ferramenta interna /consultoria/maturidade: convite RH, gestores anônimos, scorecard, radar, relatório, roadmap 90 dias
- [x] 6 ajustes (nível único, grupo por convite, progresso por gestor, limites, média protegida, leitura do gap)
- [x] Validação no servidor com dados fictícios (desfeita) + landing 1280/390
- [x] Conferir visualmente a tela interna /consultoria/maturidade logado
- [ ] GATE: varredura de segurança completa antes do relançamento comercial
- [ ] Publicar após revisão do usuário
- [x] Teste final 1: fluxo interno logado (super admin) + envio tudo-ou-nada (tela e servidor)
- [x] Teste final 2: regra do consultor (sem/com projeto; visibilidade cruzada só relatar, publicação suspensa se ocorrer)
- [x] Limpeza só no banco + consulta antes/depois
- [ ] BLOQUEIO publicação Fase 4: decisão dos sócios sobre visibilidade do consultor (equipe compartilhada vs dono do cliente)

## Fase 4 — Consultor dono do cliente
- [x] Decisão dos sócios: cada consultor vê só os próprios projetos (Maturidade + RH Service + Core do consultor). Testado com rollback.
- [ ] GATE: varredura de segurança completa antes do relançamento comercial.
- [x] Conferência visual do "Login vinculado" (super admin vincula; consultor vê só a empresa do projeto; sem vínculo o acesso some).
- [x] Anti-robô: "Tentar novamente" sem script duplicado, só a tentativa atual desenha, mensagem clara quando o bloqueio persiste.
- [ ] Decisão: modo invisível do anti-robô (hoje é verificação automática, sem execute()).

## Fase 5 — NR-1 (auditar, completar, reorganizar card)
- [x] Etapa 1: auditoria entregue (aguardando OK dos sócios para construir)
- [x] Etapa 2: novo layout do card NR-1 em 4 blocos (Preparar/Diagnosticar/Agir/Acompanhar) + "Mais recursos"
- [x] Navegação aprovada: Etapas do Programa visível em Diagnosticar; Histórico na gaveta; Plano Essencial e Acompanhamento sempre visíveis
- [x] Etapa 3: Clima 360° como cartão contratável; FIB fundido no Clima; cruzamentos só com has_module
- [x] Etapa 4: cortes 40/60/80 (front+servidor), k=5 no servidor, link anônimo tudo-ou-nada, agente Psi, laudo PDF/Excel
- [ ] Validação completa + NÃO publicar até revisão
- Fase 5B (não mexer): Segurança Psicológica, Sociodemográfico, Terceiros, Vitalidade, Inteligência
- GATE: varredura de segurança completa antes do relançamento comercial
- [x] Correção de acesso NR-1: RH/admin da empresa vê os próprios ciclos; consultor dono vê só o projeto dele; sem projeto/colaborador/visitante = 0 (testado com rollback)
- [x] Histórico e comparação: ciclo com menos de 5 respostas mostra "Dados insuficientes"
- Alerta aceito com justificativa: consulta de resultado por grupo e regra de acesso NR-1 liberadas a logados — exigem permissão de gestão e aplicam k=5 no servidor
- [ ] Pendente do relatório: capturas das mensagens de quem responde, Clima/FIB, card 1280/390, PGR/laudo PDF/Excel no navegador

## Fase 5 — validação final (aberto)
- [x] Comparação de ciclos, telas de quem responde, Clima/FIB, rotas, card 1280/390, PGR/laudo PDF+Excel
- [x] Corrigido: resposta anterior ficava marcada e travava "Próxima" no questionário anônimo
- [x] BLOQUEIO admin do cliente — corrigido
- [x] bun run ci limpo, dados [TESTE] apagados, foto final = "antes"
- [x] Travas de módulo: só super admin passa; Core sempre ativo; cruzamentos por módulo de origem (tela + servidor); testado e dados [TESTE] apagados
- [ ] Pendente: 2 logins de teste sem papel/perfil ainda existem no cadastro de acesso (não há como apagar daqui)

## Fase 5 — 3 testes finais (30/09)
- [x] RH/admin de A: só ciclos, vagas e projetos de A; nada de B
- [x] Sem Talent: vagas somem e criação recusada
- [x] Consultor dono: só A (NR-1, Maturidade, RH Service); sem projeto: 0 e scorecard recusado
- [ ] Decisão: admins internos CompSmart (contratar 9-Box/Insight na conta interna ou promover a super admin)
- [ ] Apagar logins teste.nr1.admin / teste.nr1.hr_manager em Users (sem chave de serviço aqui)
- [ ] Varredura de segurança: salários do Core no servidor sem Insight; ~100 avisos antigos

## Varredura de segurança 2026-09-30
- [ ] Opcional: revogar acesso de visitante a has_role/is_super_admin/get_user_company_id/import_employees_batch/employee_import_can_manage (hoje retornam vazio/recusam sem login)
- [ ] Opcional: trocar policy {public} por {authenticated} em nr1_checkins_semanais e nr1_jornada_mensagens

## BLOQUEADORES encontrados 2026-09-30 (aguardando aprovação)
- [x] 7 funções fechadas com rh_admin_da_empresa (testado por papel, rollback)
- [ ] Abrir no navegador como RH real as telas de Vale-transporte, Benefícios, Cenários e Orçamento
- [ ] Retomar itens 3-6 da rodada final após correção

## Sugestão de faixa na vaga (sem Insight)
- [x] RPC talent_sugerir_faixa: retorna só min/max/fonte genérica; recusa com erro 42501
- [x] Documentado: sem Insight, a sugestão pontual usa também a base global da CompSmart (decisão do cliente)
- [ ] Publicação aguardando revisão final
- [x] Sugestão de faixa: entrada única com auditoria das recusas (_user só do login), contrato 200/200-nulo/403, 0 chamadas diretas
- [x] Teste na tela como RH de A (1280/390)
- [ ] Fase D (validação comercial): contratar só Clima (sem NR-1) e operar as 7 telas — prova de produto vendável sozinho

## Fase 5B-1 — Segurança Psicológica (implementada, não publicada)
- [x] Trava do NR-1 na área interna; escala própria; envio tudo-ou-nada; agregados com mínimo de 5; gestor por grupo; histórico; exportação; correlação com o Clima
- [ ] Acabamento final: rótulo COPSOQ para Demandas/Saúde, nota nas exportações e indicador de gestores sem grupo
- [ ] Teste no navegador do questionário completo em tenant fictício + conferência real de PDF/planilha + limpeza integral
- [x] Gestor sem grupo vinculado permanece sem acesso; usar gestor cadastrado do colaborador quebraria o anonimato
- [ ] Publicar (aguarda aprovação)
