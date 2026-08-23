#!/usr/bin/env node
/**
 * Deploy-time database migrator (node-postgres, `pg`).
 *
 * Runs during `npm run build` — on every Vercel deploy — applying pending files
 * in ../migrations to DATABASE_URL. Each file is applied in one transaction and
 * recorded in a `_migrations` table, so it runs once and is safe to re-run.
 *
 * The read is non-recursive, so the opt-in auth schema under migrations/auth/
 * is not applied to an app that never asked for sign-in.
 *
 * No DATABASE_URL (local / preview builds) -> skip; the PGLite fallback applies
 * the same files at startup instead (see src/lib/db.ts).
 */
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { pendingMigrations } from "./migration-plan.mjs";

const BAR_MATH_HOST_MARKERS = ["withered-dew", "axzrmbbk", "bitter-bar-80085503"];
const EXPECTED_DB = "neondb";

function inspectDatabaseUrl(raw) {
  const parsed = new URL(raw);
  const host = parsed.hostname;
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, "")).split("/")[0];
  const user = decodeURIComponent(parsed.username || "");
  return { host, database, user };
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  const onVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
  if (onVercel) {
    console.error(
      "[migrate] DATABASE_URL not set on Vercel — refusing to skip. Production leaderboards require Neon, not PGLite.",
    );
    process.exit(1);
  }
  console.log(
    "[migrate] DATABASE_URL not set — skipping (the PGLite fallback migrates itself).",
  );
  process.exit(0);
}

let identity;
try {
  identity = inspectDatabaseUrl(databaseUrl);
} catch {
  console.error("[migrate] DATABASE_URL is not a valid URL.");
  process.exit(1);
}

console.log(
  `[migrate] using host ${identity.host} db ${identity.database} user ${identity.user || "(none)"}`,
);

const onVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
if (onVercel) {
  if (!identity.host.endsWith(".neon.tech")) {
    console.error("[migrate] host is not a Neon-managed *.neon.tech endpoint — refusing to migrate.");
    process.exit(1);
  }
  if (identity.database !== EXPECTED_DB) {
    console.error(`[migrate] database is ${identity.database}, expected ${EXPECTED_DB} — refusing to migrate.`);
    process.exit(1);
  }
  const hostMatch = BAR_MATH_HOST_MARKERS.some((m) => identity.host.includes(m));
  if (!hostMatch) {
    console.error(
      "[migrate] host does not match dedicated BAR MATH Neon project bitter-bar-80085503 / branch br-withered-dew-axzrmbbk — refusing to migrate.",
    );
    process.exit(1);
  }
  console.log("[migrate] BAR MATH Neon identity check passed.");
}

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

async function main() {
  let entries;
  try {
    entries = await readdir(migrationsDir);
  } catch {
    console.log("[migrate] no migrations/ directory — nothing to do.");
    return;
  }
  // An app with no schema of its own must not pay for a database connection.
  if (pendingMigrations(entries, []).length === 0) {
    console.log("[migrate] no migrations — nothing to do.");
    return;
  }

  const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
  const client = await pool.connect();
  try {
    const live = await client.query("select current_database() as db, current_user as usr");
    const liveDb = live.rows[0]?.db;
    const liveUser = live.rows[0]?.usr;
    console.log(`[migrate] connected db ${liveDb} user ${liveUser}`);
    if (onVercel && liveDb !== EXPECTED_DB) {
      throw new Error(`connected database is ${liveDb}, expected ${EXPECTED_DB}`);
    }

    await client.query(
      "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
    );
    const applied = (await client.query("SELECT name FROM _migrations")).rows.map(
      (r) => r.name,
    );

    let count = 0;
    for (const { name } of pendingMigrations(entries, applied)) {
      const text = await readFile(join(migrationsDir, name), "utf8");
      try {
        await client.query("BEGIN");
        // pg's simple-query protocol runs a whole multi-statement file at once.
        await client.query(text);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [name]);
        await client.query("COMMIT");
      } catch (err) {
        console.error(`[migrate] error applying ${name}`);
        try {
          await client.query("ROLLBACK");
        } catch {
          // ROLLBACK fails when the connection died — keep the original error.
        }
        throw err;
      }
      console.log(`[migrate] applied ${name}`);
      count += 1;
    }
    const tables = await client.query(
      `select table_name from information_schema.tables
       where table_schema = 'public' and table_name in ('lb_rounds','lb_scores','lb_rate')
       order by table_name`,
    );
    const names = tables.rows.map((r) => r.table_name);
    console.log(`[migrate] leaderboard tables: ${names.join(",") || "(none)"}`);
    if (onVercel && (names.length !== 3 || !["lb_rate", "lb_rounds", "lb_scores"].every((t) => names.includes(t)))) {
      throw new Error("leaderboard tables missing after migrate");
    }
    console.log(count ? `[migrate] done — ${count} migration(s) applied.` : "[migrate] up to date.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[migrate] failed:", err?.message || err);
  // pg errors carry the context needed to debug a bad SQL file.
  for (const key of ["code", "detail", "hint", "position", "where"]) {
    if (err?.[key] != null) console.error(`[migrate]   ${key}: ${err[key]}`);
  }
  process.exit(1);
});
