# Etapa 5 (continuação) — Landing pública da CompSmart

A base já está pronta no projeto: preços públicos no banco (valor por colaborador,
desconto de módulo adicional, semestral 5%, anual 10%, faixas por porte) com consulta
pública que não recebe nenhum dado; campos novos de parceiro na base de leads;
configuração dos 9 módulos; cálculo/simulação de preços; gravação padronizada de leads;
menu fixo com dropdown de Módulos, rodapé completo com aviso LGPD, WhatsApp flutuante
e formulários de captura (incluindo o de demonstração).

Falta montar as páginas. Nada do app, painel, cobrança ou checkout é alterado.

## 1. Home reorganizada

Ordem final, reaproveitando o que já existe:
1. Hero — gestão de pessoas com dados e IA, destaque "Só a CompSmart cruza NR-1 ×
   Clima × 9-Box × Remuneração com IA", botões "Agendar demonstração" e
   "Baixar e-book Remuneração Estratégica".
2. Dor/contexto — 3 cards (remuneração desorganizada e rotatividade; NR-1 sem
   ferramenta; decisões por intuição).
3. Grade dos 9 módulos — ícone, nome, descrição curta, selo do agente, link para a
   subpágina.
4. Diferencial "Só a CompSmart cruza" — burnout × remuneração e risco psicossocial ×
   sucessão.
5. Vídeo de Remuneração Estratégica, agora menor e em posição secundária.
6. Como funciona — importar base, a IA analisa, decidir com inteligência.
7. Conecta com a sua folha — TOTVS, Senior, ADP, Domínio e qualquer Excel/CSV, com
   aviso explícito: importação de dados, não processamento de folha.
8. Resumo de preços com link para /precos.
9. Prova social como espaço reservado ("Resultados em breve") + CTA de demonstração —
   sai a seção com depoimentos e números atuais.
10. FAQ em sanfona: o que é a plataforma; compra por módulo; NR-1 é obrigatório?; como
    importar a base da folha; quem usa a plataforma.
11. Pré-footer de conversão (e-book + demo) e rodapé completo.

## 2. Preços (/precos)

Todos os valores vindos do banco, nunca fixos na página: base R$ 5,00 por
colaborador/mês no 1º módulo, 50% de desconto fixo em degrau nos adicionais (não
cumulativo), semestral 5%, anual 10%, NR-1 na mesma regra contando como 1º módulo,
sem nenhuma menção a teto. Grade por porte: Essencial (até 50) · Profissional
(51–250) · Corporativo (251–1.000) · Enterprise (1.000+, sob consulta, CTA "Falar com
especialista"). Mini-simulação: nº de módulos + nº de colaboradores + ciclo → total
mensal. Sem checkout na landing.

## 3. Subpáginas dos módulos

/modulos/core, /modulos/insight, /modulos/match, /modulos/clima, /modulos/selecao-rs,
/modulos/td-pdi, /modulos/potencial-9box, /modulos/rh-service — cada uma com hero do
problema, solução, recursos, conexão com os outros módulos e CTA de demonstração.
/modulos/nr1 direciona para a landing de NR-1 já existente, que continua funcionando.

Na página do NR-1 o núcleo legal é o produto (COPSOQ-III com 40 questões anônimas,
matriz de risco, plano de ação em kanban, terceiros/PGR, laudos, urgência da Portaria
MTE 1.419/2024); Clima, 9-Box e Remuneração aparecem como complementos ativáveis à
parte. /modulos/rh-service: consultores seniores por demanda, negociação por projeto
sem preço, diagnóstico de maturidade que recomenda módulos, dois formatos.

## 4. Parceiros (/parceiros)

Duas modalidades separadas: Indique e Ganhe (10% recorrente enquanto a assinatura
estiver ativa) e Atue como Consultor (remunerado por horas, integra a base do RH
Service, sujeito a aprovação). Formulário: nome, e-mail, tipo de parceria,
especialidade quando consultor, LinkedIn.

## 5. Materiais (/materiais)

Cards com título, benefício, miniatura e botão BAIXAR que abre o formulário de captura
(nome, e-mail profissional, cargo, porte). Primeiro material: "Remuneração
Estratégica" — o PDF ainda não está no projeto, então a captura funciona e a entrega
fica manual pela equipe; quando você me enviar o arquivo eu ligo o download automático
sem mexer no fluxo. Cards reservados para "NR-1 e Riscos Psicossociais" e
"Clima e 9-Box".

## 6. Contato (/contato)

Formulário de contato + e-mail contato@compsmart.ia.br + WhatsApp, com tela de
agradecimento após o envio.

## Detalhes técnicos

- Sem nenhuma alteração de banco nesta etapa: a migração de preços públicos, os campos
  de parceiro em `leads` e `get_public_pricing()` já foram aplicados.
- Novas páginas em `src/pages/public/` (Precos, Parceiros, Materiais, Contato,
  ModuloPage genérica por slug) e novas seções em `src/components/landing/`; rotas
  públicas lazy em `src/App.tsx`, reaproveitando `PublicHeader`, `PublicFooter`,
  `WhatsAppFloat`, `LeadForm`, `DemoDialog`, `usePublicPricing` e `usePublicLead`.
- `Index.tsx` reordenado; `SocialProofSection` trocada por placeholder;
  `PricingSection` reescrita no modelo per capita lendo `get_public_pricing()`;
  `VideoSection` reduzido.
- Origem dos leads fixa: `demo`, `ebook:remuneracao`, `ebook:nr1`,
  `ebook:clima-9box`, `parceiro`, `contato`.
- SEO por página via Helmet (title, description, Open Graph) e `public/sitemap.xml`
  atualizado.
- Verificação final no navegador (home, preços com simulação, uma subpágina,
  parceiros, materiais) e build limpo.
- Fora do escopo: checkout na landing, cupons do Admin Master, alterações em
  app/dashboard/pagamentos, qualquer cliente, número, logo ou depoimento inventado.
