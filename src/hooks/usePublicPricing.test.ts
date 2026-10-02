import { describe, expect, it } from "vitest";
import {
  additionalModulePrice,
  perEmployeePrice,
  simulateMonthlyTotal,
  type PublicPricing,
} from "./usePublicPricing";

// Fixture própria: valida a regra, não o cadastro de produção.
const pricing: PublicPricing = {
  moeda: "BRL",
  preco_base_colaborador: 5,
  desconto_modulo_adicional_pct: 50,
  desconto_semestral_pct: 5,
  desconto_anual_pct: 10,
  faixas: [],
  modulos: [],
};

describe("preço público por colaborador", () => {
  it("módulo adicional custa 50% da base", () => {
    expect(additionalModulePrice(pricing)).toBe(2.5);
  });
  it("1 módulo × 100 colaboradores = R$ 500", () => {
    expect(simulateMonthlyTotal(pricing, 1, 100, "mensal").total).toBe(500);
  });
  it("3 módulos × 100 colaboradores = R$ 1.000", () => {
    expect(perEmployeePrice(pricing, 3)).toBe(10);
    expect(simulateMonthlyTotal(pricing, 3, 100, "mensal").total).toBe(1000);
  });
  it("4 módulos × 100 colaboradores = R$ 1.250", () => {
    expect(simulateMonthlyTotal(pricing, 4, 100, "mensal").total).toBe(1250);
  });
});
