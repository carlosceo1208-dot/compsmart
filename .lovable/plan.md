# Ajuste de copy da Home — RH estratégico

## Objetivo
Reposicionar a abertura da Home em torno de decisões orientadas por dados e alinhar as seções relacionadas, preservando integralmente os fluxos e validações já aprovados.

## Alterações

1. **Topo da Home**
   - Substituir o título por: **“O RH que decide com dados não apaga incêndio. Ele constrói o futuro.”**
   - Substituir o subtítulo por: **“Da conformidade ao crescimento: NR-1, clima, remuneração e sucessão em uma plataforma que transforma pessoas em vantagem competitiva — com consultoria sob demanda para levar do diagnóstico ao resultado.”**
   - Manter o selo NR-1 e os CTAs “Diagnóstico gratuito em 2 min” e “Ver demonstração”, com os mesmos destinos e identificadores.
   - Preservar sem alteração a faixa “Estamos reconstruindo…” acima do menu.

2. **Contraponto**
   - Manter os três cards e seus conteúdos essenciais.
   - Revisar somente os títulos para: “RH em modo apaga-incêndio”, “Clima que vira PDF esquecido na gaveta” e “Anonimato que esconde problemas”.

3. **Seções preservadas**
   - Manter sem alteração o título “A estrutura a gente entrega. O resultado, também.”
   - Manter sem alteração “Só a CompSmart cruza NR-1 × Clima × 9-Box × Remuneração”.
   - Manter como aprovadas as seções de agentes, recrutamento, simulador, materiais, demonstração, empresas-piloto, FAQ e rodapé.

4. **Modelo de Maturidade na Home**
   - Apresentar claramente os dois eixos 5×2:
     - Maturidade Estrutural: Reativo, Operacional, Tático, Estratégico e Transformador.
     - Estilo de Gestão: Controle, Informativo, Participativo, Facilitador e Empoderamento.
   - Substituir as marcações genéricas “Nível 1–5” pelos nomes correspondentes.
   - Não afirmar que o diagnóstico atual cruza percepção e realidade nem que calcula o estilo de gestão.

5. **Página e resultado de Maturidade**
   - No resultado atual, exibir somente o nome do eixo estrutural: Reativo, Operacional, Tático, Estratégico ou Transformador.
   - Manter internamente os códigos, limites de pontuação, validação e envio já aprovados, usando uma camada apenas de apresentação para os novos nomes. Assim, os dados existentes e o contrato atual não mudam.
   - Apresentar o eixo Estilo de Gestão apenas como parte explicativa do modelo, sem calculá-lo ou inferi-lo.

6. **SEO da Home**
   - Atualizar somente a entrada da rota `/` na fonte única `seoRoutes.ts`.
   - Título: **“CompSmart — O RH que constrói o futuro com dados”**.
   - Descrição: **“RH estratégico orientado por dados: NR-1, clima, remuneração e sucessão em uma plataforma com 8 agentes de IA e consultoria sob demanda.”**
   - Manter o restante do SEO público e das rotas sem alteração.

## Detalhes técnicos
- Centralizar os cinco nomes estruturais e os cinco nomes de estilo em uma configuração compartilhada pela Home e pela página de Maturidade.
- Criar uma camada visual completa entre as cinco faixas internas aprovadas e os novos nomes estruturais, com fallback seguro para impedir rótulo vazio.
- Atualizar somente os testes que verificam os rótulos afetados; manter os testes de limites e regras intactos.

## Fora do escopo
- Nenhuma alteração em simulador, materiais, formulários, validadores, banco, cabeçalho, rodapé, LGPD, rotas, âncoras ou IDs de telemetria.
- Manter as rotas confirmadas `/maturidade` e `/modulos/selecao-rs` e as âncoras `#modelo`, `#maturidade`, `#precos`, `#materiais`, `#demonstracao` e `#faq`.
- Não introduzir “R$ 1”, “R$ 225”, “teste grátis” nem “plano gerado em minutos”.
- Nenhuma publicação nesta etapa.

## Validação
- Rodar a verificação completa do projeto.
- Conferir a Home e `/maturidade` em 1280 px e 390 px.
- Validar selo NR-1 sem duplicar a faixa global, textos, CTAs, nomes completos sem cortes e ausência de promessa sobre cruzamento percebido × real.
- Reconfirmar a grade de agentes em duas colunas no celular, com o selo “IA” inteiro, todas as âncoras e os valores preservados do simulador: 100 × 3 = R$ 1.000 e 100 × 4 = R$ 1.250.
- Confirmar que o resultado continua respeitando exatamente as faixas de pontuação aprovadas e envia os mesmos valores internos.
- Conferir que somente a maturidade estrutural aparece no resultado e que o Estilo de Gestão permanece explicativo.
- Revisar em 390 px a hierarquia e as quebras do novo subtítulo longo, evitando um bloco visual pesado.
- Verificar no `<head>` da Home o novo título e a nova descrição vindos de `seoRoutes.ts`.
- Entregar na prévia para aprovação antes de publicar.
