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
