import * as XLSX from 'xlsx';

export interface ParsedSheet {
  sheetNames: string[];
  sheetName: string;
  headers: string[];
  /** Linhas com as células já convertidas em texto, indexadas pelo cabeçalho */
  rows: Record<string, string>[];
}

const cellToString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    const iso = new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString();
    return iso.slice(0, 10);
  }
  return String(value).trim();
};

const readWorkbook = async (file: File): Promise<XLSX.WorkBook> => {
  const buffer = await file.arrayBuffer();
  return XLSX.read(buffer, { type: 'array', cellDates: true, raw: false });
};

export const listSheets = async (file: File): Promise<string[]> => {
  const wb = await readWorkbook(file);
  return wb.SheetNames;
};

/** Lê um arquivo .xlsx/.xls/.csv e devolve cabeçalhos + linhas como texto */
export const parseSpreadsheet = async (file: File, sheetName?: string): Promise<ParsedSheet> => {
  const wb = await readWorkbook(file);
  const activeSheet = sheetName && wb.SheetNames.includes(sheetName) ? sheetName : wb.SheetNames[0];
  if (!activeSheet) throw new Error('A planilha não possui nenhuma aba com dados.');

  const sheet = wb.Sheets[activeSheet];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: '' });

  // Encontra a primeira linha com pelo menos 2 células preenchidas: é o cabeçalho
  const headerIndex = matrix.findIndex(
    (row) => row.filter((cell) => cellToString(cell) !== '').length >= 2,
  );
  if (headerIndex === -1) throw new Error('Não foi possível identificar o cabeçalho da planilha.');

  const rawHeaders = matrix[headerIndex].map((cell, i) => cellToString(cell) || `Coluna ${i + 1}`);
  const headers: string[] = [];
  const seen = new Map<string, number>();
  rawHeaders.forEach((header) => {
    const count = seen.get(header) ?? 0;
    seen.set(header, count + 1);
    headers.push(count === 0 ? header : `${header} (${count + 1})`);
  });

  const rows: Record<string, string>[] = [];
  for (let i = headerIndex + 1; i < matrix.length; i++) {
    const row = matrix[i];
    const record: Record<string, string> = {};
    let hasValue = false;
    headers.forEach((header, col) => {
      const value = cellToString(row[col]);
      record[header] = value;
      if (value !== '') hasValue = true;
    });
    if (hasValue) rows.push(record);
  }

  return { sheetNames: wb.SheetNames, sheetName: activeSheet, headers, rows };
};

/** Converte texto colado (TAB, ; ou ,) no mesmo formato de ParsedSheet */
export const parsePastedText = (text: string): ParsedSheet => {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) throw new Error('Nenhum dado fornecido.');

  const first = lines[0];
  const tabs = (first.match(/\t/g) || []).length;
  const semis = (first.match(/;/g) || []).length;
  const commas = (first.match(/,/g) || []).length;
  const separator = tabs >= semis && tabs >= commas ? '\t' : semis >= commas ? ';' : ',';

  const headers = lines[0].split(separator).map((h, i) => h.trim() || `Coluna ${i + 1}`);
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(separator);
    const record: Record<string, string> = {};
    headers.forEach((header, i) => {
      record[header] = (cells[i] ?? '').trim();
    });
    return record;
  });

  return { sheetNames: ['Colado'], sheetName: 'Colado', headers, rows };
};
