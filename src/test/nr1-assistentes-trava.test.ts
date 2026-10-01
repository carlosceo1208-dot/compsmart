import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// A5: os três assistentes do NR-1 recusam empresa sem NR-1 (403) e não leem dados de cruzamento.
const AGENTES = ['nr1-bem-estar-agent', 'nr1-jornada-agent', 'nr1-plano-acao-assistant'];
const ler = (n: string) => readFileSync(join(process.cwd(), 'supabase/functions', n, 'index.ts'), 'utf8');

describe('assistentes do NR-1 — trava por módulo (A5)', () => {
  for (const nome of AGENTES) {
    it(`${nome} confere has_module('nr1') e responde 403`, () => {
      const src = ler(nome);
      expect(src).toMatch(/rpc\(\s*["']has_module["']\s*,\s*\{\s*_slug:\s*["']nr1["']/);
      expect(src).toMatch(/status:\s*403/);
    });
    it(`${nome} não lê 9Box, salário nem Clima`, () => {
      const src = ler(nome);
      for (const proibido of [/from\(["']performance_evaluations["']\)/, /from\(["']matriz_9box["']\)/, /\.select\([^)]*salary/, /from\(["']clima_[a-z_]+["']\)/, /nr1_inteligencia_unidades/, /nr1_clima_correlacao/]) {
        expect(src).not.toMatch(proibido);
      }
    });
  }
});
