# Corrigir a hierarquia do topo da Home — NR-1 × Maturidade

## Objetivo

Deixar o herói “Descubra o nível de maturidade da sua gestão de pessoas.” como o primeiro conteúdo da Home abaixo do menu, sem selo ou alerta de NR-1 antes dele. Concentrar a urgência regulatória exclusivamente na Landing NR-1.

## Alterações

1. **Home**
   - Remover o `UrgencyBanner` do herói e sua importação.
   - Preservar integralmente título, subtítulo, imagem e os CTAs “Diagnóstico gratuito em 2 min” e “Ver demonstração”.
   - Manter NR-1 somente no menu, na grade dos oito módulos e nas seções em que participa do diferencial.

2. **Landing NR-1**
   - Reaproveitar o aviso existente com o texto aprovado: “Fiscalização da NR-1 começou. Portaria MTE 1.419/2024 — riscos psicossociais agora fazem parte do PGR.”
   - Exibi-lo como destaque de alerta dentro do topo temático da Landing NR-1, associado ao conteúdo da página.
   - Manter a faixa global “Estamos reconstruindo…” e o restante da Landing NR-1 sem alterações.

3. **Escopo preservado**
   - Não alterar a seção de Maturidade 5×2, SEO da rota `/`, simulador, materiais, formulários, banco, rotas, âncoras, ids de telemetria, menu ou rodapé.
   - Não publicar sem aprovação explícita.

## Validação na prévia

- Conferir em 1280px e 390px que o herói de maturidade é o primeiro conteúdo da Home abaixo do menu e não há alerta NR-1 acima dele.
- Conferir que o aviso regulatório aparece na Landing NR-1 e não na Home.
- Confirmar título, subtítulo e CTAs intactos; testar as âncoras.
- Confirmar o simulador com 100 colaboradores: 3 módulos = R$ 1.000 e 4 módulos = R$ 1.250.
- Rodar a verificação completa do projeto e revisar erros da prévia.
