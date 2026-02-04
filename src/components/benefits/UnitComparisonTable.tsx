import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, TrendingUp, TrendingDown, Download } from 'lucide-react';
import { UnitBenefitsHistory } from '@/hooks/useBenefitsHistoryByUnit';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/formatters';
import ExcelJS from 'exceljs';

interface UnitComparisonTableProps {
  unitsData: UnitBenefitsHistory[];
}

type SortField = 'name' | 'employees' | 'totalCost' | 'trend' | 'avgCost' | 'rank';
type SortOrder = 'asc' | 'desc';

export const UnitComparisonTable = ({ unitsData }: UnitComparisonTableProps) => {
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  if (unitsData.length === 0) return null;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      area: 'Área',
      department: 'Depto',
      sector: 'Setor',
      project: 'Projeto',
    };
    return labels[type] || type;
  };

  const sortedData = [...unitsData].sort((a, b) => {
    const lastMonthA = a.history[a.history.length - 1];
    const lastMonthB = b.history[b.history.length - 1];

    let comparison = 0;

    switch (sortField) {
      case 'name':
        comparison = a.unitName.localeCompare(b.unitName);
        break;
      case 'employees':
        comparison = (lastMonthA?.employeesCount || 0) - (lastMonthB?.employeesCount || 0);
        break;
      case 'totalCost':
        comparison = a.summary.avgMonthlyCost - b.summary.avgMonthlyCost;
        break;
      case 'trend':
        comparison = a.summary.trendPercentage - b.summary.trendPercentage;
        break;
      case 'avgCost':
        comparison = (lastMonthA?.avgCostPerEmployee || 0) - (lastMonthB?.avgCostPerEmployee || 0);
        break;
      case 'rank':
        comparison = a.summary.rank - b.summary.rank;
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Comparação de Benefícios');
      
      // Add header row
      worksheet.addRow([
        'Unidade', 'Tipo', 'Código', 'Funcionários', 'Custo Total Médio',
        'Custo Empresa', 'Custo Funcionário', '% Funcionário', 'Variação %',
        'Custo/Funcionário', 'Ranking'
      ]);
      worksheet.getRow(1).font = { bold: true };
      
      // Add data rows
      sortedData.forEach((unit) => {
        const lastMonth = unit.history[unit.history.length - 1];
        worksheet.addRow([
          unit.unitName,
          getTypeLabel(unit.unitType),
          unit.unitCode || '-',
          lastMonth?.employeesCount || 0,
          unit.summary.avgMonthlyCost,
          lastMonth?.companyCost || 0,
          lastMonth?.employeeCost || 0,
          lastMonth?.employeeCostPercentage || 0,
          unit.summary.trendPercentage,
          lastMonth?.avgCostPerEmployee || 0,
          unit.summary.rank,
        ]);
      });
      
      // Set column widths
      worksheet.columns = [
        { width: 30 }, { width: 12 }, { width: 12 }, { width: 15 },
        { width: 18 }, { width: 15 }, { width: 18 }, { width: 15 },
        { width: 12 }, { width: 18 }, { width: 10 }
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'comparacao_beneficios_unidades.xlsx';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Tabela Comparativa</h3>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-2">
                  Unidade
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => handleSort('employees')}>
                <div className="flex items-center justify-center gap-2">
                  Funcs
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort('totalCost')}>
                <div className="flex items-center justify-end gap-2">
                  Custo Médio
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-center">Emp/Func</TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => handleSort('trend')}>
                <div className="flex items-center justify-center gap-2">
                  Variação
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort('avgCost')}>
                <div className="flex items-center justify-end gap-2">
                  Custo/Func
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => handleSort('rank')}>
                <div className="flex items-center justify-center gap-2">
                  Rank
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((unit) => {
              const lastMonth = unit.history[unit.history.length - 1];
              const empPercentage = lastMonth?.employeeCostPercentage || 0;
              const compPercentage = 100 - empPercentage;

              return (
                <TableRow key={unit.unitId} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{unit.unitName}</span>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {getTypeLabel(unit.unitType)}
                        </Badge>
                        {unit.unitCode && (
                          <span className="text-xs text-muted-foreground">
                            {unit.unitCode}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {formatNumber(lastMonth?.employeesCount || 0)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(unit.summary.avgMonthlyCost)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="text-xs">
                      <div>{compPercentage.toFixed(0)}% / {empPercentage.toFixed(0)}%</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {unit.summary.trendPercentage >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className={unit.summary.trendPercentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {unit.summary.trendPercentage >= 0 ? '+' : ''}
                        {formatPercentage(unit.summary.trendPercentage)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(lastMonth?.avgCostPerEmployee || 0)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={unit.summary.rank === 1 ? 'default' : 'outline'}>
                      {unit.summary.rank}º
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
