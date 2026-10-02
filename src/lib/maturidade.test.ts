import { describe, it, expect } from "vitest";
import { nivelDoScore, montarScorecard, rotuloNivelEstrutural, TEASER, DIMENSOES } from "./maturidade";

describe("nivelDoScore", () => {
  it("limite superior fica no nível de baixo", () => {
    expect(nivelDoScore(1)).toBe("Reativo");
    expect(nivelDoScore(1.8)).toBe("Reativo");
    expect(nivelDoScore(1.81)).toBe("Estruturado");
    expect(nivelDoScore(2.6)).toBe("Estruturado");
    expect(nivelDoScore(3.4)).toBe("Alinhado");
    expect(nivelDoScore(4.2)).toBe("Parceiro");
    expect(nivelDoScore(4.21)).toBe("Transformacional");
    expect(nivelDoScore(5)).toBe("Transformacional");
  });
  it("apresenta todas as faixas com o novo rótulo estrutural", () => {
    expect([1, 2, 3, 4, 5].map((score) => rotuloNivelEstrutural(nivelDoScore(score)))).toEqual([
      "Reativo", "Operacional", "Tático", "Estratégico", "Transformador",
    ]);
  });
});

describe("montarScorecard", () => {
  it("calcula médias, gap, global e destaques só com médias de grupo", () => {
    const linhas = DIMENSOES.flatMap((d) => [
      { dimensao: d.n, grupo: "rh" as const, media: 3 },
      { dimensao: d.n, grupo: "gestor" as const, media: d.n === 5 ? 1 : 4 },
    ]);
    const s = montarScorecard(linhas);
    const d5 = s.dims.find((d) => d.n === 5)!;
    expect(d5.geral).toBe(2);
    expect(d5.gap).toBe(-2);
    expect(d5.nivel).toBe("Estruturado");
    expect(s.maisCritica?.n).toBe(5);
    expect(s.global).toBeCloseTo((11 * 3.5 + 2) / 12, 6);
  });
  it("dimensão sem dados de um grupo não vira zero", () => {
    const s = montarScorecard([{ dimensao: 1, grupo: "rh", media: 4 }]);
    expect(s.dims[0].gestores).toBeNull();
    expect(s.dims[0].gap).toBeNull();
    expect(s.dims[1].geral).toBeNull();
    expect(s.global).toBe(4);
  });
  it("teaser tem as 10 afirmações previstas", () => {
    expect(TEASER.map((t) => t.numero)).toEqual([1, 9, 10, 13, 17, 25, 30, 33, 37, 41]);
  });
});
