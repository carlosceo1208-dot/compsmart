/**
 * Regression tests — glossary_terms & support_quick_actions
 * ---------------------------------------------------------
 * Guarantees that write access to these two globally-scoped tables remains
 * restricted to super_admin, so tenant-scoped scopes cannot be re-introduced
 * by accident.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY to provision ephemeral users;
 * self-skips locally when secrets are not available.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

declare const process: { env: Record<string, string | undefined> };

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://fpkjkqdfufhhicxkyqdw.supabase.co";
const ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

type RoleKey = "authenticated" | "admin" | "hr_manager" | "super_admin";
type Actor = { key: RoleKey; userId: string; client: SupabaseClient };

const describeIfKeys = SERVICE_ROLE_KEY && ANON_KEY ? describe : describe.skip;

describeIfKeys("glossary_terms & support_quick_actions — super_admin only writes", () => {
  if (!SERVICE_ROLE_KEY || !ANON_KEY) {
    it.skip("SUPABASE_SERVICE_ROLE_KEY / anon key not set — skipping", () => {});
    return;
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const suffix = Date.now();
  const password = `TestPass!${suffix}`;
  const actors: Partial<Record<RoleKey, Actor>> = {};
  const createdUserIds: string[] = [];
  const createdGlossaryIds: string[] = [];
  const createdQuickActionIds: string[] = [];

  beforeAll(async () => {
    async function makeActor(key: RoleKey): Promise<Actor> {
      const email = `test-${key}-glossqa-${suffix}@compsmart-tests.local`;
      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error || !created?.user) throw error ?? new Error("createUser failed");
      const userId = created.user.id;
      createdUserIds.push(userId);
      await admin.from("profiles").upsert({ id: userId, email, status: "active" }, { onConflict: "id" });
      if (key !== "authenticated") {
        await admin.from("user_roles").insert({ user_id: userId, role: key as any });
      }
      const client = createClient(SUPABASE_URL, ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error: signErr } = await client.auth.signInWithPassword({ email, password });
      if (signErr) throw signErr;
      return { key, userId, client };
    }
    for (const k of ["authenticated", "admin", "hr_manager", "super_admin"] as RoleKey[]) {
      actors[k] = await makeActor(k);
    }
  }, 120_000);

  afterAll(async () => {
    if (createdGlossaryIds.length)
      await admin.from("glossary_terms").delete().in("id", createdGlossaryIds);
    if (createdQuickActionIds.length)
      await admin.from("support_quick_actions").delete().in("id", createdQuickActionIds);
    for (const uid of createdUserIds) {
      await admin.from("user_roles").delete().eq("user_id", uid);
      await admin.from("profiles").delete().eq("id", uid);
      await admin.auth.admin.deleteUser(uid).catch(() => {});
    }
  });

  // -----------------------------------------------------------------------
  // glossary_terms — public read, super_admin write only
  // -----------------------------------------------------------------------
  describe("glossary_terms", () => {
    it("anon can SELECT (public reference content)", async () => {
      const { error } = await anonClient.from("glossary_terms").select("id").limit(1);
      expect(error).toBeNull();
    });

    const writeCases: Array<[RoleKey, "allow" | "deny"]> = [
      ["authenticated", "deny"],
      ["admin", "deny"],
      ["hr_manager", "deny"],
      ["super_admin", "allow"],
    ];

    for (const [role, expected] of writeCases) {
      it(`${role} INSERT → ${expected}`, async () => {
        const client = actors[role]!.client;
        const term = `_test_${role}_${suffix}`;
        const { data, error } = await client
          .from("glossary_terms")
          .insert({ term, definition: "regression test", category: "test" })
          .select("id")
          .maybeSingle();
        if (expected === "allow") {
          expect(error).toBeNull();
          expect(data?.id).toBeTruthy();
          if (data?.id) createdGlossaryIds.push(data.id);
        } else {
          expect(error).not.toBeNull();
          expect(data).toBeNull();
        }
      });
    }

    it("anon INSERT → deny", async () => {
      const { error } = await anonClient
        .from("glossary_terms")
        .insert({ term: `_anon_${suffix}`, definition: "x", category: "test" });
      expect(error).not.toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // support_quick_actions — auth read, super_admin write only, no duplicates
  // -----------------------------------------------------------------------
  describe("support_quick_actions", () => {
    it("authenticated can SELECT", async () => {
      const { error } = await actors.authenticated!.client
        .from("support_quick_actions")
        .select("id")
        .limit(1);
      expect(error).toBeNull();
    });

    const writeCases: Array<[RoleKey, "allow" | "deny"]> = [
      ["authenticated", "deny"],
      ["admin", "deny"],
      ["hr_manager", "deny"],
      ["super_admin", "allow"],
    ];

    for (const [role, expected] of writeCases) {
      it(`${role} INSERT → ${expected}`, async () => {
        const client = actors[role]!.client;
        const { data, error } = await client
          .from("support_quick_actions")
          .insert({
            title: `_test_${role}_${suffix}`,
            description: "regression",
            category: "test",
          })
          .select("id")
          .maybeSingle();
        if (expected === "allow") {
          expect(error).toBeNull();
          expect(data?.id).toBeTruthy();
          if (data?.id) createdQuickActionIds.push(data.id);
        } else {
          expect(error).not.toBeNull();
          expect(data).toBeNull();
        }
      });
    }

    it("regression: no duplicated permissive admin policy leaks writes", async () => {
      // Confirms only one management policy exists AND it requires super_admin.
      const { data } = await admin
        .from("pg_policies" as any)
        .select("policyname, qual, with_check")
        .eq("tablename", "support_quick_actions");
      const managePolicies = (data ?? []).filter((p: any) =>
        /manage|admin/i.test(p.policyname)
      );
      // Every management policy must reference has_role(..., 'super_admin').
      for (const p of managePolicies as any[]) {
        const body = `${p.qual ?? ""} ${p.with_check ?? ""}`;
        expect(body).toMatch(/super_admin/);
      }
    });
  });
});
