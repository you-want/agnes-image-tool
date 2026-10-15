import { createHmac } from "node:crypto";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const fake = vi.hoisted(() => ({
  tables: {} as Record<string, Record<string, unknown>[]>,
  error: false,
  rpcAllowed: true,
  dbCalls: 0,
}));

vi.mock("@/lib/auth/database", () => ({
  authDatabase: () => {
    fake.dbCalls += 1;
    return {
      rpc: async () => ({ data: [{ allowed: fake.rpcAllowed, reason: "user_limit" }], error: fake.error ? { message: "unavailable" } : null }),
      from: (table: string) => {
        let op = "read";
        let values: Record<string, unknown> = {};
        const filters: Array<(row: Record<string, unknown>) => boolean> = [];
        const execute = () => {
          if (fake.error) return { data: null, error: { message: "unavailable" } };
          const rows = fake.tables[table] ||= [];
          if (op === "insert") { rows.push({ ...values }); return { data: null, error: null }; }
          const selected = rows.filter((row) => filters.every((filter) => filter(row)));
          if (op === "update") selected.forEach((row) => Object.assign(row, values));
          if (op === "delete") fake.tables[table] = rows.filter((row) => !selected.includes(row));
          const data = selected.map((row) => table === "agnes_sessions"
            ? { ...row, account: fake.tables.app_accounts.find((account) => account.user_id === row.user_id) }
            : { ...row });
          return { data, error: null };
        };
        const builder = {
          select: (_columns?: string) => builder,
          eq: (key: string, value: unknown) => { filters.push((row) => row[key] === value); return builder; },
          gt: (key: string, value: string) => { filters.push((row) => String(row[key]) > value); return builder; },
          update: (input: Record<string, unknown>) => { op = "update"; values = input; return builder; },
          insert: (input: Record<string, unknown>) => { op = "insert"; values = input; return builder; },
          delete: () => { op = "delete"; return builder; },
          maybeSingle: async () => { const result = execute(); return { ...result, data: result.data?.[0] || null }; },
          then: (callback: (value: unknown) => unknown) => Promise.resolve(execute()).then(callback),
        };
        return builder;
      },
    };
  },
}));

import { getAccess } from "./access";
import { codeHash, newSessionToken, requestSessionToken, safeReturnTo, tokenHash } from "./security";
import { takeQuota } from "./quota";
import { POST as verifyCode } from "@/app/api/auth/wechat/code/verify/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { loadServerConfig } from "@/lib/config";
import { POST as generateImage } from "@/app/api/image/generate/route";
import { POST as editImage } from "@/app/api/image/edit/route";
import { POST as chat } from "@/app/api/chat/route";
import { POST as generateVideo } from "@/app/api/video/generate/route";
import { POST as generateFlash } from "@/app/api/video/flash/generate/route";
import { POST as upload } from "@/app/api/video/flash/upload/route";
import { GET as videoStatus } from "@/app/api/video/status/[id]/route";
import { GET as flashStatus } from "@/app/api/video/flash/status/[id]/route";
import { POST as saveConfig } from "@/app/api/config/save/route";

const userId = "11111111-1111-1111-1111-111111111111";
const sessionToken = "A".repeat(43);
let requestCounter = 0;

function request(path: string, options: { token?: string; body?: unknown; origin?: string; method?: string } = {}) {
  return new NextRequest(`https://images.example.com${path}`, {
    method: options.method || "POST",
    headers: {
      "x-forwarded-for": `198.51.100.${++requestCounter}`,
      "Content-Type": "application/json",
      ...(options.token ? { cookie: `agnes_session=${options.token}` } : {}),
      ...(options.origin ? { origin: options.origin } : {}),
    },
    ...(options.method === "GET" ? {} : { body: JSON.stringify(options.body || {}) }),
  });
}

beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "server-only-test-key");
  vi.stubEnv("WECHAT_LOGIN_HMAC_SECRET", "test-secret-which-is-at-least-32-characters");
  fake.error = false;
  fake.rpcAllowed = true;
  fake.dbCalls = 0;
  fake.tables = {
    app_accounts: [{ user_id: userId, wechat_openid: "wx-user", wechat_status: "following", disabled_at: null }],
    agnes_sessions: [{ token_hash: tokenHash(sessionToken), user_id: userId, expires_at: new Date(Date.now() + 60_000).toISOString() }],
    wechat_login_codes: [{ id: "code-id", code_hash: codeHash("123456"), user_id: userId, wechat_openid: "wx-user", status: "pending", expires_at: new Date(Date.now() + 60_000).toISOString() }],
    agnes_video_tasks: [],
  };
});
afterEach(() => vi.unstubAllEnvs());

describe("shared WeChat login", () => {
  it("uses the existing issuer's HMAC format and keeps session tokens opaque", () => {
    expect(codeHash("123456")).toBe(createHmac("sha256", process.env.WECHAT_LOGIN_HMAC_SECRET!).update("login-code:123456").digest("hex"));
    expect(newSessionToken()).toMatch(/^[\w-]{43}$/);
    expect(requestSessionToken(request("/", { token: "forged" }))).toBeNull();
  });

  it("consumes a personal code once and creates an HttpOnly session", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await verifyCode(request("/api/auth/wechat/code/verify", { body: { code: "123456", returnTo: "/image-to-image" } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, returnTo: "/image-to-image" });
    const cookie = response.headers.get("set-cookie") || "";
    expect(cookie).toContain("agnes_session=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=lax");
    expect(fake.tables.wechat_login_codes[0].status).toBe("consumed");
    const repeated = await verifyCode(request("/api/auth/wechat/code/verify", { body: { code: "123456" } }));
    expect(repeated.status).toBe(401);
    expect(fake.tables.agnes_sessions).toHaveLength(2);
  });

  it("only lets one of two simultaneous requests consume the same code", async () => {
    const responses = await Promise.all([1, 2].map(() => verifyCode(request("/api/auth/wechat/code/verify", { body: { code: "123456" } }))));
    expect(responses.map((response) => response.status).sort()).toEqual([200, 401]);
  });

  it("rejects expired codes without creating a session", async () => {
    fake.tables.wechat_login_codes[0].expires_at = new Date(Date.now() - 1000).toISOString();
    expect((await verifyCode(request("/verify", { body: { code: "123456" } }))).status).toBe(401);
    expect(fake.tables.agnes_sessions).toHaveLength(1);
  });

  it("rejects a pending code after the shared callback revokes the account", async () => {
    fake.tables.app_accounts[0].wechat_status = "unbound";
    expect((await verifyCode(request("/verify", { body: { code: "123456" } }))).status).toBe(403);
    expect(fake.tables.agnes_sessions).toHaveLength(1);
  });

  it("rejects cross-origin login before touching the database", async () => {
    expect((await verifyCode(request("/verify", { origin: "https://attacker.example", body: { code: "123456" } }))).status).toBe(403);
    expect(fake.dbCalls).toBe(0);
  });

  it("enforces the shared database attempt limit", async () => {
    fake.rpcAllowed = false;
    expect((await verifyCode(request("/verify", { body: { code: "123456" } }))).status).toBe(429);
    expect(fake.tables.wechat_login_codes[0].status).toBe("pending");
  });
});

describe("live account authorization", () => {
  it("revokes an existing session on the next request after unsubscribe", async () => {
    expect((await getAccess(request("/", { token: sessionToken }))).allowed).toBe(true);
    fake.tables.app_accounts[0].wechat_status = "unbound";
    expect(await getAccess(request("/", { token: sessionToken }))).toMatchObject({ allowed: false, status: 403 });
  });

  it("rejects expired sessions and disabled accounts", async () => {
    fake.tables.agnes_sessions[0].expires_at = new Date(Date.now() - 1000).toISOString();
    expect(await getAccess(request("/", { token: sessionToken }))).toMatchObject({ allowed: false, status: 401 });
    fake.tables.agnes_sessions[0].expires_at = new Date(Date.now() + 60_000).toISOString();
    fake.tables.app_accounts[0].disabled_at = new Date().toISOString();
    expect(await getAccess(request("/", { token: sessionToken }))).toMatchObject({ allowed: false, status: 403, code: "ACCOUNT_DISABLED" });
  });

  it("fails closed when the database or login configuration is unavailable", async () => {
    fake.error = true;
    expect(await getAccess(request("/", { token: sessionToken }))).toMatchObject({ allowed: false, status: 503 });
    vi.stubEnv("WECHAT_LOGIN_HMAC_SECRET", "");
    expect(await getAccess(request("/"))).toMatchObject({ allowed: false, status: 503 });
  });

  it("logout invalidates the server-side session", async () => {
    expect((await logout(request("/api/auth/logout", { token: sessionToken }))).status).toBe(200);
    expect(await getAccess(request("/", { token: sessionToken }))).toMatchObject({ allowed: false, status: 401 });
  });
});

describe("business API protection", () => {
  const routes = [
    ["image generation", generateImage], ["image editing", editImage], ["chat", chat],
    ["video generation", generateVideo], ["flash generation", generateFlash], ["upload", upload],
  ] as const;
  for (const [name, handler] of routes) {
    it(`${name} rejects anonymous and revoked users before parsing the body or calling upstream`, async () => {
      expect((await handler(request("/business"))).status).toBe(401);
      fake.tables.app_accounts[0].wechat_status = "unbound";
      expect((await handler(request("/business", { token: sessionToken }))).status).toBe(403);
    });
  }

  for (const [name, handler] of [["video", videoStatus], ["flash", flashStatus]] as const) {
    it(`${name} status requires login and task ownership`, async () => {
      const params = { params: Promise.resolve({ id: "task_other-user" }) };
      expect((await handler(request("/status", { method: "GET" }), params)).status).toBe(401);
      expect((await handler(request("/status", { method: "GET", token: sessionToken }), params)).status).toBe(404);
    });
  }

  it("rejects user configuration changes and ignores legacy browser configuration", async () => {
    vi.stubEnv("AGNES_API_KEY", "admin-key");
    vi.stubEnv("AGNES_BASE_URL", "https://trusted.example");
    expect(await loadServerConfig()).toEqual({ apiKey: "admin-key", baseUrl: "https://trusted.example" });
    expect((await saveConfig(request("/api/config/save", { token: sessionToken, body: { baseUrl: "https://attacker.example" } }))).status).toBe(403);
  });

  it("blocks upstream calls when the daily quota or quota database is unavailable", async () => {
    fake.rpcAllowed = false;
    expect((await takeQuota(userId, "image"))?.status).toBe(429);
    fake.error = true;
    expect((await takeQuota(userId, "image"))?.status).toBe(503);
  });
});

describe("login redirects", () => {
  it.each(["//attacker.example", "/\\attacker.example", "https://attacker.example", "/\n/attacker.example"])("rejects unsafe return location %s", (path) => {
    expect(safeReturnTo(path)).toBe("/text-to-image");
  });
  it("preserves an internal creation route", () => expect(safeReturnTo("/image-to-image?style=ink")).toBe("/image-to-image?style=ink"));
});
