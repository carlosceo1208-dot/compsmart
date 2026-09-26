# Novos textos da Home (copy do arquivo enviado)

Troca somente de textos e ordem de seções da página inicial, mais uma seção nova de prova visual. Cores, fontes, imagens atuais, outras páginas, app, backend e SEO não mudam.

## 1. Topo (acima da dobra)
- Título: "De dados de RH a resultados de negócio."
- Subtítulo: "A CompSmart cruza o que nenhuma outra ferramenta cruza — remuneração, risco psicossocial, clima e potencial. Você recebe diagnóstico, plano de ação e métricas que o conselho entende."
- Botão principal: "Fazer o diagnóstico gratuito em 2 minutos" → /diagnostico.
- Botão secundário: "Ver demonstração ao vivo" → abre o formulário de demonstração já existente.
- Mantém o símbolo e a faixa "NR-1 × Clima × 9-Box × Remuneração". Sai o botão do e-book do topo (continua em Materiais e no rodapé de conversão).

## 2. Dor
Título "Quanto custa decidir RH no achismo?" + o corpo enviado; os 3 cards atuais continuam abaixo.

## 3. Diferencial
Título "Só a CompSmart cruza remuneração × risco × clima × potencial." + corpo enviado.

## 4. Cards dos módulos
Nova chamada nos 5 módulos indicados (NR-1, Clima, R&S, Remuneração/Core, 9-Box). Os demais módulos mantêm o texto atual.

## 5. Nova seção "Resultado não se explica — se mostra."
Título + corpo "Veja como a CompSmart traduz dados em decisão, módulo a módulo." Grade 2x2 no computador, 1 coluna no celular; cada tela em proporção 16:9.

1) Os 4 dashboards contêm números ilustrativos plausíveis, apenas para exemplificar o tipo de resultado que a plataforma entrega — cada empresa terá os seus dados reais no futuro, que entrarão no lugar.
2) Selo "Exemplo ilustrativo" visível em cada um dos 4 cards, para ninguém interpretar como resultado real de cliente.
3) Todos os valores de exemplo ficam centralizados num único arquivo de dados, para troca instantânea por dados reais depois, sem refazer o layout.
4) As 4 imagens enviadas (mockups) são só referência visual de layout, estrutura e estilo; cada tela é recriada na própria página, nas cores da CompSmart. As imagens em si não entram no site.

Conteúdo de cada tela:
- NR-1 — Mapa de risco psicossocial: mapa de calor das 6 dimensões COPSOQ-III (Exigências, Controle, Apoio Social, Relacionamentos, Recompensas, Segurança) × grupos; selo "Risco Alto → Baixo"; "Risco global: Baixo", "Dimensão crítica: 1"; tendência "Evolução do risco ao longo dos meses" em queda.
- Clima — eNPS e engajamento: medidor com eNPS 62 e "+18 pts"; Participação 91%, Engajamento 78%; barras por área (Vendas, Operações, TI, Financeiro, RH); tendência por trimestre subindo.
- Seleção — Funil de contratação: Triagem → Entrevista RH → Entrevista Gestor → Proposta → Contratado com contagens e %; "Tempo médio de fecho: 21 dias" (-40%), "Vagas ativas: 12", "Taxa de conversão: 18%"; mini linha em queda e lista de vagas.
- Remuneração — Compa-Ratio e competitividade: curva com P25/P50/P75 e pontos por cargo; "Compa-Ratio: 94%", "Funções abaixo do mercado: 3", alertas âmbar de "Defasagem" e "Alerta: Revisar faixa"; ranking de cargos com Acima / Alinhado / Abaixo.

## 6. Como funciona
Título "Diagnóstico → Plano → Acompanhamento." + corpo enviado; 3 passos alinhados a esse fluxo.

## 7. Autoridade
Substitui o espaço "Resultados em breve" por "Décadas de RH executivo, agora em plataforma." + corpo enviado (sem logos, nomes de empresas ou depoimentos).

## 8. FAQ
Acrescenta 3 perguntas: LGPD/anonimato, porte da empresa, implementação — mantendo as atuais.

## 9. Chamada final
"Sua empresa está pronta para decidir RH com dados?" com "Fazer o diagnóstico gratuito →" (/diagnostico) e "Falar com um especialista" (demonstração).

## Ordem final
Topo → faixa de urgência → segurança → Dor → Módulos → Diferencial → Prova visual → Vídeo → Como funciona → Integração com a folha → Preços → Autoridade → FAQ → Chamada final.

## Detalhes técnicos
- Editar `PivotHero`, `PainSection`, `CrossDataSection`, `PivotHowItWorks`, `SocialProofPlaceholder`, `PivotFAQSection` (JSON-LD acompanha), `PreFooterCTA`, `src/config/landingModules.ts` (chamada curta dos 5 módulos).
- Novo `src/components/landing/pivot/VisualProofSection.tsx` (SVG/Tailwind, tokens semânticos, cards 16-20px, `aspect-video`, badges pílula) com dados de exemplo em `src/config/visualProofData.ts`; inserido em `Index.tsx`.
- SEO da Home inalterado (`seoRoutes.ts`).
- Registrar a tarefa em `roadmap.md`.
- Verificação no navegador (desktop e celular) e rodar lint, typecheck, test, dead-code e build até passar.
