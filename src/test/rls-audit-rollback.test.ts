/**
 * RLS Audit Rollback Self-Test
 * ----------------------------
 * Verifies that when an INSERT probe inside `audit_rls_tenant_isolation()`
 * triggers a real, mid-statement failure, NO mutation is persisted.
 *
 * Strategy: the SQL function `test_audit_rollback_on_insert_failure()`
 *   1. creates a temporary RLS-enabled table `_rls_audit_selftest`
 *   2. seeds N baseline rows
 *   3. attaches a BEFORE INSERT trigger that always RAISES
 *   4. invokes the audit (which will hit the trigger)
 *   5. snapshots row counts before & after and reports PASS/FAIL
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY; self-skips otherwise.
 */
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

declare const process: { env: Record<string, string | undefined> };

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://fpkjkqdfufhhicxkyqdw.supabase.co";

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

type SelfTestRow = {
  scenario: string;
  status: "PASS" | "FAIL" | "SKIP";
  details: string;
};

const describeIfServiceRole = SERVICE_ROLE_KEY ? describe : describe.skip;

describeIfServiceRole("RLS audit rollback under INSERT failure", () => {
  if (!SERVICE_ROLE_KEY) {
    it.skip("SUPABASE_SERVICE_ROLE_KEY not set — skipping", () => {});
    return;
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  it("forces a mid-INSERT failure and asserts no row was persisted", async () => {
    const { data, error } = await admin.rpc(
      "test_audit_rollback_on_insert_failure"
    );

    expect(error, `RPC failed: ${error?.message}`).toBeNull();
    expect(Array.isArray(data)).toBe(true);

    const rows = (data ?? []) as SelfTestRow[];
    expect(rows.length, "self-test returned no rows").toBeGreaterThan(0);

    // Skip cleanly if the database doesn't have 2 distinct tenants
    const fixture = rows.find((r) => r.scenario === "fixture");
    if (fixture?.status === "SKIP") {
      // eslint-disable-next-line no-console
      console.warn(`Self-test skipped: ${fixture.details}`);
      return;
    }

    const persistence = rows.find(
      (r) => r.scenario === "no_persisted_mutation_after_failure"
    );
    expect(persistence, "missing persistence assertion row").toBeDefined();
    expect(
      persistence!.status,
      `Persistence check failed: ${persistence!.details}`
    ).toBe("PASS");

    const probeExecuted = rows.find(
      (r) => r.scenario === "insert_probe_was_executed"
    );
    expect(
      probeExecuted?.status,
      `Audit did not exercise the INSERT probe: ${probeExecuted?.details}`
    ).toBe("PASS");

    const hardFailures = rows.filter(
      (r) => r.status === "FAIL"
    );
    if (hardFailures.length > 0) {
      const lines = hardFailures
        .map((r) => `  [FAIL] ${r.scenario} → ${r.details}`)
        .join("\n");
      throw new Error(`Self-test reported failures:\n${lines}`);
    }

    // eslint-disable-next-line no-console
    console.log(
      "Audit rollback self-test passed: no mutations persisted after simulated mid-INSERT failure."
    );
  });
});
