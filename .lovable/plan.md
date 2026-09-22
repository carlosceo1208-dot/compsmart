# Reposicionamento da landing pública — Gestão Estratégica de Pessoas

Nova estrutura comercial pública (home + subpáginas dos 9 módulos + preços +
parceiros + materiais), reaproveitando os componentes atuais e o design system
azul da CompSmart. Nada do app, dashboard, checkout ou pagamentos é alterado.

## 1. Home (página inicial, reorganizada)

Mantidos e reaproveitados: menu fixo, FAQ em sanfona, pré-footer de conversão,
cards do design system, vídeo de Remuneração Estratégica (player menor, em
posição secundária, depois da grade de módulos).

Removidos por conflito com o novo posicionamento: depoimentos e avatares
fictícios, números inventados, grade de planos Starter/Medium, estrutura de
3 módulos.

Nova ordem:
1. Hero — headline de gestão de pessoas com dados e IA, destaque "Só a CompSmart
   cruza NR-1 × Clima × 9-Box × Remuneração com IA", CTA "Agendar demonstração"
   + "Baixar e-book Remuneração Estratégica".
2. Dor/contexto — 3 cards (remuneração desorganizada e rotatividade; NR-1 sem
   ferramenta; decisões por intuição).
3. Grade dos 9 módulos — ícone, nome, descrição curta, selo do agente de IA,
   link para a subpágina.
4. Diferencial "Só a CompSmart cruza" — exemplos burnout × remuneração e risco
   psicossocial × sucessão.
5. Vídeo (secundário, discreto).
6. Como funciona — importar base, IA analisa, decidir com inteligência.
7. Conecta com a sua folha — TOTVS, Senior, ADP, Domínio e qualquer Excel/CSV,
   com aviso explícito: importação de dados, não processamento de folha.
8. Resumo de preços + link para /precos.
9. Prova social como espaço reservado ("Resultados em breve") + CTA de demo.
10. FAQ em sanfona (5 perguntas indicadas).
11. Pré-footer de conversão (e-book + demo) e rodapé completo com os 9 módulos,
    contato@compsmart.ia.br, redes (placeholder) e aviso LGPD.

Menu: Home · Módulos (dropdown com os 9) · NR-1 · Preços · Parceiros ·
Materiais · Contato, com CTA fixo "Agendar demonstração". WhatsApp flutuante em
todas as páginas públicas.

## 2. Preços (/precos)

Valores vindos do banco (nunca fixos no código):
- base R$ 5,00 por colaborador/mês no 1º módulo;
- 50% de desconto fixo em degrau nos módulos adicionais (R$ 2,50 derivado da
  base × desconto, não valor separado, não cumulativo);
- ciclos: semestral 5% off, anual 10% off;
- NR-1 segue a mesma regra e conta como 1º módulo;
- sem teto: faturamento per capita integral em qualquer porte.

Grade por porte: Essencial (até 50) · Profissional (51–250) · Corporativo
(251–1.000) · Enterprise (1.000+, sem tabela pública, CTA "Falar com
especialista"). Mini-simulação: nº de módulos + nº de colaboradores + ciclo →
total mensal. Nenhuma menção a teto. Sem checkout na landing.

## 3. Subpáginas por módulo

/core, /insight, /match, /nr1, /clima, /selecao-rs, /td-pdi, /potencial-9box,
/rh-service — cada uma com hero do problema, solução, recursos, conexão com os
outros módulos e CTA de demonstração.

- /nr1: vende o núcleo legal (COPSOQ-III, 40 questões anônimas LGPD, matriz de
  risco, plano de ação kanban, terceiros/PGR, laudos) com urgência legal
  (Portaria MTE 1.419/2024). Cruzamentos com Clima, 9-Box e Remuneração
  aparecem como complementos modulares ativáveis à parte, nunca como parte do
  NR-1. As landings de NR-1 já existentes continuam funcionando.
- /rh-service: consultores seniores por demanda, negociação por projeto (sem
  preço), diagnóstico de maturidade que recomenda módulos, dois formatos.

## 4. Parceiros (/parceiros)

Duas modalidades separadas: Indique e Ganhe (10% recorrente enquanto a
assinatura estiver ativa, atribuição por link/cupom) e Atue como Consultor
(remunerado por horas, integra a base do RH Service, sujeito a aprovação).
Formulário: nome, e-mail, tipo de parceria, especialidade (se consultor),
LinkedIn → gravado em leads com origem 'parceiro'.

## 5. Materiais (/materiais)

Cards com título, benefício, miniatura e botão BAIXAR que abre formulário de
captura (nome, e-mail profissional, cargo, porte) e grava o lead com origem
'ebook:<slug>'. Primeiro material: "Remuneração Estratégica". O arquivo PDF
ainda não está no projeto — a captura funciona e a entrega é manual pela
equipe; quando o PDF for enviado, ligo o download automático sem mexer no
fluxo. Cards reservados para "NR-1 e Riscos Psicossociais" e "Clima e 9-Box".

## 6. Leads

Todos os formulários públicos gravam em leads com origem, porte e data, com
tela de agradecimento após o envio. Nomenclatura fixa de origem: `demo`,
`ebook:remuneracao`, `ebook:nr1`, `ebook:clima-9box`, `parceiro`, `contato`.

## Detalhes técnicos

- Banco (única alteração de backend, aditiva):
  - `leads`: novas colunas nullable `linkedin`, `parceria_tipo`
    ('indicacao' | 'consultor' | 'ambos'), `especialidade`. Formulários atuais
    seguem intactos.
  - `module_pricing`: nova coluna `preco_por_colaborador` (numeric) e
    `desconto_modulo_adicional_pct`; colunas `preco_mensal` existentes ficam
    como estão para não afetar o checkout atual.
  - nova tabela de configuração global de preço público (base per capita,
    desconto de módulo adicional, descontos por ciclo), com leitura anônima.
  - `get_public_pricing()` SECURITY DEFINER, `search_path = public`, EXECUTE
    para anon e authenticated, retornando somente valores públicos. A landing e
    o simulador leem apenas essa função.
  - Seed dos valores atuais: base 5,00 · adicional 50% · semestral 5% ·
    anual 10%.
- Frontend: novas páginas em `src/pages/public/` e componentes em
  `src/components/landing/`, rotas públicas em `src/App.tsx`; `Index.tsx`
  reorganizado; `SocialProofSection` trocada por placeholder; `PricingSection`
  substituída pelo modelo per capita; `VideoSection` reduzido.
- SEO: title, description e Open Graph por página via Helmet; sitemap
  atualizado com as novas rotas.
- Fora do escopo: checkout na landing, mecanismo de cupom do Admin Master,
  alterações no app/dashboard/pagamentos, identidade visual de terceiros,
  qualquer cliente, número, logo ou depoimento inventado.
