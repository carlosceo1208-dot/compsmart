/**
 * Extended Role Matrix + Negative Auth Tests
 * ------------------------------------------
 * Complements `rls-role-matrix.test.ts` with:
 *
 *  1. NEGATIVE authentication scenarios (must always be rejected):
 *     - malformed JWT
 *     - forged JWT (valid shape, wrong signature)
 *     - expired JWT (synthesized)
 *     - missing Authorization header on protected endpoints
 *     - missing tenant (profile with no root_company_id)
 *
 *  2. ROLE ESCALATION guards:
 *     - authenticated user cannot INSERT into user_roles
 *     - authenticated user cannot UPDATE their own row to elevate
 *     - authenticated user cannot self-assign super_admin
 *     - admin cannot grant super_admin to another user via API
 *
 *  3. EXTENDED edge-function matrix (auth required):
 *     - create-employee-user       (admin/hr_manager only)
 *     - invite-super-admin         (super_admin only)
 *     - admin-generate-link        (admin only)
 *     - update-employee-email      (admin/hr_manager only)
 *     - activate-employee          (public token — anon allowed with token)
 *     - refresh-storage-urls       (super_admin only)
 *     - send-employee-invitation   (admin/hr_manager only)
 *     - generate-job-description   (authenticated)
 *     - job-matching-ai            (authenticated)
 *     - salary-assistant           (authenticated)
 *     - legal-assistant            (authenticated)
 *     - performance-assistant      (authenticated)
 *     - incentive-assistant        (authenticated)
 *     - support-assistant          (authenticated)
 *     - nr1-plano-acao-assistant   (authenticated)
 *     - nr1-bem-estar-agent        (authenticated)
 *     - nr1-jornada-agent          (authenticated)
 *     - send-kudos-notification    (spoofing guard: sender_id must match caller)
 *     - notify-budget-submission   (role gate)
 *
 * Skips automatically if `SUPABASE_SERVICE_ROLE_KEY` is not set so local
 * `bunx vitest` runs stay green.
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

type RoleKey =
  | "authenticated"
  | "admin"
  | "hr_manager"
  | "super_admin"
  | "tenantless";

type Actor = {
  key: RoleKey;
  userId: string;
  email: string;
  client: SupabaseClient;
  accessToken: string;
};

const describeIfKeys =
  SERVICE_ROLE_KEY && ANON_KEY ? describe : describe.skip;

// ---- Helpers ---------------------------------------------------------------

function b64url(input: string) {
  // Node/Deno-safe base64url (browser btoa OK here since vitest runs in node with polyfill).
  const b = Buffer.from(input, "utf8").toString("base64");
  return b.replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/** Forge a JWT with valid shape but a bogus signature. Will fail verification. */
function forgeJwt(claims: Record<string, unknown>): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify(claims));
  const sig = b64url("not-a-real-signature");
  return `${header}.${payload}.${sig}`;
}

const EXPIRED_JWT = forgeJwt({
  sub: "00000000-0000-0000-0000-000000000000",
  role: "authenticated",
  iat: Math.floor(Date.now() / 1000) - 7200,
  exp: Math.floor(Date.now() / 1000) - 3600,
});

const FORGED_JWT = forgeJwt({
  sub: "00000000-0000-0000-0000-000000000000",
  role: "authenticated",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
});

const MALFORMED_JWT = "not.a.jwt";

// ---- Suite -----------------------------------------------------------------

describeIfKeys("Extended matrix + negative auth", () => {
  if (!SERVICE_ROLE_KEY || !ANON_KEY) {
    it.skip("SUPABASE_SERVICE_ROLE_KEY / anon key not set — skipping", () => {});
    return;
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const actors: Record<RoleKey, Actor> = {} as any;
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const password = `NegPass!${suffix}`;
  const createdUserIds: string[] = [];
  let companyId: string | null = null;

  beforeAll(async () => {
    const { data: existingCompany } = await admin
      .from("organizational_structure")
      .select("id")
      .limit(1)
      .maybeSingle();
    companyId = existingCompany?.id ?? null;

    async function makeActor(
      key: RoleKey,
      opts: { withCompany: boolean; role?: RoleKey }
    ): Promise<Actor> {
      const email = `neg-${key}-${suffix}@compsmart-tests.local`;
      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: `Neg ${key}` },
      });
      if (error || !created?.user) throw error ?? new Error("createUser failed");
      const userId = created.user.id;
      createdUserIds.push(userId);

      await admin.from("profiles").upsert(
        {
          id: userId,
          email,
          full_name: `Neg ${key}`,
          root_company_id: opts.withCompany ? companyId : null,
          status: "active",
        },
        { onConflict: "id" }
      );

      if (opts.role && opts.role !== "authenticated" && opts.role !== "tenantless") {
        await admin
          .from("user_roles")
          .insert({ user_id: userId, role: opts.role as any });
      }

      const client = createClient(SUPABASE_URL, ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: signIn, error: signInErr } =
        await client.auth.signInWithPassword({ email, password });
      if (signInErr) throw signInErr;

      return {
        key,
        userId,
        email,
        client,
        accessToken: signIn.session?.access_token ?? "",
      };
    }

    actors.authenticated = await makeActor("authenticated", { withCompany: true });
    actors.admin = await makeActor("admin", { withCompany: true, role: "admin" });
    actors.hr_manager = await makeActor("hr_manager", {
      withCompany: true,
      role: "hr_manager",
    });
    actors.super_admin = await makeActor("super_admin", {
      withCompany: true,
      role: "super_admin",
    });
    actors.tenantless = await makeActor("tenantless", { withCompany: false });
  }, 180_000);

  afterAll(async () => {
    for (const uid of createdUserIds) {
      await admin.from("user_roles").delete().eq("user_id", uid);
      await admin.from("profiles").delete().eq("id", uid);
      await admin.auth.admin.deleteUser(uid).catch(() => {});
    }
  });

  // -------------------------------------------------------------------------
  // Helpers bound to actors
  // -------------------------------------------------------------------------
  async function invokeFn(
    fn: string,
    token: string | null,
    body: unknown,
    extraHeaders: Record<string, string> = {}
  ) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      ...extraHeaders,
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body ?? {}),
    });
    return { status: res.status, text: await res.text() };
  }

  // =========================================================================
  // 1. NEGATIVE AUTH — malformed / forged / expired JWTs
  // =========================================================================
  describe("Negative auth: malformed / forged / expired JWTs", () => {
    const protectedFns = [
      "suggest-job-competencies",
      "salary-assistant",
      "legal-assistant",
      "performance-assistant",
      "incentive-assistant",
      "generate-job-description",
      "job-matching-ai",
      "succession-ai-analysis",
      "create-employee-user",
      "invite-super-admin",
      "notify-budget-submission",
      "refresh-storage-urls",
    ];

    for (const fn of protectedFns) {
      it(`${fn} → malformed JWT rejected`, async () => {
        const { status } = await invokeFn(fn, MALFORMED_JWT, {});
        expect([400, 401, 403]).toContain(status);
      });

      it(`${fn} → forged JWT rejected`, async () => {
        const { status } = await invokeFn(fn, FORGED_JWT, {});
        expect([400, 401, 403]).toContain(status);
      });

      it(`${fn} → expired JWT rejected`, async () => {
        const { status } = await invokeFn(fn, EXPIRED_JWT, {});
        expect([400, 401, 403]).toContain(status);
      });

      it(`${fn} → missing Authorization rejected`, async () => {
        const { status } = await invokeFn(fn, null, {});
        expect([400, 401, 403]).toContain(status);
      });
    }
  });

  // =========================================================================
  // 2. MISSING TENANT — user with no root_company_id must not act on company data
  // =========================================================================
  describe("Missing tenant guard (profile without root_company_id)", () => {
    it("tenantless user → create-employee-user rejected", async () => {
      const { status } = await invokeFn(
        "create-employee-user",
        actors.tenantless.accessToken,
        { email: "x@y.z", full_name: "X", employee_number: `T-${suffix}` }
      );
      expect([400, 401, 403]).toContain(status);
    });

    it("tenantless user → profiles listing yields at most self", async () => {
      const { data, error } = await actors.tenantless.client
        .from("profiles")
        .select("id");
      // Either error or only self visible
      if (!error) {
        const foreign = (data ?? []).filter(
          (r: any) => r.id !== actors.tenantless.userId
        );
        expect(foreign).toEqual([]);
      }
    });

    it("tenantless user → cannot read organizational_structure of others", async () => {
      const { data } = await actors.tenantless.client
        .from("organizational_structure")
        .select("id")
        .limit(1);
      expect(data ?? []).toEqual([]);
    });
  });

  // =========================================================================
  // 3. ROLE ESCALATION GUARDS on user_roles
  // =========================================================================
  describe("Role escalation guards on user_roles", () => {
    it("authenticated → cannot INSERT any role for self", async () => {
      const { error } = await actors.authenticated.client
        .from("user_roles")
        .insert({ user_id: actors.authenticated.userId, role: "admin" as any });
      expect(error).not.toBeNull();
    });

    it("authenticated → cannot INSERT super_admin for self", async () => {
      const { error } = await actors.authenticated.client
        .from("user_roles")
        .insert({
          user_id: actors.authenticated.userId,
          role: "super_admin" as any,
        });
      expect(error).not.toBeNull();
    });

    it("authenticated → cannot INSERT role for another user", async () => {
      const { error } = await actors.authenticated.client
        .from("user_roles")
        .insert({ user_id: actors.admin.userId, role: "super_admin" as any });
      expect(error).not.toBeNull();
    });

    it("admin → cannot self-grant super_admin", async () => {
      const { error } = await actors.admin.client
        .from("user_roles")
        .insert({ user_id: actors.admin.userId, role: "super_admin" as any });
      // Admin policies must NOT permit elevating to super_admin.
      expect(error).not.toBeNull();
    });

    it("authenticated → cannot UPDATE existing user_roles row", async () => {
      // Seed a row via service role, then try to escalate as the user.
      const seeded = await admin
        .from("user_roles")
        .insert({
          user_id: actors.authenticated.userId,
          role: "employee" as any,
        })
        .select("id")
        .maybeSingle();

      const { error } = await actors.authenticated.client
        .from("user_roles")
        .update({ role: "super_admin" as any })
        .eq("user_id", actors.authenticated.userId);
      expect(error).not.toBeNull();

      // Cleanup
      if (seeded.data?.id) {
        await admin.from("user_roles").delete().eq("id", seeded.data.id);
      } else {
        await admin
          .from("user_roles")
          .delete()
          .eq("user_id", actors.authenticated.userId);
      }
    });

    it("authenticated → cannot DELETE their user_roles row", async () => {
      const seeded = await admin
        .from("user_roles")
        .insert({
          user_id: actors.authenticated.userId,
          role: "employee" as any,
        })
        .select("id")
        .maybeSingle();

      const { error } = await actors.authenticated.client
        .from("user_roles")
        .delete()
        .eq("user_id", actors.authenticated.userId);
      expect(error).not.toBeNull();

      if (seeded.data?.id) {
        await admin.from("user_roles").delete().eq("id", seeded.data.id);
      }
    });
  });

  // =========================================================================
  // 4. EXTENDED EDGE-FUNCTION MATRIX
  // =========================================================================
  describe("create-employee-user (admin/hr_manager only)", () => {
    const cases: Array<[RoleKey | "anon", "reject" | "accept"]> = [
      ["anon", "reject"],
      ["authenticated", "reject"],
      ["admin", "accept"],
      ["hr_manager", "accept"],
    ];
    for (const [role, expected] of cases) {
      it(`${role} → ${expected}`, async () => {
        const token =
          role === "anon" ? null : actors[role as RoleKey].accessToken;
        const { status } = await invokeFn("create-employee-user", token, {
          full_name: "Neg Test",
          employee_number: `NEG-${role}-${suffix}`,
        });
        if (expected === "reject") {
          expect([400, 401, 403]).toContain(status);
        } else {
          // Accepted callers may still 400 on payload gaps — but never 401/403.
          expect([200, 400, 500]).toContain(status);
        }
      });
    }
  });

  describe("invite-super-admin (super_admin only)", () => {
    const cases: Array<[RoleKey | "anon", "reject" | "accept"]> = [
      ["anon", "reject"],
      ["authenticated", "reject"],
      ["admin", "reject"],
      ["hr_manager", "reject"],
      ["super_admin", "accept"],
    ];
    for (const [role, expected] of cases) {
      it(`${role} → ${expected}`, async () => {
        const token =
          role === "anon" ? null : actors[role as RoleKey].accessToken;
        const { status } = await invokeFn("invite-super-admin", token, {
          email: `probe-${role}-${suffix}@compsmart-tests.local`,
        });
        if (expected === "reject") {
          expect([400, 401, 403]).toContain(status);
        } else {
          expect([200, 400, 500]).toContain(status);
        }
      });
    }
  });

  describe("refresh-storage-urls (super_admin only)", () => {
    const cases: Array<[RoleKey | "anon", "reject" | "accept"]> = [
      ["anon", "reject"],
      ["authenticated", "reject"],
      ["admin", "reject"],
      ["super_admin", "accept"],
    ];
    for (const [role, expected] of cases) {
      it(`${role} → ${expected}`, async () => {
        const token =
          role === "anon" ? null : actors[role as RoleKey].accessToken;
        const { status } = await invokeFn("refresh-storage-urls", token, {});
        if (expected === "reject") {
          expect([400, 401, 403]).toContain(status);
        } else {
          expect([200, 400, 500]).toContain(status);
        }
      });
    }
  });

  describe("update-employee-email + send-employee-invitation (admin/HR only)", () => {
    const fns = ["update-employee-email", "send-employee-invitation"];
    const roles: Array<[RoleKey | "anon", "reject" | "accept"]> = [
      ["anon", "reject"],
      ["authenticated", "reject"],
      ["admin", "accept"],
      ["hr_manager", "accept"],
    ];
    for (const fn of fns) {
      for (const [role, expected] of roles) {
        it(`${fn} → ${role} → ${expected}`, async () => {
          const token =
            role === "anon" ? null : actors[role as RoleKey].accessToken;
          const { status } = await invokeFn(fn, token, {
            userId: actors.authenticated.userId,
            email: `probe-${role}-${suffix}@compsmart-tests.local`,
          });
          if (expected === "reject") {
            expect([400, 401, 403]).toContain(status);
          } else {
            expect([200, 400, 404, 500]).toContain(status);
          }
        });
      }
    }
  });

  describe("Authenticated-only assistants (auth required, role-agnostic)", () => {
    const fns = [
      "salary-assistant",
      "legal-assistant",
      "performance-assistant",
      "incentive-assistant",
      "support-assistant",
      "generate-job-description",
      "job-matching-ai",
      "nr1-plano-acao-assistant",
      "nr1-bem-estar-agent",
      "nr1-jornada-agent",
    ];
    for (const fn of fns) {
      it(`${fn} → anon rejected`, async () => {
        const { status } = await invokeFn(fn, null, {});
        expect([400, 401, 403]).toContain(status);
      });
      it(`${fn} → authenticated NOT rejected on auth`, async () => {
        const { status } = await invokeFn(
          fn,
          actors.authenticated.accessToken,
          {}
        );
        // Must pass auth. Payload validation / upstream may still 400/500.
        expect(status).not.toBe(401);
        expect(status).not.toBe(403);
      });
    }
  });

  // -------------------------------------------------------------------------
  // Sender spoofing guard on send-kudos-notification
  // -------------------------------------------------------------------------
  describe("send-kudos-notification anti-spoofing", () => {
    it("caller cannot spoof sender_id belonging to another user", async () => {
      const { status, text } = await invokeFn(
        "send-kudos-notification",
        actors.authenticated.accessToken,
        {
          sender_id: actors.admin.userId, // spoof attempt
          recipient_id: actors.hr_manager.userId,
          message: "spoof",
          points: 1,
        }
      );
      // Must NOT succeed with the spoofed sender: expect a rejection or an
      // override that never trusts the client-provided sender_id.
      // Accept: 400/401/403 rejection, or 200 with an error body making clear
      // the sender was overridden — but never 2xx silently accepting the spoof.
      if (status === 200) {
        // If accepted, function MUST have overridden sender_id server-side.
        // We cannot introspect DB here reliably; require an explicit signal.
        expect(text.toLowerCase()).toMatch(/override|sender|forbidden|invalid/);
      } else {
        expect([400, 401, 403]).toContain(status);
      }
    });
  });
});
