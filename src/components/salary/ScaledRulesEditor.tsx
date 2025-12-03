import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { ScaledRule } from "@/hooks/useCollectiveAdjustments";

interface ScaledRulesEditorProps {
  rules: ScaledRule[];
  onChange: (rules: ScaledRule[]) => void;
}

export function ScaledRulesEditor({ rules, onChange }: ScaledRulesEditorProps) {
  const addRule = () => {
    const newRule: ScaledRule = {
      max_salary: null,
      percentage: 0,
      fixed_amount: 0,
    };
    onChange([...rules, newRule]);
  };

  const updateRule = (index: number, field: keyof ScaledRule, value: number | null) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    onChange(newRules);
  };

  const removeRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Faixas Salariais</Label>
        <Button type="button" variant="outline" size="sm" onClick={addRule}>
          <Plus className="w-4 h-4 mr-1" />
          Adicionar Faixa
        </Button>
      </div>

      {rules.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhuma faixa definida. Clique em "Adicionar Faixa" para começar.
        </p>
      )}

      <div className="space-y-3">
        {rules.map((rule, index) => (
          <div
            key={index}
            className="p-4 border rounded-lg bg-muted/30 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Faixa {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => removeRule(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">
                  {index === rules.length - 1 ? "Acima de (deixe vazio para 'até')" : "Salário Até"}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    R$
                  </span>
                  <Input
                    type="number"
                    value={rule.max_salary ?? ''}
                    onChange={(e) => updateRule(
                      index, 
                      'max_salary', 
                      e.target.value ? Number(e.target.value) : null
                    )}
                    placeholder={index === rules.length - 1 ? "Sem limite" : "0"}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Percentual (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    value={rule.percentage}
                    onChange={(e) => updateRule(index, 'percentage', Number(e.target.value))}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    %
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Valor Fixo Adicional</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    R$
                  </span>
                  <Input
                    type="number"
                    value={rule.fixed_amount}
                    onChange={(e) => updateRule(index, 'fixed_amount', Number(e.target.value))}
                    placeholder="0"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {rule.max_salary 
                ? `Salários até R$ ${rule.max_salary.toLocaleString('pt-BR')}: ${rule.percentage}%`
                : `Salários acima: ${rule.percentage}%`}
              {rule.fixed_amount > 0 && ` + R$ ${rule.fixed_amount.toLocaleString('pt-BR')}`}
            </p>
          </div>
        ))}
      </div>

      {rules.length > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Exemplo de cálculo:</strong> Para um funcionário com salário R$ 4.500, 
            aplicando a faixa "até R$ 5.000 → 5% + R$ 210":
            <br />
            Aumento = R$ 4.500 × 5% + R$ 210 = R$ 225 + R$ 210 = <strong>R$ 435</strong>
            <br />
            Novo salário = R$ 4.500 + R$ 435 = <strong>R$ 4.935</strong>
          </p>
        </div>
      )}
    </div>
  );
}
