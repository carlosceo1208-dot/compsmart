import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface BudgetPlanningFilterPanelProps {
  fiscalYear: number;
  onFiscalYearChange: (year: number) => void;
}

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

export const BudgetPlanningFilterPanel = ({
  fiscalYear,
  onFiscalYearChange,
}: BudgetPlanningFilterPanelProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ano Fiscal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label>Selecione o Ano</Label>
          <Select
            value={fiscalYear.toString()}
            onValueChange={(value) => onFiscalYearChange(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
