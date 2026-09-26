# Novos textos da Home (copy do arquivo enviado)

Troca somente de textos e ordem de seções da página inicial. Cores, fontes, imagens atuais, outras páginas, app e backend não mudam.

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
4 telas ilustrativas montadas na própria página (não são prints): Mapa de risco NR-1 (mapa de calor), Clima eNPS (medidor + barras), R&S (funil), Remuneração (curva salarial com alerta de defasagem). Sem números inventados: gráficos com formas neutras, selo "Exemplo ilustrativo" e os indicadores "[X]" substituídos por rótulos sem valor (ex.: "Evolução do risco ao longo dos meses"). Quando você tiver números reais, eles entram no lugar.

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
- Editar `PivotHero`, `PainSection`, `CrossDataSection`, `PivotHowItWorks`, `SocialProofPlaceholder`, `PivotFAQSection` (dados do JSON-LD atualizam juntos), `PreFooterCTA`, `src/config/landingModules.ts` (campo de chamada curta dos 5 módulos).
- Novo `src/components/landing/pivot/VisualProofSection.tsx` com SVG/Tailwind e tokens semânticos; inserido em `Index.tsx`.
- SEO da Home continua só em `seoRoutes.ts` (sem alteração nesta etapa).
- Verificação no navegador (desktop e celular) e build limpo.
