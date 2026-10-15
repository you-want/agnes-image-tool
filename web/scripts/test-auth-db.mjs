import assert from "node:assert/strict";
import { execFile, execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { migrationQuery } from "../../scripts/deploy-auth-database.mjs";

const exec = promisify(execFile);
const temporary = mkdtempSync(join(tmpdir(), "agnes-auth-db-"));
const dataDir = join(temporary, "data");
const port = String(55000 + Math.floor(Math.random() * 900));
const args = ["-X", "-v", "ON_ERROR_STOP=1", "-h", temporary, "-p", port, "-d", "postgres", "-tA"];
const user1 = "11111111-1111-1111-1111-111111111111";
const user2 = "22222222-2222-2222-2222-222222222222";
function query(sql) { return execFileSync("psql", [...args, "-c", sql], { encoding: "utf8" }).trim(); }
async function queryAsync(sql) { return (await exec("psql", [...args, "-c", sql])).stdout.trim(); }
let started = false;

try {
  execFileSync("initdb", ["-D", dataDir, "--auth=trust", "--no-locale"], { stdio: "pipe" });
  execFileSync("pg_ctl", ["-D", dataDir, "-l", join(temporary, "postgres.log"), "-o", `-F -k ${temporary} -p ${port} -h ''`, "-w", "start"], { stdio: "pipe" });
  started = true;
  query(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE TABLE public.app_accounts(user_id uuid PRIMARY KEY REFERENCES auth.users(id), wechat_openid text, wechat_status text, disabled_at timestamptz);
    CREATE TABLE public.wechat_login_codes(id uuid PRIMARY KEY, code_hash text UNIQUE, user_id uuid, wechat_openid text, status text, expires_at timestamptz);
    INSERT INTO auth.users VALUES ('${user1}'), ('${user2}');
    INSERT INTO app_accounts VALUES ('${user1}', 'wx1', 'following', null), ('${user2}', 'wx2', 'following', null);`);
  const sql = readFileSync(resolve("../supabase/migrations/20261015000000_agnes_wechat_access.sql"), "utf8");
  const migration = migrationQuery("20261015000000_agnes_wechat_access.sql", sql);
  query(migration);
  query(migration); // Reapplying a deployed version must be harmless.
  assert.equal(query("SELECT count(*) FROM agnes_schema_migrations"), "1");
  assert.equal(query("SELECT has_table_privilege('anon', 'agnes_sessions', 'SELECT')"), "f");
  assert.equal(query("SELECT has_function_privilege('authenticated', 'agnes_take_daily_quota(uuid,text,integer,integer)', 'EXECUTE')"), "f");
  assert.equal(query("SELECT has_function_privilege('service_role', 'agnes_take_daily_quota(uuid,text,integer,integer)', 'EXECUTE')"), "t");

  const attempts = await Promise.all(Array.from({ length: 16 }, () => queryAsync(`SELECT allowed FROM agnes_take_login_attempt('${"a".repeat(64)}')`)));
  assert.equal(attempts.filter((value) => value === "t").length, 8, "concurrent login budget must allow exactly 8 attempts");

  const usage = await Promise.all(Array.from({ length: 24 }, (_, index) => queryAsync(`SELECT allowed FROM agnes_take_daily_quota('${index % 2 ? user1 : user2}', 'image', 7, 10)`)));
  assert.equal(usage.filter((value) => value === "t").length, 10, "global quota must not overspend under concurrency");
  assert.equal(query("SELECT sum(submissions) FROM agnes_daily_usage WHERE kind = 'image'"), "10");
  assert.ok(Number(query("SELECT max(submissions) FROM agnes_daily_usage WHERE kind = 'image'")) <= 7, "user quota must not overspend");
  assert.equal(query("SELECT bool_and(day = (now() AT TIME ZONE 'Asia/Shanghai')::date) FROM agnes_daily_usage"), "t");
  assert.equal(query(`SELECT reason FROM agnes_take_daily_quota('${user1}', 'video', 0, 100)`), "user_limit");
  query(`UPDATE app_accounts SET wechat_status = 'unbound' WHERE user_id = '${user1}'`);
  assert.equal(query(`SELECT reason FROM agnes_take_daily_quota('${user1}', 'chat', 50, 100)`), "access_denied");

  query(`INSERT INTO wechat_login_codes VALUES ('33333333-3333-3333-3333-333333333333', 'code-hash', '${user2}', 'wx2', 'pending', now() + interval '10 minutes')`);
  const claims = await Promise.all(Array.from({ length: 12 }, () => queryAsync("WITH claimed AS (UPDATE wechat_login_codes SET status = 'consuming' WHERE code_hash = 'code-hash' AND status = 'pending' AND expires_at > now() RETURNING id) SELECT count(*) FROM claimed")));
  assert.equal(claims.filter((count) => count === "1").length, 1, "a shared code must be claimable exactly once");

  query(`INSERT INTO agnes_sessions VALUES (repeat('b', 64), '${user2}', now() - interval '1 second', now()); SELECT agnes_cleanup_auth_artifacts()`);
  assert.equal(query("SELECT count(*) FROM agnes_sessions"), "0");
  console.log("Auth database integration checks passed: migration, roles, concurrent one-time codes, login limits, per-user/global quotas, revocation, cleanup.");
} finally {
  if (started) execFileSync("pg_ctl", ["-D", dataDir, "-m", "immediate", "-w", "stop"], { stdio: "pipe" });
  rmSync(temporary, { recursive: true, force: true });
}
