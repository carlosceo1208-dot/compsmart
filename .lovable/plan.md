
# Plano: Revolução do Dashboard de Avaliação de Desempenho - Inspirado em Mindsight

## Visao Geral da Inovacao

Analisando o site da Mindsight (https://conteudos.mindsight.com.br/sistemas-integrados-rh) e as capturas de tela fornecidas, identifiquei diferenciais visuais e funcionais impressionantes que podemos adaptar e superar no CompSmart.

### Destaques da Mindsight que Vamos Superar:

1. **IA Synapses** - IA integrada que transforma dados em insights claros
2. **Dashboard Visual Rico** - Cards com foto do colaborador, metricas de engajamento, alertas visuais
3. **Graficos Impressionantes** - eNPS, distribuicao de alertas, donuts interativos
4. **Card de Perfil Executivo** - Foto + cargo + botoes de acao rapida (Metas, Combinados, PDI, etc)
5. **Alertas de Performance** - Sistema de classificacao visual (Atencao/Neutros/Positivos)

---

## 1. PerformAI 2.0 - Assistente Inteligente Revolucionario

### Transformacao Proposta:

**De:** Widget simples de chat com perguntas pre-definidas
**Para:** Central de Inteligencia de Desempenho com capacidades avancadas

### Novas Funcionalidades:

| Funcionalidade | Descricao |
|----------------|-----------|
| **Analise de Colaborador** | Selecionar colaborador e receber resumo executivo com historico, tendencias e recomendacoes |
| **Geracao de Devolutiva** | IA gera texto personalizado de feedback baseado nas avaliacoes |
| **Sugestao Automatica de PDI** | Baseado em gaps identificados, sugere acoes de desenvolvimento |
| **Comparativo Temporal** | "Como este colaborador evoluiu nos ultimos 3 ciclos?" |
| **Predicao de Risco** | Alertas proativos: "Maria pode estar em risco de turnover" |
| **Coach Virtual** | Perguntas guiadas para gestores: "Como dar feedback sobre baixa performance?" |

### Melhorias de UX:

- Streaming de respostas token-by-token
- Historico de conversas persistente
- Contexto do colaborador selecionado
- Sugestoes dinamicas baseadas no contexto
- Botoes de acao dentro das respostas (ex: "Criar PDI", "Agendar 1:1")

---

## 2. Novo Dashboard de Desempenho - Visual Executivo

### Layout Inspirado em Mindsight:

```text
+------------------------------------------+
|  [Perfil do Gestor/HR]    [KPIs Rapidos] |
|  +-------------------+  +--------------+ |
|  | Foto + Nome       |  | Ciclo Ativo  | |
|  | Cargo             |  | Avaliacoes   | |
|  | [Botoes Acao]     |  | Pendentes    | |
|  +-------------------+  +--------------+ |
+------------------------------------------+
|  [Engajamento]  [Alertas Performance]    |
|  +-------------+ +---------------------+ |
|  | eNPS: 65.8  | | 35 Alertas Total    | |
|  | [Donut]     | | Atencao: 8 (Verm)   | |
|  |             | | Neutros: 18 (Cinz)  | |
|  |             | | Positivos: 7 (Verd) | |
|  +-------------+ +---------------------+ |
+------------------------------------------+
|  [9Box Mini]  [Ultimos Kudos]  [1:1s]    |
+------------------------------------------+
```

### Novos Cards:

1. **Card de Engajamento (eNPS)**
   - Score grande centralizado
   - Grafico donut com Detratores/Neutros/Promotores
   - Percentual de adesao das avaliacoes

2. **Card de Alertas de Performance**
   - Grafico donut com 3 categorias visuais
   - Barras horizontais com cores
   - Click-to-filter por tipo de alerta

3. **Card de Perfil Executivo**
   - Foto do usuario logado ou colaborador selecionado
   - Nome + Cargo + Departamento
   - Botoes de acao rapida: Metas, Combinados, PDI, Check-in

4. **Mini 9Box Interativo**
   - Versao compacta da matriz 9Box
   - Indicadores visuais de distribuicao
   - Click para expandir

5. **Timeline de Atividades**
   - Ultimas avaliacoes realizadas
   - Kudos recentes
   - PDIs criados

---

## 3. Sistema de Alertas de Performance

### Nova Tabela no Banco de Dados:
```
performance_alerts
- id, employee_id, alert_type, severity, message, created_at, resolved_at
```

### Tipos de Alerta:

| Severidade | Cor | Exemplos |
|------------|-----|----------|
| **Atencao** | Vermelho | Score < 2.0, Meta atrasada >30 dias, 3+ meses sem 1:1 |
| **Neutro** | Cinza | Avaliacao pendente, PDI proximo do prazo |
| **Positivo** | Verde | Score > 4.0, Meta atingida, Top 10% performance |

### Logica de Deteccao Automatica:
- Edge function executada diariamente
- Analisa scores, metas, prazos
- Gera alertas automaticos

---

## 4. Metricas de Engajamento

### Calculo do eNPS:
```
eNPS = % Promotores (9-10) - % Detratores (0-6)
```

### Novos Indicadores:

| Metrica | Descricao |
|---------|-----------|
| **eNPS** | Net Promoter Score do colaborador |
| **Taxa de Adesao** | % de avaliacoes completadas |
| **Indice de Feedback** | Frequencia de 1:1s e Kudos |
| **Velocidade de PDI** | % de PDIs concluidos no prazo |

---

## 5. Pagina do PerformAI Reformulada

### Nova Estrutura:

```text
+----------------------------------------+
| PerformAI - Central de Inteligencia    |
+----------------------------------------+
| [Contexto]        | [Chat Expandido]   |
| +---------------+ | +----------------+ |
| | Colaborador:  | | | Historico      | |
| | [Selector]    | | | Conversas      | |
| |               | | |                | |
| | Dados Rapidos | | | Streaming      | |
| | - Ciclo atual | | | Markdown       | |
| | - Ultima AVD  | | |                | |
| | - Score atual | | | [Acoes inline] | |
| +---------------+ | +----------------+ |
+----------------------------------------+
| [Acoes Inteligentes]                   |
| +------------------------------------+ |
| | Gerar Devolutiva | Sugerir PDI    | |
| | Analisar 9Box    | Comparar Ciclo | |
| +------------------------------------+ |
+----------------------------------------+
```

### Acoes Inteligentes com Contexto:

1. **"Analisar Joao Silva"**
   - PerformAI busca dados reais do banco
   - Gera resumo executivo com historico
   - Sugere acoes baseadas nos dados

2. **"Gerar Devolutiva"**
   - Considera scores, pontos fortes, areas de melhoria
   - Gera texto personalizado pronto para usar
   - Botao para copiar ou enviar

3. **"Sugerir PDI"**
   - Analisa gaps de competencias
   - Lista 3-5 acoes de desenvolvimento
   - Botao para criar PDI diretamente

---

## 6. Graficos Impressionantes com Recharts

### Novos Componentes de Visualizacao:

1. **DonutChart com Centro Interativo**
   - Numero grande no centro
   - Legenda lateral
   - Hover com detalhes

2. **RadialProgress**
   - Para metricas 0-100%
   - Animacao de entrada
   - Cores gradientes

3. **HorizontalBarRace**
   - Barras empilhadas
   - Cores por categoria
   - Labels inline

4. **SparklineCards**
   - Mini graficos de linha em cards
   - Tendencia dos ultimos 6 meses
   - Indicador de direcao

---

## Secao Tecnica - Implementacao

### Arquivos a Criar:

| Arquivo | Descricao |
|---------|-----------|
| `src/components/performance/PerformanceInsightsDashboard.tsx` | Novo dashboard visual |
| `src/components/performance/EngagementCard.tsx` | Card eNPS com donut |
| `src/components/performance/AlertsCard.tsx` | Card alertas performance |
| `src/components/performance/ProfileExecutiveCard.tsx` | Card perfil executivo |
| `src/components/performance/Mini9BoxCard.tsx` | 9Box compacto |
| `src/components/performance/PerformAIAssistant.tsx` | Nova pagina PerformAI |
| `src/hooks/usePerformanceAlerts.ts` | Hook para alertas |
| `src/hooks/useEngagementMetrics.ts` | Hook para metricas |
| `supabase/functions/detect-performance-alerts/index.ts` | Edge function alertas |

### Alteracoes em Arquivos Existentes:

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/PerformanceDashboard.tsx` | Substituir por novo layout |
| `src/pages/performance/PerformanceAssistant.tsx` | Upgrade completo |
| `src/components/performance/PerformAIChat.tsx` | Adicionar streaming |
| `src/hooks/usePerformAI.ts` | Adicionar selecao colaborador |
| `supabase/functions/performance-assistant/index.ts` | Novos comandos IA |

### Migracoes de Banco:

```sql
-- Tabela de alertas de performance
CREATE TABLE performance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  employee_id UUID REFERENCES employees(id),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('attention', 'neutral', 'positive')),
  title TEXT NOT NULL,
  message TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;
```

---

## Resultado Esperado

### Antes vs Depois:

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Dashboard** | Estatico, texto-heavy | Visual, graficos interativos, cards executivos |
| **PerformAI** | Widget basico | Central de inteligencia com contexto |
| **Alertas** | Inexistente | Sistema proativo de deteccao |
| **Metricas** | KPIs simples | eNPS, engagement, tendencias |
| **UX** | Funcional | Impressionante e user-friendly |

### Diferenciais sobre Mindsight:

1. **IA Generativa Real** - PerformAI gera conteudo, nao apenas analisa
2. **Integracao Remuneracao** - Alertas conectados com merito e PLR
3. **Acessibilidade** - Dark mode, responsive, acessivel
4. **Customizacao** - Alertas configuraveis por empresa

---

## Fases de Implementacao Sugeridas

| Fase | Entregaveis | Prioridade |
|------|-------------|------------|
| **1** | Dashboard visual + Cards de engajamento | Alta |
| **2** | Sistema de alertas + Deteccao automatica | Alta |
| **3** | PerformAI 2.0 com streaming e contexto | Media |
| **4** | Graficos avancados + Animacoes | Media |
| **5** | Predicao de riscos + Coach virtual | Baixa |
