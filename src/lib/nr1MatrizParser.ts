// Parser robusto de matriz de risco (arquivo ou texto livre)
// Suporta: CSV com aspas, TSV, ponto-e-vírgula, pipe, tabela markdown e largura fixa (2+ espaços)

export type DelimiterKind = 'tab' | 'semicolon' | 'comma' | 'pipe' | 'markdown' | 'fixed-width' | 'none';

export interface DelimiterDetection {
  kind: DelimiterKind;
  char: string; // representação visual (TAB, ;, |, ',', etc.)
  raw: string;  // string usada para split — vazio para markdown/fixed-width
  confidence: number; // 0..1
  consistencyRatio: number; // % linhas com mesmo nº de colunas
  rationale: string;
}

export type ColTipo = 'numero' | 'percentual' | 'data' | 'booleano' | 'texto' | 'vazio';

export interface ColunaMeta {
  index: number;
  nome: string;
  tipo: ColTipo;
  vazios: number;
  unicos: number;
  exemplos: string[];
}

export interface ParseResult {
  headers: string[];
  rows: string[][];
  totalRows: number;
  totalCols: number;
  delimitador: DelimiterDetection;
  colunas: ColunaMeta[];
  warnings: string[];
}

// ------------------ CSV com aspas ------------------
function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else {
      if (ch === '"') q = true;
      else if (ch === delim) { out.push(cur); cur = ''; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out.map(s => s.trim());
}

function splitMarkdown(line: string): string[] {
  return line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(s => s.trim());
}

function splitFixedWidth(line: string): string[] {
  return line.split(/\s{2,}/).map(s => s.trim()).filter(Boolean);
}

// ------------------ Detecção do delimitador ------------------
export function detectarDelimitador(linhas: string[]): DelimiterDetection {
  const amostra = linhas.slice(0, Math.min(linhas.length, 12)).filter(l => l.trim().length > 0);
  if (amostra.length === 0) {
    return { kind: 'none', char: '', raw: '', confidence: 0, consistencyRatio: 0, rationale: 'Sem linhas para analisar.' };
  }

  // Markdown table: 1ª linha começa/termina com `|` e 2ª linha é separador `---`
  const mdHeader = /^\s*\|.+\|\s*$/.test(amostra[0]);
  const mdSep = amostra[1] && /^\s*\|?\s*:?-{3,}.*\|/.test(amostra[1]);
  if (mdHeader && mdSep) {
    return { kind: 'markdown', char: '| md |', raw: '', confidence: 0.95, consistencyRatio: 1, rationale: 'Tabela markdown detectada (| col | col |).' };
  }

  const candidatos: Array<{ kind: DelimiterKind; char: string; raw: string }> = [
    { kind: 'tab', char: 'TAB', raw: '\t' },
    { kind: 'semicolon', char: ';', raw: ';' },
    { kind: 'pipe', char: '|', raw: '|' },
    { kind: 'comma', char: ',', raw: ',' },
  ];

  let best: DelimiterDetection | null = null;

  for (const c of candidatos) {
    const counts = amostra.map(l => splitCsvLine(l, c.raw).length);
    const total = counts[0];
    if (total < 2) continue;
    const consistentes = counts.filter(n => n === total).length;
    const consistencyRatio = consistentes / counts.length;
    // confiança: combina nº de colunas e consistência
    const confidence = Math.min(1, (total - 1) * 0.15) * consistencyRatio;
    if (!best || confidence > best.confidence) {
      best = {
        kind: c.kind, char: c.char, raw: c.raw,
        confidence, consistencyRatio,
        rationale: `Detectado "${c.char}" — ${total} colunas em ${(consistencyRatio * 100).toFixed(0)}% das linhas.`,
      };
    }
  }

  // Largura fixa (2+ espaços) como último recurso
  if (!best || best.confidence < 0.35) {
    const fwCounts = amostra.map(l => splitFixedWidth(l).length);
    const total = fwCounts[0];
    if (total >= 2) {
      const consistentes = fwCounts.filter(n => n === total).length;
      const consistencyRatio = consistentes / fwCounts.length;
      const confidence = Math.min(1, (total - 1) * 0.15) * consistencyRatio * 0.8; // penaliza
      if (confidence > (best?.confidence ?? 0)) {
        best = {
          kind: 'fixed-width', char: '⎵⎵', raw: '',
          confidence, consistencyRatio,
          rationale: `Largura fixa (2+ espaços) — ${total} colunas em ${(consistencyRatio * 100).toFixed(0)}% das linhas.`,
        };
      }
    }
  }

  if (!best) {
    return { kind: 'none', char: '—', raw: '', confidence: 0, consistencyRatio: 0, rationale: 'Nenhum delimitador identificado.' };
  }
  return best;
}

// ------------------ Split por linha ------------------
function splitLinha(linha: string, d: DelimiterDetection): string[] {
  switch (d.kind) {
    case 'markdown': return splitMarkdown(linha);
    case 'fixed-width': return splitFixedWidth(linha);
    case 'tab': case 'comma': case 'semicolon': case 'pipe':
      return splitCsvLine(linha, d.raw);
    default: return [linha];
  }
}

// ------------------ Inferência de tipo ------------------
const REGEX_NUM = /^-?\d{1,3}(\.\d{3})*(,\d+)?$|^-?\d+([.,]\d+)?$/;
const REGEX_PCT = /^-?\d+([.,]\d+)?\s*%$/;
const REGEX_DATA = /^(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}-\d{2}-\d{2})$/;
const REGEX_BOOL = /^(sim|n[aã]o|true|false|yes|no|s|n)$/i;

export function inferirTipo(valores: string[]): ColTipo {
  const naoVazios = valores.filter(v => v !== '' && v != null);
  if (!naoVazios.length) return 'vazio';
  let num = 0, pct = 0, dt = 0, bo = 0;
  for (const v of naoVazios) {
    const s = v.trim();
    if (REGEX_PCT.test(s)) pct++;
    else if (REGEX_NUM.test(s)) num++;
    else if (REGEX_DATA.test(s)) dt++;
    else if (REGEX_BOOL.test(s)) bo++;
  }
  const total = naoVazios.length;
  if (pct / total > 0.6) return 'percentual';
  if (num / total > 0.7) return 'numero';
  if (dt / total > 0.6) return 'data';
  if (bo / total > 0.8) return 'booleano';
  return 'texto';
}

export function tipoLabel(t: ColTipo): string {
  return { numero: 'número', percentual: '%', data: 'data', booleano: 'sim/não', texto: 'texto', vazio: '—' }[t];
}
export function tipoCor(t: ColTipo): string {
  return {
    numero: 'bg-blue-100 text-blue-700 border-blue-300',
    percentual: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    data: 'bg-purple-100 text-purple-700 border-purple-300',
    booleano: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    texto: 'bg-slate-100 text-slate-700 border-slate-300',
    vazio: 'bg-muted text-muted-foreground border-border',
  }[t];
}

// ------------------ Parser principal de texto ------------------
export function parsearTextoMatriz(texto: string): { ok: true; data: ParseResult } | { ok: false; razao: 'vazio' | 'sem_estrutura' | 'erro'; mensagem: string; linhas?: string[] } {
  const t = texto.trim();
  if (!t) return { ok: false, razao: 'vazio', mensagem: 'Cole o conteúdo da matriz.' };

  // Remove linhas separadoras de markdown (---)
  const linhas = t.split(/\r?\n/).map(l => l.replace(/\u00A0/g, ' ')).filter(l => l.trim().length > 0 && !/^\s*\|?\s*:?-{3,}/.test(l));
  if (linhas.length < 2) {
    return { ok: false, razao: 'sem_estrutura', mensagem: 'Texto com menos de 2 linhas — sem estrutura tabular detectável.', linhas };
  }

  const delim = detectarDelimitador(linhas);
  if (delim.kind === 'none' || delim.confidence < 0.25) {
    return { ok: false, razao: 'sem_estrutura', mensagem: 'Não foi possível identificar uma estrutura tabular consistente no texto.', linhas: linhas.slice(0, 20) };
  }

  const headers = splitLinha(linhas[0], delim).map(h => h || '');
  const warnings: string[] = [];
  if (delim.consistencyRatio < 0.85) warnings.push(`Apenas ${(delim.consistencyRatio * 100).toFixed(0)}% das linhas têm o mesmo nº de colunas — revise o conteúdo.`);
  if (headers.some(h => !h)) warnings.push('Há cabeçalhos vazios — serão tratados como "col N".');
  const headersNormalizados = headers.map((h, i) => h.trim() || `col_${i + 1}`);

  const rows: string[][] = linhas.slice(1).map(l => {
    const cells = splitLinha(l, delim);
    while (cells.length < headersNormalizados.length) cells.push('');
    return cells.slice(0, headersNormalizados.length);
  });

  const colunas: ColunaMeta[] = headersNormalizados.map((nome, idx) => {
    const valores = rows.map(r => (r[idx] ?? '').trim());
    const naoVazios = valores.filter(v => v.length > 0);
    return {
      index: idx, nome,
      tipo: inferirTipo(valores),
      vazios: valores.length - naoVazios.length,
      unicos: new Set(naoVazios).size,
      exemplos: Array.from(new Set(naoVazios)).slice(0, 3),
    };
  });

  return {
    ok: true,
    data: {
      headers: headersNormalizados,
      rows,
      totalRows: rows.length,
      totalCols: headersNormalizados.length,
      delimitador: delim,
      colunas,
      warnings,
    },
  };
}

// ------------------ Parser de matriz vinda de XLSX ------------------
export function montarMetaDeMatriz(headers: string[], rows: string[][]): { colunas: ColunaMeta[]; warnings: string[] } {
  const warnings: string[] = [];
  if (headers.some(h => !h)) warnings.push('Algumas colunas estão sem cabeçalho.');
  const colunas: ColunaMeta[] = headers.map((nome, idx) => {
    const valores = rows.map(r => (r[idx] ?? '').trim());
    const naoVazios = valores.filter(v => v.length > 0);
    return {
      index: idx, nome: nome || `col_${idx + 1}`,
      tipo: inferirTipo(valores),
      vazios: valores.length - naoVazios.length,
      unicos: new Set(naoVazios).size,
      exemplos: Array.from(new Set(naoVazios)).slice(0, 3),
    };
  });
  return { colunas, warnings };
}
