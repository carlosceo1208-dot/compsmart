

# Plano: Glossario de Desempenho Completo e Educativo

## Contexto e Visao

A gestao de desempenho e um dos temas mais sensiveis do RH corporativo. Existem varios tabus:

- **Medo de avaliacao**: Colaboradores associam avaliacao a punicao, nao a desenvolvimento
- **Falta de transparencia**: Processos obscuros geram desconfianca
- **Experiencias negativas**: Feedbacks mal dados deixam traumas
- **Subjetividade**: Percepcao de injustica e favoritismo

Um glossario bem elaborado pode **desmistificar** esses conceitos e **educar** gestores e colaboradores.

---

## Estrutura Proposta

### 1. Nova Estrutura de Dados

Cada termo tera:

```typescript
interface GlossaryTerm {
  term: string;           // Nome do termo
  category: string;       // Categoria (Avaliacao, Desenvolvimento, etc)
  summary: string;        // Resumo curto (ate 5 linhas)
  fullContent: string;    // Conteudo completo expandivel
  examples?: string[];    // Exemplos praticos
  tips?: string[];        // Dicas de aplicacao
  myths?: string[];       // Mitos desmistificados (opcional)
}
```

### 2. Categorias

| Categoria | Icone | Descricao |
|-----------|-------|-----------|
| Tipos de Avaliacao | ClipboardCheck | 90, 180, 360, calibracao |
| Desenvolvimento | TrendingUp | PDI, gaps, feedback |
| Competencias | Brain | Hard skills, soft skills |
| Ferramentas | LayoutGrid | 9Box, metas SMART |
| Reconhecimento | Award | Kudos, performance review |
| Sucessao | Users | Potencial, plano de sucessao |

### 3. Interface com "Saiba Mais"

```text
+-----------------------------------------------+
| [Icone] TERMO                    [Categoria]  |
+-----------------------------------------------+
| Resumo em ate 5 linhas que explica o conceito |
| de forma clara e acessivel para leigos.       |
|                                               |
|          [v] Saiba mais                       |
+-----------------------------------------------+
        |
        v (ao clicar)
+-----------------------------------------------+
| **O que e?**                                  |
| Explicacao detalhada do conceito...           |
|                                               |
| **Exemplos Praticos**                         |
| - Exemplo 1: ...                              |
| - Exemplo 2: ...                              |
|                                               |
| **Dicas de Aplicacao**                        |
| - Dica 1: ...                                 |
|                                               |
| **Mitos Desmistificados** (quando aplicavel)  |
| - Mito: "Avaliacao serve para demitir"        |
|   Realidade: Serve para desenvolver...        |
+-----------------------------------------------+
```

---

## Conteudo Expandido dos Termos

### Termos Atuais (16) + Novos Termos Sugeridos (8)

#### Tipos de Avaliacao

**1. Avaliacao 90 graus**
- **Resumo**: Modelo de avaliacao onde apenas o gestor direto avalia o colaborador. E o formato mais simples e tradicional, focado na visao hierarquica do desempenho.
- **Conteudo completo**: Explicacao de quando usar, vantagens (rapidez, simplicidade), desvantagens (visao unilateral), exemplos de empresas que usam.
- **Dica**: "Combine com autoavaliacao para enriquecer a conversa"
- **Mito**: "E ultrapassado" - Realidade: Ainda e muito eficaz para equipes pequenas

**2. Avaliacao 180 graus**
- **Resumo**: Combina a avaliacao do gestor com a autoavaliacao do colaborador. Promove dialogo e reflexao, sendo o ponto de partida para muitas empresas.
- **Exemplos**: Como conduzir a conversa pos-avaliacao

**3. Avaliacao 360 graus**
- **Resumo**: Avaliacao completa que inclui gestor, pares, subordinados (se houver) e autoavaliacao. Oferece uma visao holistica do colaborador.
- **Mito**: "Vira 'caça as bruxas'" - Realidade: Quando bem conduzida, e a mais justa

**4. Avaliacao de Desempenho**
- **Resumo**: Processo estruturado de mensuracao do desempenho que alinha expectativas, identifica gaps e direciona desenvolvimento. Fundamental para meritocracia.
- **Mito**: "Serve para justificar demissoes" - Realidade: Serve para desenvolver pessoas

#### Processo e Calibracao

**5. Calibracao**
- **Resumo**: Reuniao entre gestores para alinhar criterios de avaliacao e garantir equidade. Evita que um gestor seja muito rigoroso e outro muito leniente.
- **Exemplo**: "Joao foi avaliado como 'excepcional' por Maria, enquanto Pedro, com desempenho similar, foi avaliado como 'bom' por Carlos. Na calibracao, alinham-se os criterios."

**6. Performance Review** (NOVO detalhamento)
- **Resumo**: Processo formal de analise do desempenho em um periodo. Pode ser trimestral, semestral ou anual, dependendo da cultura da empresa.

#### Desenvolvimento

**7. Feedback**
- **Resumo**: Retorno sobre desempenho, comportamento ou resultado. Quando bem feito, e a ferramenta mais poderosa de desenvolvimento. Pode ser positivo (reforco) ou construtivo (melhoria).
- **Dicas**: Tecnica SBI (Situacao-Comportamento-Impacto), feedback sanduiche
- **Mito**: "Feedback negativo desmotiva" - Realidade: Feedback construtivo, bem dado, motiva

**8. Gap de Competencia**
- **Resumo**: Diferenca entre o nivel esperado e o avaliado de uma competencia. Identificar gaps e o primeiro passo para o desenvolvimento.
- **Exemplo**: "Se o cargo exige 'negociacao nivel 4' e o colaborador esta no 'nivel 2', ha um gap de 2 niveis"

**9. PDI - Plano de Desenvolvimento Individual**
- **Resumo**: Documento que registra acoes concretas para desenvolver competencias. Deve ser SMART e ter acompanhamento periodico.
- **Exemplo**: "Gap: comunicacao. Acao: curso de oratoria + apresentar em 3 reunioes. Prazo: 90 dias"

#### Competencias

**10. Competencia Tecnica (Hard Skill)**
- **Resumo**: Habilidades e conhecimentos especificos para executar tarefas. Sao mensuraveis e podem ser aprendidas em cursos, treinamentos e pratica.
- **Exemplos**: Excel avancado, programacao, contabilidade, idiomas

**11. Competencia Comportamental (Soft Skill)**
- **Resumo**: Habilidades interpessoais e emocionais. Sao mais dificeis de medir e desenvolver, mas cada vez mais valorizadas.
- **Exemplos**: Lideranca, comunicacao, resiliencia, empatia
- **Dica**: "Soft skills podem ser desenvolvidas com mentoria e feedback continuo"

#### Ferramentas

**12. Matriz 9Box**
- **Resumo**: Ferramenta que cruza Desempenho (eixo X) e Potencial (eixo Y) em uma grade 3x3. Ajuda a identificar talentos, backups e colaboradores que precisam de atencao.
- **Exemplo visual**: Descricao de cada quadrante

**13. Meta SMART**
- **Resumo**: Metodologia para criar metas claras: Especifica, Mensuravel, Atingivel, Relevante e Temporal. Metas mal definidas sao a maior causa de frustracao.
- **Exemplo**: "Aumentar vendas em 20% no Q3" vs "Melhorar vendas" (vago)

#### Reconhecimento

**14. Kudos** (ja detalhado)
- Manter conteudo atual que ja esta rico

#### Potencial e Sucessao

**15. Potencial**
- **Resumo**: Capacidade de assumir responsabilidades maiores ou diferentes no futuro. Diferente de desempenho, que olha para o passado, potencial olha para o futuro.
- **Mito**: "Alto desempenho = alto potencial" - Realidade: Sao dimensoes diferentes

**16. Sucessao**
- **Resumo**: Processo de identificar e preparar colaboradores para posicoes-chave. Garante continuidade do negocio e retencao de talentos.
- **Dica**: "Todo lider deveria ter pelo menos 2 nomes prontos para sucede-lo"

#### NOVOS TERMOS SUGERIDOS

**17. Check-in / One-on-One**
- **Resumo**: Reunioes periodicas (geralmente semanais ou quinzenais) entre gestor e colaborador para alinhamento, feedback e suporte.
- **Dica**: "Nao e para cobrar tarefas, e para desenvolver pessoas"

**18. OKR (Objectives and Key Results)**
- **Resumo**: Metodologia de gestao de metas que define Objetivos ambiciosos e Resultados-Chave mensuraveis. Popularizada pelo Google.

**19. Feedback Continuo**
- **Resumo**: Pratica de dar feedback em tempo real, no momento em que o comportamento ocorre. Mais eficaz que esperar a avaliacao anual.

**20. Autoavaliacao**
- **Resumo**: Processo em que o colaborador reflete sobre seu proprio desempenho. Desenvolve autoconsciencia e prepara para a conversa com o gestor.

**21. Ciclo de Desempenho**
- **Resumo**: Periodo definido para avaliacao (trimestral, semestral, anual). Define quando metas sao estabelecidas e quando sao avaliadas.

**22. Cultura de Feedback**
- **Resumo**: Ambiente organizacional onde feedback e natural, frequente e bem recebido. E construida com pratica e exemplo da lideranca.

**23. Vieses Inconscientes**
- **Resumo**: Tendencias cognitivas que afetam avaliacoes sem que percebamos. Incluem efeito halo, recencia, similaridade e estereotipos.
- **Dica**: "Calibracao ajuda a reduzir vieses"

**24. Employee Experience**
- **Resumo**: Jornada completa do colaborador na empresa, desde a contratacao ate o desligamento. Avaliacao de desempenho e um ponto de contato critico.

---

## Alteracoes Tecnicas

### Arquivo: `src/pages/performance/PerformanceGlossary.tsx`

1. Expandir estrutura de dados com campos `summary`, `fullContent`, `examples`, `tips`, `myths`
2. Adicionar categorias com icones
3. Implementar componente `Collapsible` para "Saiba mais"
4. Adicionar busca e filtro por categoria (igual ao Glossary.tsx)
5. Estilizar com cores do modulo de Performance (indigo)

### Componentes a Usar

- `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` - para expandir
- `Input` com icone de busca - para filtrar
- `Badge` - para categorias
- `ChevronDown` - icone de expansao
- `Separator` - entre secoes

---

## Resultado Esperado

1. **24 termos** completos e educativos (vs 16 superficiais atuais)
2. **6 categorias** organizadas com icones
3. **Busca e filtro** por termo e categoria
4. **"Saiba mais"** expansivel para cada termo
5. **Exemplos praticos** que desmistificam o tema
6. **Tom educativo** e nao punitivo

---

## Beneficios

- **Para colaboradores**: Entendem o processo e participam melhor
- **Para gestores**: Referencia rapida de como aplicar conceitos
- **Para RH**: Ferramenta de endomarketing e educacao
- **Para a empresa**: Cultura de feedback e desenvolvimento

