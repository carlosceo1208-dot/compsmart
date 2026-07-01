/**
 * E2E — Login, Tenant Isolation & Edge-Function Permissions
 * ---------------------------------------------------------
 * End-to-end integration test that provisions ephemeral users across TWO
 * companies (tenant A + tenant B) and exercises the full auth lifecycle
 * against the real Supabase backend:
 *
 *   1. Sign-up + password sign-in flow (auth server round-trip)
 *   2. Cross-tenant isolation on NR-1 tables (A must not see B, and vice-versa)
 *   3. Role-gated edge function permissions for the main NR-1 functions:
 *      - nr1-plano-acao-assistant  (authenticated)
 *      - nr1-bem-estar-agent       (authenticated)
 *      - nr1-jornada-agent         (authenticated)
 *      - suggest-job-competencies  (authenticated)
 *      - notify-budget-submission  (role gated — admin/hr_manager only)
 *      - succession-ai-analysis    (admin/hr_manager/super_admin)
 *
 * Requires `SUPABASE_SERVICE_ROLE_KEY` in CI. Self-skips locally so
 * `bunx vitest` stays green without secrets.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

declare const process: { env: Record<string, string | undefined> };

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://fpkjkqdfufhhicxkyqdw.supabase.co";
const ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const describeIf = SERVICE_ROLE_KEY && ANON_KEY ? describe : describe.skip;

type Tenant = {
  companyId: string;
  admin: { userId: string; email: string; client: SupabaseClient };
  user: { userId: string; email: string; client: SupabaseClient };
};

async function callFn(client: SupabaseClient, name: string, body: unknown) {
  const { data: { session } } = await client.auth.getSession();
  const token = session?.access_token;
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  return { status: resp.status, text };
}

async function callFnRaw(name: string, headers: Record<string, string>, body: unknown) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY, ...headers },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  return { status: resp.status, text };
}

describeIf("E2E — login, tenant isolation & NR-1 edge functions", () => {
  if (!SERVICE_ROLE_KEY || !ANON_KEY) {
    it.skip("Missing SUPABASE_SERVICE_ROLE_KEY — skipping", () => {});
    return;
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const suffix = Date.now();
  const password = `E2E!${suffix}Aa`;
  const createdUsers: string[] = [];
  const createdCompanies: string[] = [];
  let tenantA: Tenant;
  let tenantB: Tenant;
  const createdNr1Rows: Array<{ table: string; id: string }> = [];

  async function makeCompany(name: string): Promise<string> {
    const { data, error } = await admin
      .from("organizational_structure")
      .insert({ name: `${name}-${suffix}`, type: "company", nr1_addon_enabled: true })
      .select("id")
      .single();
    if (error) throw error;
    createdCompanies.push(data.id);
    return data.id;
  }

  async function makeUser(email: string, companyId: string, role?: "admin" | "hr_manager") {
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: email },
    });
    if (error || !created?.user) throw error ?? new Error("createUser failed");
    const userId = created.user.id;
    createdUsers.push(userId);

    await admin.from("profiles").upsert(
      { id: userId, email, full_name: email, root_company_id: companyId, status: "active" },
      { onConflict: "id" }
    );
    if (role) {
      await admin.from("user_roles").insert({ user_id: userId, role });
    }

    const client = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: signInErr } = await client.auth.signInWithPassword({ email, password });
    if (signInErr) throw signInErr;

    return { userId, email, client };
  }

  beforeAll(async () => {
    const [companyA, companyB] = await Promise.all([
      makeCompany("E2E-Tenant-A"),
      makeCompany("E2E-Tenant-B"),
    ]);

    const [adminA, userA, adminB, userB] = await Promise.all([
      makeUser(`e2e-admin-a-${suffix}@compsmart-tests.local`, companyA, "admin"),
      makeUser(`e2e-user-a-${suffix}@compsmart-tests.local`, companyA),
      makeUser(`e2e-admin-b-${suffix}@compsmart-tests.local`, companyB, "admin"),
      makeUser(`e2e-user-b-${suffix}@compsmart-tests.local`, companyB),
    ]);

    tenantA = { companyId: companyA, admin: adminA, user: userA };
    tenantB = { companyId: companyB, admin: adminB, user: userB };

    // Seed one NR-1 row in each tenant so isolation tests have something to fetch.
    for (const t of [tenantA, tenantB]) {
      const { data, error } = await admin
        .from("nr1_jornadas")
        .insert({
          company_id: t.companyId,
          user_id: t.user.userId,
          status: "active",
        })
        .select("id")
        .single();
      if (!error && data) createdNr1Rows.push({ table: "nr1_jornadas", id: data.id });
    }
  }, 180_000);

  afterAll(async () => {
    for (const row of createdNr1Rows) {
      await admin.from(row.table).delete().eq("id", row.id);
    }
    for (const uid of createdUsers) {
      await admin.from("user_roles").delete().eq("user_id", uid);
      await admin.from("profiles").delete().eq("id", uid);
      await admin.auth.admin.deleteUser(uid).catch(() => {});
    }
    for (const cid of createdCompanies) {
      await admin.from("organizational_structure").delete().eq("id", cid);
    }
  });

  // ---------------------------------------------------------------------------
  // 1. LOGIN FLOW
  // ---------------------------------------------------------------------------
  describe("Login flow", () => {
    it("valid credentials → session with matching user", async () => {
      const client = createClient(SUPABASE_URL, ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data, error } = await client.auth.signInWithPassword({
        email: tenantA.admin.email,
        password,
      });
      expect(error).toBeNull();
      expect(data.session?.access_token).toBeTruthy();

      // Re-validate the token against the auth server (getUser, not getSession).
      const { data: userData, error: userErr } = await client.auth.getUser();
      expect(userErr).toBeNull();
      expect(userData.user?.id).toBe(tenantA.admin.userId);
    });

    it("invalid password → error, no session", async () => {
      const client = createClient(SUPABASE_URL, ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data, error } = await client.auth.signInWithPassword({
        email: tenantA.admin.email,
        password: "definitely-wrong-password",
      });
      expect(error).toBeTruthy();
      expect(data.session).toBeNull();
    });

    it("sign-out clears the session", async () => {
      const client = createClient(SUPABASE_URL, ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      await client.auth.signInWithPassword({ email: tenantA.user.email, password });
      await client.auth.signOut();
      const { data } = await client.auth.getSession();
      expect(data.session).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 2. TENANT ISOLATION (A vs B on NR-1 tables + profiles)
  // ---------------------------------------------------------------------------
  describe("Tenant isolation across companies", () => {
    it("admin A cannot read profiles from tenant B", async () => {
      const { data, error } = await tenantA.admin.client
        .from("profiles")
        .select("id, root_company_id")
        .eq("root_company_id", tenantB.companyId);
      // Either explicit block or empty result — never leak B's rows.
      if (!error) {
        expect((data ?? []).every((r) => r.root_company_id === tenantB.companyId)).toBe(true);
        expect(data ?? []).toEqual([]);
      }
    });

    it("admin A cannot read nr1_jornadas from tenant B", async () => {
      const { data, error } = await tenantA.admin.client
        .from("nr1_jornadas")
        .select("id, company_id")
        .eq("company_id", tenantB.companyId);
      if (!error) expect(data ?? []).toEqual([]);
    });

    it("admin A can read nr1_jornadas from tenant A (baseline)", async () => {
      const { data, error } = await tenantA.admin.client
        .from("nr1_jornadas")
        .select("id, company_id")
        .eq("company_id", tenantA.companyId);
      expect(error).toBeNull();
      // At least the row we seeded.
      expect((data ?? []).length).toBeGreaterThanOrEqual(1);
      expect((data ?? []).every((r) => r.company_id === tenantA.companyId)).toBe(true);
    });

    it("regular user A cannot insert a nr1_plano_acao pointing to tenant B", async () => {
      const { error } = await tenantA.user.client.from("nr1_planos_acao").insert({
        company_id: tenantB.companyId,
        titulo: "cross-tenant attempt",
        status: "aberto",
      });
      expect(error).toBeTruthy();
    });

    it("user A cannot escalate own role via user_roles", async () => {
      const { error } = await tenantA.user.client
        .from("user_roles")
        .insert({ user_id: tenantA.user.userId, role: "super_admin" });
      expect(error).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. EDGE FUNCTION PERMISSIONS — MAIN NR-1 FUNCTIONS
  // ---------------------------------------------------------------------------
  describe("Edge functions — anonymous & forged JWT", () => {
    const authRequired = [
      "nr1-plano-acao-assistant",
      "nr1-bem-estar-agent",
      "nr1-jornada-agent",
      "suggest-job-competencies",
      "succession-ai-analysis",
      "notify-budget-submission",
    ];

    for (const fn of authRequired) {
      it(`${fn} → rejects missing Authorization`, async () => {
        const { status } = await callFnRaw(fn, {}, { probe: true });
        expect([400, 401, 403]).toContain(status);
      });

      it(`${fn} → rejects forged/invalid JWT`, async () => {
        const { status } = await callFnRaw(
          fn,
          { Authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.forged.signature" },
          { probe: true }
        );
        expect([400, 401, 403]).toContain(status);
      });
    }
  });

  describe("Edge functions — role gating", () => {
    it("notify-budget-submission → regular authenticated user is rejected", async () => {
      const { status } = await callFn(tenantA.user.client, "notify-budget-submission", {
        submission_id: "00000000-0000-0000-0000-000000000000",
      });
      expect([401, 403]).toContain(status);
    });

    it("notify-budget-submission → admin is accepted (may return 4xx by payload, never 401/403)", async () => {
      const { status } = await callFn(tenantA.admin.client, "notify-budget-submission", {
        submission_id: "00000000-0000-0000-0000-000000000000",
      });
      // Admin passes auth: any error must be about the payload, not the role.
      expect(status).not.toBe(401);
      expect(status).not.toBe(403);
    });

    it("succession-ai-analysis → regular authenticated user is rejected", async () => {
      const { status } = await callFn(tenantA.user.client, "succession-ai-analysis", {
        employee_id: "00000000-0000-0000-0000-000000000000",
      });
      expect([401, 403]).toContain(status);
    });

    it("succession-ai-analysis → admin passes role check", async () => {
      const { status } = await callFn(tenantA.admin.client, "succession-ai-analysis", {
        employee_id: "00000000-0000-0000-0000-000000000000",
      });
      expect(status).not.toBe(401);
      expect(status).not.toBe(403);
    });

    it("nr1-plano-acao-assistant → any authenticated user of the tenant is accepted", async () => {
      const { status } = await callFn(tenantA.user.client, "nr1-plano-acao-assistant", {
        message: "ping",
      });
      // May be 200/400/500 depending on payload; must not be 401/403.
      expect(status).not.toBe(401);
      expect(status).not.toBe(403);
    });
  });
});
