/**
 * Utilitário simples para exportar arrays de objetos como CSV (UTF-8 com BOM,
 * compatível com Excel pt-BR).
 */

const escapeCell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Sempre envolver em aspas e escapar aspas internas
  return `"${str.replace(/"/g, '""')}"`;
};

export interface CSVColumn<T> {
  header: string;
  accessor: (row: T) => unknown;
}

export function exportToCSV<T>(
  filename: string,
  columns: CSVColumn<T>[],
  rows: T[],
  separator: ';' | ',' = ';',
  preamble: string[] = []
): void {
  const headerLine = columns.map((c) => escapeCell(c.header)).join(separator);
  const dataLines = rows.map((row) =>
    columns.map((c) => escapeCell(c.accessor(row))).join(separator)
  );
  const preLines = preamble.length ? [...preamble.map(escapeCell), ''] : [];

  const csv = [...preLines, headerLine, ...dataLines].join('\r\n');
  // BOM para Excel reconhecer UTF-8 corretamente
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
