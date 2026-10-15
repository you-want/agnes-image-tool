import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

function literal(value) { return `'${value.replaceAll("'", "''")}'`; }

// Keep a separate migration ledger: sharing authentication with yanhuofood
// must not rewrite its Supabase CLI migration history.
export function migrationQuery(version, sql) {
  const checksum = createHash("sha256").update(sql).digest("hex");
  return `BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('agnes-schema-migrations', 0));
CREATE TABLE IF NOT EXISTS public.agnes_schema_migrations (
  version TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
REVOKE ALL ON public.agnes_schema_migrations FROM PUBLIC, anon, authenticated;
DO $agnes_apply$
BEGIN
  IF EXISTS (SELECT 1 FROM public.agnes_schema_migrations WHERE version = ${literal(version)}) THEN
    IF NOT EXISTS (SELECT 1 FROM public.agnes_schema_migrations WHERE version = ${literal(version)} AND checksum = ${literal(checksum)}) THEN
      RAISE EXCEPTION 'Previously applied Agnes migration was modified';
    END IF;
    RETURN;
  END IF;
  EXECUTE ${literal(sql)};
  INSERT INTO public.agnes_schema_migrations(version, checksum) VALUES (${literal(version)}, ${literal(checksum)});
END;
$agnes_apply$;
COMMIT;`;
}

async function deploy() {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  const project = process.env.SUPABASE_PROJECT_REF?.trim();
  if (!token || !project || !/^[a-z0-9]+$/.test(project)) throw new Error("Configure SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF");
  const directory = resolve("supabase/migrations");
  const files = (await readdir(directory)).filter((name) => /^\d+_[a-z0-9_]+\.sql$/.test(name)).sort();
  for (const file of files) {
    const sql = await readFile(resolve(directory, file), "utf8");
    const response = await fetch(`https://api.supabase.com/v1/projects/${project}/database/query`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: migrationQuery(file, sql) }), signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) throw new Error(`Migration ${file} failed (HTTP ${response.status}); inspect the Supabase database logs`);
    console.log(`Verified migration: ${file}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  deploy().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
