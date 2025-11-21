# 📚 Guia de Formatação de Valores - CompSmart

## ⚠️ Regras Obrigatórias

1. **NUNCA** use `toLocaleString` diretamente nos componentes
2. **NUNCA** use `toFixed` para exibição ao usuário  
3. **SEMPRE** importe de `@/lib/formatters`
4. **SEMPRE** valide valores antes de cálculos

---

## 🎯 Quando Usar Cada Função

### Moeda Brasileira (R$)

| Caso de Uso | Função | Entrada | Saída |
|-------------|--------|---------|-------|
| Valores com centavos | `formatCurrency(1234.56)` | `1234.56` | `R$ 1.234,56` |
| Valores sem centavos | `formatCurrencyNoDecimals(1234.56)` | `1234.56` | `R$ 1.235` |
| Valores compactos (K/M) | `formatCompactCurrency(1234567)` | `1234567` | `R$ 1.2M` |
| Multi-moeda (USD/BRL) | `formatCurrencyCustom(1234.56, 'USD')` | `1234.56, 'USD'` | `$ 1,234.56` |

**Exemplo de uso:**

```typescript
import { formatCurrency, formatCurrencyNoDecimals } from '@/lib/formatters';

// Para valores que precisam de precisão
<span>{formatCurrency(employee.salary)}</span>
// R$ 5.234,56

// Para valores em KPIs/dashboards
<span>{formatCurrencyNoDecimals(totalCost)}</span>
// R$ 125.432
```

---

### Porcentagens

| Caso de Uso | Função | Entrada | Saída |
|-------------|--------|---------|-------|
| Porcentagem simples | `formatPercentage(12.5)` | `12.5` | `12,5%` |
| Porcentagem com sinal | `formatPercentageSafe(12.5, 1, true)` | `12.5, 1, true` | `+12,5%` |
| Porcentagem customizada | `formatPercentageSafe(12.567, 2)` | `12.567, 2` | `12,57%` |

**Exemplo de uso:**

```typescript
import { formatPercentage, formatPercentageSafe } from '@/lib/formatters';

// Para percentuais básicos
<span>{formatPercentage(growth)}</span>
// 15,3%

// Para variações com sinal
<span>{formatPercentageSafe(variation, 1, true)}</span>
// +3,5% ou -2,1%
```

---

### Números Gerais

| Caso de Uso | Função | Entrada | Saída |
|-------------|--------|---------|-------|
| Contadores (headcount) | `formatInteger(42.7)` | `42.7` | `43` |
| Números simples | `formatNumber(1234)` | `1234` | `1.234` |
| Decimais customizados | `formatDecimal(3.14159, 3)` | `3.14159, 3` | `3,142` |

**Exemplo de uso:**

```typescript
import { formatInteger, formatDecimal } from '@/lib/formatters';

// Para contadores
<span>{formatInteger(employees.length)}</span>
// 42

// Para valores técnicos com precisão
<span>{formatDecimal(averageScore, 2)}</span>
// 87,53
```

---

### Conversão Segura (para cálculos)

| Caso de Uso | Função | Uso |
|-------------|--------|-----|
| Valor com decimais fixos | `toFixedSafe(value, decimals)` | Quando precisa de `toFixed` mas com validação |

**Exemplo de uso:**

```typescript
import { toFixedSafe } from '@/lib/formatters';

// Para cálculos intermediários (NÃO para display)
const calculatedValue = parseFloat(toFixedSafe(salary * 0.15, 2));

// ❌ EVITE para display direto, use formatCurrency
// ✅ Use apenas para cálculos que precisam de string numérica
```

---

## ❌ Exemplos de Código Proibido

```typescript
// ❌ NUNCA FAÇA ISSO
const display1 = value.toLocaleString('pt-BR', { 
  minimumFractionDigits: 2,
  maximumFractionDigits: 2 
});

// ❌ NUNCA FAÇA ISSO
const display2 = value.toFixed(2);

// ❌ NUNCA FAÇA ISSO
const formatter = new Intl.NumberFormat('pt-BR', { 
  style: 'currency', 
  currency: 'BRL' 
});
const display3 = formatter.format(value);
```

**Por quê?**
- `toLocaleString` pode gerar `RangeError` se `minimumFractionDigits > maximumFractionDigits`
- `toFixed` não lida com `null`, `undefined`, `NaN` ou `Infinity` de forma segura
- Criar formatadores inline polui o código e dificulta manutenção

---

## ✅ Padrão Correto

```typescript
// ✅ SEMPRE FAÇA ISSO
import { 
  formatCurrency, 
  formatPercentage, 
  formatInteger 
} from '@/lib/formatters';

const SalaryCard = ({ employee }) => {
  return (
    <div>
      <p>Salário: {formatCurrency(employee.salary)}</p>
      <p>Funcionários: {formatInteger(employee.teamSize)}</p>
      <p>Crescimento: {formatPercentage(employee.growth)}</p>
    </div>
  );
};
```

---

## 🛡️ Tratamento de Valores Inválidos

Todas as funções do formatters tratam automaticamente:

```typescript
formatCurrency(null)        // → 'R$ 0,00'
formatCurrency(undefined)   // → 'R$ 0,00'
formatCurrency(NaN)         // → 'R$ 0,00'
formatCurrency(Infinity)    // → 'R$ 0,00'

formatDecimal(value, -5)    // → Ajusta para 0 decimais (mínimo)
formatDecimal(value, 100)   // → Ajusta para 20 decimais (máximo)
```

**Você NÃO precisa validar antes de chamar as funções.**

---

## 📦 Formatador Universal

Para casos avançados com múltiplas opções:

```typescript
import { formatCurrencyWithOptions } from '@/lib/formatters';

// Exemplo: valor em USD, compacto, sem símbolo
const display = formatCurrencyWithOptions(1500000, {
  currency: 'USD',
  compact: true,
  includeSymbol: false,
});
// Resultado: "1.5M"

// Exemplo: BRL com 0 decimais
const display2 = formatCurrencyWithOptions(1234.56, {
  currency: 'BRL',
  decimals: 0,
});
// Resultado: "R$ 1.235"
```

---

## 🔄 Checklist de Migração

Ao atualizar um componente existente:

- [ ] Importar funções de `@/lib/formatters`
- [ ] Substituir todos `toLocaleString` diretos
- [ ] Substituir todos `toFixed` de display por funções seguras
- [ ] Remover formatadores inline (`new Intl.NumberFormat`)
- [ ] Testar com valores `null`, `undefined`, `NaN`
- [ ] Adicionar comentário de migração no topo do arquivo

---

## 📝 Comentário de Migração

Adicione no topo de arquivos migrados:

```typescript
/**
 * ✅ MIGRADO: Formatação centralizada implementada
 * Data: 2025-01-20
 * Ticket: COMP-XXX (se aplicável)
 * 
 * Todas as formatações monetárias agora usam @/lib/formatters
 * para prevenir RangeError e garantir consistência.
 */
```

---

## 🎓 Exemplos Práticos

### Dashboard KPI

```typescript
import { formatCurrency, formatInteger, formatPercentage } from '@/lib/formatters';

const KPICard = ({ totalSalary, employeeCount, growth }) => (
  <Card>
    <h3>Salário Total</h3>
    <p className="text-3xl">{formatCurrency(totalSalary)}</p>
    <p className="text-sm">
      {formatInteger(employeeCount)} funcionários • 
      Crescimento: {formatPercentage(growth)}
    </p>
  </Card>
);
```

### Tabela com Valores

```typescript
import { formatCurrency, formatPercentageSafe } from '@/lib/formatters';

const SalaryTable = ({ employees }) => (
  <table>
    {employees.map(emp => (
      <tr key={emp.id}>
        <td>{emp.name}</td>
        <td>{formatCurrency(emp.salary)}</td>
        <td>{formatPercentageSafe(emp.salaryIncrease, 1, true)}</td>
      </tr>
    ))}
  </table>
);
```

### Gráficos (Recharts)

```typescript
import { formatCurrency, formatDecimal } from '@/lib/formatters';

<YAxis 
  tickFormatter={(value) => `R$ ${formatDecimal(value / 1000, 0)}k`}
/>
<Tooltip 
  formatter={(value) => formatCurrency(value)}
/>
```

---

## 🚨 Casos Especiais

### Cálculos Intermediários

```typescript
// Para cálculos, use Number diretamente
const bonus = salary * 0.15; // ✅ Correto

// Para exibir, use formatCurrency
<span>{formatCurrency(bonus)}</span>
```

### Inputs de Formulário

```typescript
// Usar toFixedSafe apenas para preencher inputs
<Input 
  type="number"
  value={toFixedSafe(formData.salary, 2)}
  onChange={(e) => setFormData({ 
    ...formData, 
    salary: parseFloat(e.target.value) || 0 
  })}
/>
```

---

## 📞 Dúvidas?

- **Nova formatação necessária?** Adicione em `src/lib/formatters.ts` seguindo o padrão
- **Bug em formatação?** Verifique se está usando função do formatters
- **Performance?** Funções são otimizadas, use sem medo

---

**Última atualização:** 2025-01-20  
**Mantenedor:** Time de Engenharia CompSmart
