import { describe, it, expect } from "vitest";
import { lerSugestaoFaixa } from "./faixaContrato";

describe("contrato da sugestão de faixa", () => {
  it("aceita exatamente 3 chaves", () => {
    const r = { min: 10500, max: 13500, fonte: "pesquisa de mercado" };
    expect(Object.keys(r).length).toBe(3);
    expect(lerSugestaoFaixa(r)).toEqual(r);
  });
  it("sem similar: 3 chaves nulas viram null (sem erro)", () => {
    expect(lerSugestaoFaixa({ min: null, max: null, fonte: null })).toBeNull();
  });
  it("rejeita chave extra (mediana/contagem)", () => {
    expect(() => lerSugestaoFaixa({ min: 1, max: 2, fonte: "tabela salarial", mediana: 1.5 })).toThrow();
  });
  it("rejeita fonte com nome de pesquisa", () => {
    expect(() => lerSugestaoFaixa({ min: 1, max: 2, fonte: "Pesquisa XPTO 2026" })).toThrow();
  });
});
