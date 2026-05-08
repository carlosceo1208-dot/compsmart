/**
 * RLS Tenant Isolation Regression Test
 * ------------------------------------
 * Calls the `audit_rls_tenant_isolation()` SQL function (which probes every
 * RLS-enabled public table that has a `root_company_id` column for cross-tenant
 * SELECT/UPDATE/DELETE/INSERT leaks) and fails the build if any table reports
 * a `FAIL`.
 *
 * Requires the service-role key in `SUPABASE_SERVICE_ROLE_KEY` (CI secret).
 * If not set, the suite self-skips so local `bunx vitest` runs stay green.
 */
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

declare const process: { env: Record<string, string | undefined> };

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://fpkjkqdfufhhicxkyqdw.supabase.co";

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

type AuditRow = {
  table_name: string;
  operation: "SELECT" | "UPDATE" | "DELETE" | "INSERT";
  status: "PASS" | "FAIL" | "ERROR" | "INCONCLUSIVE";
  details: string;
  affected_rows: number;
};

const describeIfServiceRole = SERVICE_ROLE_KEY ? describe : describe.skip;

describeIfServiceRole("RLS tenant isolation (auto-discovered)", () => {
  if (!SERVICE_ROLE_KEY) {
    it.skip("SUPABASE_SERVICE_ROLE_KEY not set — skipping", () => {});
    return;
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  it("no RLS-enabled table allows cross-tenant SELECT/UPDATE/DELETE/INSERT", async () => {
    const { data, error } = await admin.rpc("audit_rls_tenant_isolation");

    expect(error, `RPC failed: ${error?.message}`).toBeNull();
    expect(Array.isArray(data)).toBe(true);

    const rows = (data ?? []) as AuditRow[];
    expect(rows.length, "audit returned no rows — no tables probed?").toBeGreaterThan(0);

    const failures = rows.filter((r) => r.status === "FAIL");
    const errors = rows.filter((r) => r.status === "ERROR");

    if (failures.length > 0 || errors.length > 0) {
      const lines = [...failures, ...errors]
        .map(
          (r) =>
            `  [${r.status}] ${r.table_name}.${r.operation} → ${r.details} (rows: ${r.affected_rows})`
        )
        .join("\n");
      throw new Error(
        `Tenant isolation regressions detected on ${failures.length} FAIL / ${errors.length} ERROR cases:\n${lines}`
      );
    }

    // Useful diagnostic in CI logs
    const inconclusive = rows.filter((r) => r.status === "INCONCLUSIVE").length;
    const passed = rows.filter((r) => r.status === "PASS").length;
    // eslint-disable-next-line no-console
    console.log(
      `RLS audit: ${passed} PASS / ${inconclusive} INCONCLUSIVE / ${failures.length} FAIL / ${errors.length} ERROR across ${rows.length} probes`
    );
  });
});
