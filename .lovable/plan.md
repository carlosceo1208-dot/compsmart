
# Plano: Atualizar INPC para Janeiro/2026

## Situação Atual
- A API do IBGE retorna **Dezembro/2025** (0.21% mensal, 3.90% acumulado)
- O usuário confirma que o **Janeiro/2026** já foi divulgado oficialmente

## Dados Necessários
Para prosseguir, preciso confirmar os valores oficiais de Janeiro/2026:
- INPC mensal de Janeiro/2026: **?**
- INPC acumulado 12 meses: **?**

## Alterações Propostas

### 1. Atualizar Fallback na Edge Function
**Arquivo:** `supabase/functions/fetch-inpc/index.ts`

Atualizar o `FALLBACK_INPC` (linhas 16-22):
```typescript
const FALLBACK_INPC: INPCResponse = {
  monthly: X.XX,  // Valor de Janeiro/2026
  accumulated: X.XX,  // Acumulado 12 meses
  period: '12 meses',
  referenceMonth: 'Janeiro/2026',
  source: 'fallback',
};
```

### 2. Atualizar Fallback no Hook
**Arquivo:** `src/hooks/useEconomicData.ts`

Atualizar o `FALLBACK_INPC` (linhas 14-19):
```typescript
const FALLBACK_INPC: INPCData = {
  monthly: X.XX,  // Valor de Janeiro/2026
  accumulated: X.XX,  // Acumulado 12 meses
  period: '12 meses',
  referenceMonth: 'Janeiro/2026',
};
```

### 3. Inserir Registro no Banco de Dados
Criar migração SQL para inserir os dados atualizados:
```sql
INSERT INTO public.economic_parameters 
  (parameter_key, value, effective_date, metadata)
VALUES 
  ('inpc_monthly', X.XX, '2026-02-05', 
   '{"accumulated": X.XX, "period": "12 meses", "referenceMonth": "Janeiro/2026", "months": 12}'
  )
ON CONFLICT (parameter_key, effective_date) 
DO UPDATE SET 
  value = EXCLUDED.value,
  metadata = EXCLUDED.metadata;
```

---

## Pergunta
Por favor, informe os valores oficiais do INPC de Janeiro/2026:
1. **INPC mensal** (variação do mês)
2. **INPC acumulado** (últimos 12 meses)

Com esses dados, implementarei as 3 alterações automaticamente.
