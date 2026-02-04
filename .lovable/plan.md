
# Plano: Implementar Fallback Robusto para INPC

## Problema Identificado
A API do IBGE está bloqueando requisições diretas do navegador por CORS ("Failed to fetch"). Como o INPC é um índice mensal que muda raramente, precisamos de uma solução resiliente.

## Análise Técnica
- **Erro atual**: `TypeError: Failed to fetch` - indica bloqueio de CORS
- **Causa**: A API do IBGE não permite requisições cross-origin de navegadores
- **Tabela existente**: `economic_parameters` já armazena dados econômicos (salário mínimo)
- **Solução**: Usar a mesma estrutura para INPC + fallback estático

## Solução Proposta

### Estratégia de 3 Camadas
```text
┌─────────────────────────────────────────────────────┐
│            CAMADA 1: Edge Function (Proxy)          │
│  - Busca dados do IBGE via backend (sem CORS)       │
│  - Salva no banco para cache                        │
└──────────────────────┬──────────────────────────────┘
                       │ falhou?
                       ▼
┌─────────────────────────────────────────────────────┐
│            CAMADA 2: Banco de Dados                 │
│  - Busca último INPC salvo em economic_parameters   │
│  - Cache de até 30 dias                             │
└──────────────────────┬──────────────────────────────┘
                       │ não existe?
                       ▼
┌─────────────────────────────────────────────────────┐
│         CAMADA 3: Fallback Estático                 │
│  - Valores conhecidos de Janeiro/2025               │
│  - Sempre disponível como último recurso            │
└─────────────────────────────────────────────────────┘
```

## Mudanças Técnicas

### 1. Edge Function: `fetch-inpc` (NOVO)
Criar uma Edge Function que funciona como proxy para a API do IBGE:
- Busca dados da API do IBGE (sem restrição de CORS no backend)
- Salva o resultado na tabela `economic_parameters`
- Retorna os dados para o frontend

```text
Arquivo: supabase/functions/fetch-inpc/index.ts

Funcionalidades:
- GET request para API do IBGE
- Parsear resposta e calcular acumulado
- Salvar/atualizar em economic_parameters
- Retornar JSON para o frontend
```

### 2. Modificar `useEconomicData.ts`
Atualizar o hook para usar a nova estratégia:

```text
Fluxo novo:
1. Tentar chamar Edge Function fetch-inpc
2. Se falhar → buscar do banco economic_parameters
3. Se não houver no banco → usar fallback estático
4. Nunca mostrar "Indisponível"
```

**Fallback Estático (valores de Janeiro/2025)**:
- Mensal: 0.48%
- Acumulado 12m: 4.77%
- Referência: Janeiro/2025

### 3. Adicionar Registro INPC no Banco (opcional)
Inserir valores mais recentes conhecidos na tabela `economic_parameters` para servir como backup imediato.

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/functions/fetch-inpc/index.ts` | Criar | Proxy para API do IBGE |
| `src/hooks/useEconomicData.ts` | Modificar | Adicionar fallback robusto de 3 camadas |

## Resultado Esperado
- INPC **nunca** mostrará "Indisponível"
- Dados serão atualizados automaticamente quando possível
- Fallback mostra valores recentes conhecidos com indicação visual
- Performance melhorada (sem esperar timeout de API bloqueada)
