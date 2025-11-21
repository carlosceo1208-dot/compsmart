import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export interface EligibilityRule {
  id?: string;
  grade_min?: string;
  grade_max?: string;
  salary_min?: number;
  salary_max?: number;
  company_contribution_value: number;
  employee_contribution_type: 'none' | 'fixed' | 'percentage';
  employee_contribution_value: number;
  description?: string;
}

interface BenefitEligibilityManagerProps {
  eligibilityType: 'grade' | 'salary_range';
  rules: EligibilityRule[];
  onChange: (rules: EligibilityRule[]) => void;
}

export const BenefitEligibilityManager = ({
  eligibilityType,
  rules,
  onChange,
}: BenefitEligibilityManagerProps) => {
  const addNewRule = () => {
    const newRule: EligibilityRule = {
      company_contribution_value: 0,
      employee_contribution_type: 'none',
      employee_contribution_value: 0,
    };
    onChange([...rules, newRule]);
  };

  const updateRule = (index: number, field: string, value: any) => {
    const updatedRules = [...rules];
    updatedRules[index] = { ...updatedRules[index], [field]: value };
    onChange(updatedRules);
  };

  const removeRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  return (
    <Card className="p-4 bg-muted/50">
      <h4 className="font-semibold mb-3">Regras de Elegibilidade</h4>
      
      <div className="space-y-3">
        {rules.map((rule, index) => (
          <Card key={index} className="p-4 bg-background">
            <div className="space-y-3">
              {/* Range de Grade ou Salário */}
              {eligibilityType === 'grade' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Grade Mínima</Label>
                    <Input
                      placeholder="ex: 1, A, Junior"
                      value={rule.grade_min || ''}
                      onChange={(e) => updateRule(index, 'grade_min', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Grade Máxima</Label>
                    <Input
                      placeholder="ex: 5, C, Pleno"
                      value={rule.grade_max || ''}
                      onChange={(e) => updateRule(index, 'grade_max', e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Salário Mínimo (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="1000.00"
                      value={rule.salary_min || ''}
                      onChange={(e) => updateRule(index, 'salary_min', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Salário Máximo (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="3500.00"
                      value={rule.salary_max || ''}
                      onChange={(e) => updateRule(index, 'salary_max', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              )}

              {/* Valor Empresa */}
              <div>
                <Label>Valor Empresa (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={rule.company_contribution_value || ''}
                  onChange={(e) => updateRule(index, 'company_contribution_value', parseFloat(e.target.value) || 0)}
                />
              </div>

              {/* Co-participação */}
              <div>
                <Label>Co-participação Funcionário</Label>
                <RadioGroup
                  value={rule.employee_contribution_type}
                  onValueChange={(value) => updateRule(index, 'employee_contribution_type', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id={`none-${index}`} />
                    <Label htmlFor={`none-${index}`}>Sem co-participação</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id={`fixed-${index}`} />
                    <Label htmlFor={`fixed-${index}`}>Valor fixo (R$)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="percentage" id={`percentage-${index}`} />
                    <Label htmlFor={`percentage-${index}`}>Percentual (%)</Label>
                  </div>
                </RadioGroup>

                {rule.employee_contribution_type !== 'none' && (
                  <Input
                    type="number"
                    step="0.01"
                    className="mt-2"
                    placeholder={rule.employee_contribution_type === 'percentage' ? '30' : '50.00'}
                    value={rule.employee_contribution_value || ''}
                    onChange={(e) => updateRule(index, 'employee_contribution_value', parseFloat(e.target.value) || 0)}
                  />
                )}
              </div>

              {/* Descrição */}
              <div>
                <Label>Descrição (opcional)</Label>
                <Input
                  placeholder="ex: Plano Básico - Grade Inicial"
                  value={rule.description || ''}
                  onChange={(e) => updateRule(index, 'description', e.target.value)}
                />
              </div>

              {/* Preview */}
              {rule.employee_contribution_type !== 'none' && rule.company_contribution_value > 0 && (
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  💡 <strong>Funcionário paga:</strong>{' '}
                  {rule.employee_contribution_type === 'percentage'
                    ? `${rule.employee_contribution_value}% (${formatCurrency(rule.company_contribution_value * (rule.employee_contribution_value / 100))})`
                    : formatCurrency(rule.employee_contribution_value)}
                  {' | '}
                  <strong>Empresa:</strong>{' '}
                  {rule.employee_contribution_type === 'percentage'
                    ? formatCurrency(rule.company_contribution_value * (1 - rule.employee_contribution_value / 100))
                    : formatCurrency(rule.company_contribution_value - rule.employee_contribution_value)}
                </div>
              )}

              {/* Botão Remover */}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeRule(index)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover Regra
              </Button>
            </div>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addNewRule}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Nova Regra
        </Button>
      </div>
    </Card>
  );
};
