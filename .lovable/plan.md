## Objetivo
Atribuir uma cor distinta a cada uma das 5 etapas do programa NR-1 na página `/nr1/etapas`, tanto na **linha do tempo** (chips) quanto nos **cards** abaixo (borda lateral + ícone + badge "Etapa N").

## Paleta sugerida (semântica por fase do ciclo)

| # | Etapa | Cor | HSL | Racional |
|---|-------|-----|-----|----------|
| 1 | Preparação | Azul (Blue 500) | `217 91% 60%` | Planejamento, base |
| 2 | Mensuração | Verde-azulado (Teal 500) | `173 80% 40%` | Coleta de dados, diagnóstico |
| 3 | Apreciação de Resultados | Âmbar (Amber 500) | `38 92% 50%` | Análise, insights |
| 4 | Conscientização | Violeta (Violet 500) | `262 83% 58%` | Educação, mudança cultural |
| 5 | Transformação | Coral/Esmeralda (Emerald 600) | `160 84% 39%` | Ação, resultado, evolução |

Status (Concluída/Em andamento/Planejada) continua diferenciado por **opacidade/preenchimento**, não substitui a cor da etapa:
- Concluída → cor cheia + ✓
- Em andamento → cor + ring + pulse sutil
- Planejada → cor com 30% opacidade

## Mudanças técnicas

**Arquivo único:** `src/pages/nr1/Nr1Etapas.tsx`

1. Adicionar mapa `etapaCores: Record<string, { bg, border, text, ring }>` indexado por `e.key` (`preparacao`, `mensuracao`, `apreciacao`, `conscientizacao`, `transformacao`).
2. **Linha do tempo (chips):** aplicar `border-l-4` colorido, ícone na cor da etapa, fundo suave (`{cor}/10`) quando em andamento.
3. **Cards de etapa:** adicionar `border-l-4` colorido à esquerda do `Card`, badge "Etapa N" com fundo da cor da etapa, badge de status mantém cores atuais (verde/azul/cinza).
4. Usar classes Tailwind diretas com HSL inline via `style` OU adicionar tokens no `index.css` (`--nr1-etapa-1`...`--nr1-etapa-5`) e classes utilitárias. **Preferência:** tokens em `index.css` para consistência com o resto do módulo NR-1.

## Fora de escopo
- Não altera `JornadaStepper` (stepper da jornada de bem-estar, contexto diferente).
- Não altera lógica de status nem dados em `ETAPAS_PROGRAMA`.

Posso seguir com essa paleta ou prefere ajustar alguma cor antes?
