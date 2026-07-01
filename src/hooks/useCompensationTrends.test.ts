import { describe, it, expect, beforeEach } from "vitest";
import {
  buildCompensationTrendsCacheKey,
  readCompensationTrendsCache,
  writeCompensationTrendsCache,
  clearCompensationTrendsCache,
  type CompensationTrendsResult,
} from "./useCompensationTrends";

const sample = (fetchedAt = 1_700_000_000_000): CompensationTrendsResult => ({
  trends: [
    {
      title: "t",
      summary: "s",
      source: "src",
      category: "salários",
    },
  ],
  isFallback: false,
  fetchedAt,
});

describe("compensation-trends cache keying", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("scopes the cache key by companyId", () => {
    const a = buildCompensationTrendsCacheKey({ companyId: "company-a" });
    const b = buildCompensationTrendsCacheKey({ companyId: "company-b" });
    expect(a).not.toBe(b);
    expect(a).toContain("company-a");
    expect(b).toContain("company-b");
  });

  it("scopes the cache key by query params", () => {
    const base = buildCompensationTrendsCacheKey({ companyId: "c1" });
    const filtered = buildCompensationTrendsCacheKey({
      companyId: "c1",
      params: { category: "salários" },
    });
    const otherFilter = buildCompensationTrendsCacheKey({
      companyId: "c1",
      params: { category: "benefícios" },
    });
    expect(base).not.toBe(filtered);
    expect(filtered).not.toBe(otherFilter);
  });

  it("produces a stable key regardless of param ordering", () => {
    const k1 = buildCompensationTrendsCacheKey({
      companyId: "c1",
      params: { a: 1, b: 2 },
    });
    const k2 = buildCompensationTrendsCacheKey({
      companyId: "c1",
      params: { b: 2, a: 1 },
    });
    expect(k1).toBe(k2);
  });

  it("isolates cached payloads across companies", () => {
    const keyA = buildCompensationTrendsCacheKey({ companyId: "c1" });
    const keyB = buildCompensationTrendsCacheKey({ companyId: "c2" });
    writeCompensationTrendsCache(keyA, sample(111));
    writeCompensationTrendsCache(keyB, sample(222));

    expect(readCompensationTrendsCache(keyA)?.fetchedAt).toBe(111);
    expect(readCompensationTrendsCache(keyB)?.fetchedAt).toBe(222);
  });

  it("clearCompensationTrendsCache removes the entry so manual refresh cannot fall back to stale data", () => {
    const key = buildCompensationTrendsCacheKey({ companyId: "c1" });
    writeCompensationTrendsCache(key, sample());
    expect(readCompensationTrendsCache(key)).not.toBeNull();
    clearCompensationTrendsCache(key);
    expect(readCompensationTrendsCache(key)).toBeNull();
  });

  it("preserves the fetchedAt value used by the fallback banner", () => {
    const key = buildCompensationTrendsCacheKey({ companyId: "c1" });
    const fetchedAt = Date.parse("2026-01-15T12:34:00Z");
    writeCompensationTrendsCache(key, sample(fetchedAt));
    expect(readCompensationTrendsCache(key)?.fetchedAt).toBe(fetchedAt);
  });
});
