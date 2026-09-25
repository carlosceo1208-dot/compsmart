// =============================================
// Salary Modality Helper Functions & Types
// =============================================

export type SalaryModality = 'fixed_salary' | 'total_cash' | 'total_compensation';

export interface ModalityConfig {
  value: SalaryModality;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const MODALITY_CONFIG: Record<SalaryModality, ModalityConfig> = {
  fixed_salary: {
    value: 'fixed_salary',
    label: 'Salário Fixo',
    shortLabel: 'Fixo',
    description: 'Remuneração fixa mensal',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    borderColor: 'border-blue-500',
  },
  total_cash: {
    value: 'total_cash',
    label: 'Total Cash',
    shortLabel: 'T.Cash',
    description: 'Salário Fixo + Variável (Bônus, PLR, Comissões)',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900',
    borderColor: 'border-emerald-500',
  },
  total_compensation: {
    value: 'total_compensation',
    label: 'Total Compensation',
    shortLabel: 'T.Comp',
    description: 'Total Cash + Benefícios + Incentivos de Longo Prazo',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    borderColor: 'border-purple-500',
  },
};

export const MODALITY_OPTIONS: ModalityConfig[] = Object.values(MODALITY_CONFIG);

export const getModalityConfig = (modality: SalaryModality): ModalityConfig => {
  return MODALITY_CONFIG[modality] || MODALITY_CONFIG.fixed_salary;
};
