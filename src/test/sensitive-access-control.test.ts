/**
 * Sensitive Data Access Control Regression Test
 * ---------------------------------------------
 * Calls `audit_sensitive_data_access()`, which inspects RLS policies on every
 * curated (table, sensitive_column) pair (salary, PII, performance scores,
 * billing) and asserts that at least one SELECT/ALL policy gates access by
 * admin / HR / direct manager / self (auth.uid()).
 *
 * Fails the build on any FAIL row. INCONCLUSIVE rows surface schema drift so
 * the audit list can be kept in sync.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (CI secret); self-skips otherwise so
 * local `bunx vitest` runs stay green.
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
  sensitive_field: string;
  status: "PASS" | "FAIL" | "INCONCLUSIVE";
  details: string;
};

const describeIfServiceRole = SERVICE_ROLE_KEY ? describe : describe.skip;

describeIfServiceRole("Sensitive data access control (admin/HR/manager/self)", () => {
  if (!SERVICE_ROLE_KEY) {
    it.skip("SUPABASE_SERVICE_ROLE_KEY not set — skipping", () => {});
    return;
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  it("every sensitive (table, column) pair is gated by role-based or self RLS", async () => {
    const { data, error } = await admin.rpc("audit_sensitive_data_access");

    expect(error, `RPC failed: ${error?.message}`).toBeNull();
    expect(Array.isArray(data)).toBe(true);

    const rows = (data ?? []) as AuditRow[];
    expect(rows.length, "audit returned no rows — list empty?").toBeGreaterThan(0);

    const failures = rows.filter((r) => r.status === "FAIL");

    if (failures.length > 0) {
      const lines = failures
        .map(
          (r) =>
            `  [FAIL] ${r.table_name}.${r.sensitive_field} → ${r.details}`
        )
        .join("\n");
      throw new Error(
        `Sensitive access control regressions on ${failures.length} field(s):\n${lines}`
      );
    }

    const inconclusive = rows.filter((r) => r.status === "INCONCLUSIVE");
    const passed = rows.filter((r) => r.status === "PASS").length;

    if (inconclusive.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `Schema drift on ${inconclusive.length} probe(s) — update audit_sensitive_data_access targets:\n` +
          inconclusive
            .map((r) => `  ${r.table_name}.${r.sensitive_field}: ${r.details}`)
            .join("\n")
      );
    }

    // eslint-disable-next-line no-console
    console.log(
      `Sensitive access audit: ${passed} PASS / ${inconclusive.length} INCONCLUSIVE / ${failures.length} FAIL across ${rows.length} probes`
    );
  });
});
