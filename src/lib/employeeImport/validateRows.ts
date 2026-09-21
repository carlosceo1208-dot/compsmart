import {
  IMPORT_FIELDS,
  IMPORT_FIELD_MAP,
  type ColumnMapping,
} from './fieldCatalog';
import {
  isValidCPF,
  isValidEmail,
  onlyDigits,
  parseBooleanValue,
  parseDateValue,
  parseNumberValue,
} from './normalize';

export interface ImportLookups {
  /** código ou nome normalizado -> { id, title, grade } */
  jobTitles: { id: string; title: string; code: string | null; grade: string | null }[];
  units: { id: string; code: string | null; name: string | null }[];
  managers: { id: string; email: string | null }[];
  existingEmployeeNumbers: Set<string>;
  existingCpfs: Set<string>;
}

export interface RowIssue {
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidatedRow {
  rowNumber: number;
  raw: Record<string, string>;
  /** Valores normalizados prontos para gravação (apenas campos mapeados) */
  fields: Record<string, string | null>;
  issues: RowIssue[];
  valid: boolean;
  existsInPlatform: boolean;
}

export interface ValidationSummary {
  rows: ValidatedRow[];
  total: number;
  validCount: number;
  errorCount: number;
  newCount: number;
  existingCount: number;
  warningCount: number;
}

const norm = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const validateRows = (
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  lookups: ImportLookups,
): ValidationSummary => {
  const mappedFields = IMPORT_FIELDS.filter((field) => mapping[field.key]);
  const seenNumbers = new Map<string, number>();
  const seenCpfs = new Map<string, number>();

  const result: ValidatedRow[] = rows.map((raw, index) => {
    const rowNumber = index + 1;
    const issues: RowIssue[] = [];
    const fields: Record<string, string | null> = {};

    mappedFields.forEach((field) => {
      const column = mapping[field.key] as string;
      const rawValue = (raw[column] ?? '').trim();
      if (rawValue === '') return;

      switch (field.type) {
        case 'cpf': {
          if (!isValidCPF(rawValue)) {
            issues.push({ field: field.key, message: `CPF inválido: "${rawValue}"`, severity: 'error' });
            return;
          }
          fields.cpf = onlyDigits(rawValue);
          return;
        }
        case 'email': {
          if (!isValidEmail(rawValue)) {
            issues.push({ field: field.key, message: `E-mail inválido: "${rawValue}"`, severity: 'error' });
            return;
          }
          fields.email = rawValue.toLowerCase();
          return;
        }
        case 'date': {
          const parsed = parseDateValue(rawValue);
          if (!parsed) {
            issues.push({
              field: field.key,
              message: `${field.label} com data inválida: "${rawValue}"`,
              severity: 'error',
            });
            return;
          }
          fields[field.key] = parsed;
          return;
        }
        case 'number': {
          const parsed = parseNumberValue(rawValue);
          if (parsed === null) {
            issues.push({
              field: field.key,
              message: `${field.label} com valor não numérico: "${rawValue}"`,
              severity: 'error',
            });
            return;
          }
          fields[field.key] = String(parsed);
          return;
        }
        case 'boolean': {
          const parsed = parseBooleanValue(rawValue);
          if (parsed === null) {
            issues.push({
              field: field.key,
              message: `${field.label} deve ser Sim ou Não: "${rawValue}"`,
              severity: 'warning',
            });
            return;
          }
          fields[field.key] = parsed ? 'true' : 'false';
          return;
        }
        case 'job': {
          const value = norm(rawValue);
          const match =
            lookups.jobTitles.find((job) => job.code && norm(job.code) === value) ??
            lookups.jobTitles.find((job) => norm(job.title) === value) ??
            lookups.jobTitles.find((job) => norm(job.title).includes(value));
          if (!match) {
            issues.push({
              field: field.key,
              message: `Cargo "${rawValue}" não encontrado — o colaborador será importado sem cargo.`,
              severity: 'warning',
            });
            return;
          }
          fields.job_title_id = match.id;
          fields.job_title = match.title;
          if (match.grade) fields.grade = match.grade;
          return;
        }
        case 'unit': {
          const value = norm(rawValue);
          const match =
            lookups.units.find((unit) => unit.code && norm(unit.code) === value) ??
            lookups.units.find((unit) => unit.name && norm(unit.name) === value);
          if (!match) {
            issues.push({
              field: field.key,
              message: `Unidade "${rawValue}" não encontrada — o colaborador será importado sem unidade.`,
              severity: 'warning',
            });
            return;
          }
          fields.unit_id = match.id;
          return;
        }
        case 'manager': {
          const value = norm(rawValue);
          const match = lookups.managers.find((m) => m.email && norm(m.email) === value);
          if (!match) {
            issues.push({
              field: field.key,
              message: `Gestor "${rawValue}" não encontrado — o colaborador será importado sem gestor.`,
              severity: 'warning',
            });
            return;
          }
          fields.manager_id = match.id;
          return;
        }
        default:
          fields[field.key] = rawValue;
      }
    });

    // Obrigatórios
    if (!fields.full_name) {
      issues.push({ field: 'full_name', message: 'Nome completo é obrigatório.', severity: 'error' });
    }
    if (!fields.employee_number && !fields.cpf) {
      issues.push({
        message: 'Informe ao menos matrícula ou CPF para identificar o colaborador.',
        severity: 'error',
      });
    }

    // Duplicados dentro do arquivo
    if (fields.employee_number) {
      const first = seenNumbers.get(fields.employee_number);
      if (first) {
        issues.push({
          field: 'employee_number',
          message: `Matrícula duplicada no arquivo (já usada na linha ${first}).`,
          severity: 'error',
        });
      } else {
        seenNumbers.set(fields.employee_number, rowNumber);
      }
    }
    if (fields.cpf) {
      const first = seenCpfs.get(fields.cpf);
      if (first) {
        issues.push({
          field: 'cpf',
          message: `CPF duplicado no arquivo (já usado na linha ${first}).`,
          severity: 'error',
        });
      } else {
        seenCpfs.set(fields.cpf, rowNumber);
      }
    }

    const existsInPlatform =
      (!!fields.employee_number && lookups.existingEmployeeNumbers.has(fields.employee_number)) ||
      (!!fields.cpf && lookups.existingCpfs.has(fields.cpf));

    const valid = !issues.some((issue) => issue.severity === 'error');

    return { rowNumber, raw, fields, issues, valid, existsInPlatform };
  });

  return {
    rows: result,
    total: result.length,
    validCount: result.filter((r) => r.valid).length,
    errorCount: result.filter((r) => !r.valid).length,
    newCount: result.filter((r) => r.valid && !r.existsInPlatform).length,
    existingCount: result.filter((r) => r.valid && r.existsInPlatform).length,
    warningCount: result.filter((r) => r.issues.some((i) => i.severity === 'warning')).length,
  };
};

export const fieldLabel = (key: string): string => IMPORT_FIELD_MAP.get(key)?.label ?? key;
