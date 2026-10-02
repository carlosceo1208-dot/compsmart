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
   - Exibi-lo como destaque de alerta dentro do topo temático da Landing NR-1, na rota pública confirmada `/nr1`, associado ao conteúdo da página e sem aparência de segundo anúncio global.
   - Manter a faixa global “Estamos reconstruindo…” e o restante da Landing NR-1 sem alterações.

3. **Escopo preservado**
   - Não alterar a seção de Maturidade 5×2, SEO da rota `/`, simulador, materiais, formulários, banco, rotas, âncoras, ids de telemetria, menu ou rodapé.
   - Não publicar sem aprovação explícita.

## Validação na prévia

- Conferir em 1280px e 390px que o herói de maturidade é o primeiro conteúdo da Home abaixo do menu e não há alerta NR-1 acima dele.
- Conferir visualmente que a retirada do aviso não deixou espaçamento ou altura estranhos no topo do herói.
- Percorrer a Home inteira para confirmar que não restou nenhuma cópia do alerta regulatório.
- Conferir que o aviso regulatório aparece no topo temático de `/nr1`, associado ao produto, e não como uma segunda faixa global.
- Confirmar título, subtítulo, imagem e CTAs intactos; testar as âncoras.
- Confirmar o simulador com 100 colaboradores: 3 módulos = R$ 1.000 e 4 módulos = R$ 1.250.
- Rodar `bun run ci`, revisar erros da prévia e confirmar que não restou importação pendente de `UrgencyBanner` no herói da Home.
