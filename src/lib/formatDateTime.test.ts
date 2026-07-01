import { describe, it, expect } from "vitest";
import { formatDateTimePtBR } from "./formatDateTime";

describe("formatDateTimePtBR", () => {
  it("formats an epoch value in pt-BR with America/Sao_Paulo timezone", () => {
    // 2026-01-15T15:34:00Z → 12:34 in America/Sao_Paulo (UTC-3, no DST since 2019).
    const epoch = Date.parse("2026-01-15T15:34:00Z");
    expect(formatDateTimePtBR(epoch)).toBe("15/01/2026 12:34");
  });

  it("is stable regardless of the input type", () => {
    const iso = "2026-06-01T13:00:00Z";
    const fromString = formatDateTimePtBR(iso);
    const fromDate = formatDateTimePtBR(new Date(iso));
    const fromEpoch = formatDateTimePtBR(Date.parse(iso));
    expect(fromString).toBe(fromDate);
    expect(fromDate).toBe(fromEpoch);
  });

  it("returns an empty string for nullish or invalid values", () => {
    expect(formatDateTimePtBR(null)).toBe("");
    expect(formatDateTimePtBR(undefined)).toBe("");
    expect(formatDateTimePtBR("not-a-date")).toBe("");
  });
});
