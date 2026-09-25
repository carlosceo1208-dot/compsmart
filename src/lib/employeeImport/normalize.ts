/** Normalizações e validações de valores vindos de planilhas de folha */

export const onlyDigits = (value: string): string => value.replace(/\D/g, '');

export const isValidCPF = (value: string): boolean => {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i], 10) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (check !== parseInt(cpf[9], 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i], 10) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  return check === parseInt(cpf[10], 10);
};

const formatCPF = (value: string): string => {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11) return value;
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
};

/** Aceita DD/MM/AAAA, AAAA-MM-DD e número serial do Excel. Retorna AAAA-MM-DD. */
export const parseDateValue = (value: string): string | null => {
  const raw = value.trim();
  if (!raw) return null;

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const br = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (br) {
    const day = br[1].padStart(2, '0');
    const month = br[2].padStart(2, '0');
    let year = br[3];
    if (year.length === 2) year = Number(year) > 40 ? `19${year}` : `20${year}`;
    const candidate = `${year}-${month}-${day}`;
    return isRealDate(candidate) ? candidate : null;
  }

  if (/^\d{5,6}$/.test(raw)) {
    const serial = Number(raw);
    const millis = (serial - 25569) * 86400 * 1000;
    const date = new Date(millis);
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }

  return null;
};

const isRealDate = (isoDate: string): boolean => {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

/** Aceita "4.500,00", "4500.00", "R$ 4.500,00", "1 234,56" */
export const parseNumberValue = (value: string): number | null => {
  const raw = value.replace(/\s|R\$|\u00a0/gi, '').trim();
  if (!raw) return null;
  const negative = /^\(.*\)$/.test(raw) || raw.startsWith('-');
  let body = raw.replace(/[()\-+]/g, '');
  const lastComma = body.lastIndexOf(',');
  const lastDot = body.lastIndexOf('.');
  if (lastComma > lastDot) {
    body = body.replace(/\./g, '').replace(',', '.');
  } else {
    body = body.replace(/,/g, '');
  }
  body = body.replace(/[^\d.]/g, '');
  if (!body) return null;
  const parsed = Number(body);
  if (Number.isNaN(parsed)) return null;
  return negative ? -parsed : parsed;
};

export const parseBooleanValue = (value: string): boolean | null => {
  const raw = value.trim().toLowerCase();
  if (!raw) return null;
  if (['sim', 's', 'true', 'verdadeiro', '1', 'x', 'yes'].includes(raw)) return true;
  if (['nao', 'não', 'n', 'false', 'falso', '0', 'no'].includes(raw)) return false;
  return null;
};

export const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
