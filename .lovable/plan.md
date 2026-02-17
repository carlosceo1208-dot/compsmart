
# Plano: Glossario + PerformAI + Customizacao na Landing Page

## Resumo

Adicionar 18 termos de Avaliacao de Desempenho ao glossario, incluir o PerformAI como agente de IA na landing page, e destacar que a avaliacao e totalmente customizavel (competencias, metas individuais/depto/empresa, 90/180/360, 9Box).

---

## 1. Glossary.tsx -- Adicionar 18 termos de Avaliacao de Desempenho

**Titulo atualizado:** "Glossario de C&S e Desempenho"
**Subtitulo atualizado:** incluir "e Avaliacao de Desempenho"

Nova categoria **"Avaliacao de Desempenho"** com os termos:

| Termo | Definicao resumida |
|-------|-------------------|
| Avaliacao 90 | Feita pelo gestor direto |
| Avaliacao 180 | Autoavaliacao + gestor |
| Avaliacao 360 | Multidirecional (gestor, pares, subordinados, externos) |
| Matriz 9Box | Desempenho x Potencial em 9 quadrantes |
| PDI | Plano de acoes de desenvolvimento |
| Dimensoes de Agilidade | 5 dimensoes: Aprendizado, Mental, Pessoas, Mudancas, Resultados |
| OKR | Metas cascateadas empresa > depto > colaborador |
| Plano de Sucessao | Ate 3 sucessores para posicoes-chave |
| Reconhecimento (Kudos) | Valorizacao publica de conquistas |
| 1:1 (One-on-One) | Reuniao periodica gestor-colaborador |
| Feedback Continuo | Retorno constante sem esperar ciclo formal |
| Compa-Ratio de Merito | Salario vs ponto medio ajustado por desempenho |
| eNPS | Indicador de engajamento (Promotores/Neutros/Detratores) |
| PerformAI | Agente IA para feedbacks, PDIs, 9Box e devolutivas |
| Risco de Retencao | Classificacao Baixo/Medio/Alto de perda do colaborador |
| Ciclo de Avaliacao | 4 etapas: Metas, Acompanhamento, Insights, Fechamento |
| Competencias | Conhecimentos, habilidades e atitudes customizaveis por cargo/area |
| Metas Individuais, Departamentais e Corporativas | 3 niveis cascateados com pesos configuraveis |

---

## 2. IntegrationSection.tsx -- PerformAI + Customizacao

Atualizar o bloco de Avaliacao de Desempenho (direita) para 7 itens:

- "100% Customizavel (Competencias, Metas, 9Box)" (icone Settings)
- "Metas: Individuais, Depto. e Empresa" (icone Target)
- "Avaliacao 90, 180, 360" (manter)
- "PDI (Plano de Desenvolvimento)" (manter)
- "9Box + Plano de Sucessao" (manter)
- **"PerformAI (Agente IA de Desempenho)"** (icone Bot) -- NOVO
- "Reconhecimento + 1:1 Continuo" (consolidado)

Adicionar imports: Bot, Settings de lucide-react.

---

## 3. FAQSection.tsx -- Atualizar 2 perguntas

**Pergunta "Quais modelos de avaliacao...":** Reescrever para mencionar:
- Totalmente customizavel as necessidades da empresa
- Competencias e metas configuraveis
- Metas em 3 niveis (individuais, departamentais, corporativas)
- PerformAI como agente que auxilia feedbacks, PDIs e devolutivas

**Pergunta "Como funcionam os Agentes Inteligentes de IA?":** Adicionar PerformAI como 4o agente:
- Juridico Smart, Salary Smart, R&B Smart e **PerformAI** (avaliacao de desempenho, feedbacks, PDIs automaticos, analise 9Box)

---

## 4. planFeatures.ts -- PerformAI nos planos

- **Starter:** "Avaliacao de Desempenho integrada + PerformAI" com tooltip mencionando customizacao
- **Medium:** "Avaliacao completa (...) + PerformAI" com tooltip sobre competencias e metas customizaveis
- **Pro:** "Avaliacao avancada + Reconhecimento + 5 dimensoes + PerformAI" com tooltip sobre analise preditiva

---

## Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| src/pages/Glossary.tsx | +18 termos, titulo e subtitulo atualizados |
| src/components/landing/IntegrationSection.tsx | PerformAI + customizacao no bloco de desempenho |
| src/components/landing/FAQSection.tsx | PerformAI em 2 respostas, customizacao destacada |
| src/config/planFeatures.ts | PerformAI nos tooltips de 3 planos |
