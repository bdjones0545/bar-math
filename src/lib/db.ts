import { pendingMigrations } from "../../scripts/migration-plan.mjs";

/** Which database backend is active. */
export type DbSource = "neon" | "pglite";

/**
 * Read DATABASE_URL at call time. Keep a static `process.env.DATABASE_URL`
 * access so bundlers/platforms that scan for it still inject the secret.
 * Never log the raw string — it contains the database password.
 */
function readDatabaseUrl(): string | undefined {
  if (typeof process === "undefined") return undefined;
  const fromStatic = process.env.DATABASE_URL;
  const fromBracket = process.env["DATABASE_URL"];
  const fromPostgres = process.env.POSTGRES_URL;
  const raw = [fromStatic, fromBracket, fromPostgres].find((v) => v && v.trim());
  return raw && raw.trim() ? raw.trim() : undefined;
}

/** Names only — never values — of env keys that look like database config. */
export function dbRelatedEnvKeys(): string[] {
  if (typeof process === "undefined") return [];
  return Object.keys(process.env)
    .filter((k) => /DATABASE|POSTGRES|NEON|^PG/i.test(k))
    .sort();
}

export function getDbSource(): DbSource {
  return readDatabaseUrl() ? "neon" : "pglite";
}

/**
 * Active backend: real **Neon** when `DATABASE_URL` is set (deployed / configured
 * sandbox), otherwise a local embedded **PGLite** (Postgres compiled to WASM) so
 * the app has a working database even with nothing configured — the live preview
 * included. Swap in Neon later by just setting `DATABASE_URL`; no code changes.
 *
 * Prefer getDbSource() in request handlers — this snapshot is import-time only.
 */
export const dbSource: DbSource = getDbSource();

/**
 * Minimal shared SQL surface, satisfied by both Neon and PGLite. Both the
 * tagged-template and `.query()` forms resolve to an array of row objects:
 *
 *   const sql = await getSql();
 *   const rows = await sql`select * from todos where id = ${id}`; // parameterized
 *   const rows2 = await sql.query("select * from todos where id = $1", [id]);
 */
export interface Sql {
  <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]>;
  query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<T[]>;
}

/**
 * Init state lives on globalThis as promises: dev HMR creates new instances of
 * this module, and two instances racing module-level state would open a second
 * pool or run two concurrent PGLite migration passes (whose duplicate
 * `_migrations` insert rejects — and would get memoized, poisoning every later
 * `getSql()`). A failed init clears its slot so the next call retries.
 */
const globalRef = globalThis as typeof globalThis & {
  __pgSqlPromise__?: Promise<Sql>;
  __pgliteInstance__?: Promise<import("@electric-sql/pglite").PGlite>;
  __pgliteMigrateChain__?: Promise<void>;
  __neonMigrateChain__?: Promise<void>;
};

/**
 * Result-type parity: Postgres sends every value as text plus a type OID — the
 * JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
 * int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
 * JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
 * production return identical, JSON-safe shapes:
 *   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
 *                                   `::text` if you ever need huge integers)
 *   date                         -> 'YYYY-MM-DD' string
 *   interval                     -> Postgres interval text
 * numeric already comes back as a string on both (arbitrary precision).
 */
const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;
const identity = (v: string) => v;

type Run = <T>(text: string, params: unknown[]) => Promise<T[]>;

/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
function toSql(run: Run): Sql {
  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    // Rebuild with $1, $2, … placeholders so values stay parameterized.
    let text = strings[0];
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
    return run<T>(text, values);
  }) as unknown as Sql;
  sql.query = <T = Record<string, unknown>>(text: string, params: unknown[] = []) =>
    run<T>(text, params);
  return sql;
}

function migrationFiles(): Record<string, string> {
  return import.meta.glob("/migrations/*.sql", {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>;
}

function inspectNeonUrl(raw: string): { host: string; database: string; user: string } {
  const parsed = new URL(raw);
  return {
    host: parsed.hostname,
    database: decodeURIComponent(parsed.pathname.replace(/^\//, "")).split("/")[0],
    user: decodeURIComponent(parsed.username || ""),
  };
}

function assertBarMathNeon(raw: string): void {
  const onVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
  if (!onVercel) return;
  const { host, database, user } = inspectNeonUrl(raw);
  console.log(`[db] neon host ${host} db ${database} user ${user || "(none)"}`);
  if (!host.endsWith(".neon.tech")) {
    throw new Error("DATABASE_URL is not a Neon-managed *.neon.tech endpoint");
  }
  if (database !== "neondb") {
    throw new Error(`DATABASE_URL database is ${database}, expected neondb`);
  }
  const markers = ["withered-dew", "axzrmbbk", "bitter-bar-80085503"];
  if (!markers.some((m) => host.includes(m))) {
    throw new Error(
      "DATABASE_URL host does not match dedicated BAR MATH Neon project bitter-bar-80085503",
    );
  }
}

function createNeonSql(): Promise<Sql> {
  globalRef.__pgSqlPromise__ ??= (async () => {
    const databaseUrl = readDatabaseUrl();
    if (!databaseUrl) throw new Error("DATABASE_URL missing on Neon path");
    assertBarMathNeon(databaseUrl);
    // Regular Postgres driver: node-postgres (`pg`) — works directly with Neon's
    // pooled endpoint. One pool per process; warm serverless instances reuse it.
    const { Pool, types } = await import("pg");
    types.setTypeParser(OID_INT8, Number);
    types.setTypeParser(OID_DATE, identity);
    types.setTypeParser(OID_INTERVAL, identity);
    const pool = new Pool({ connectionString: databaseUrl });

    const migrate = async (): Promise<void> => {
      const client = await pool.connect();
      try {
        const live = await client.query("select current_database() as db");
        const liveDb = live.rows[0]?.db;
        console.log(`[db] connected database ${liveDb}`);
        if (liveDb !== "neondb") {
          throw new Error(`connected database is ${liveDb}, expected neondb`);
        }
        await client.query(
          "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
        );
        const migrations = migrationFiles();
        const doneRows = await client.query<{ name: string }>("select name from _migrations");
        const done = doneRows.rows.map((r) => r.name);
        for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) {
          try {
            await client.query("BEGIN");
            await client.query(migrations[path]);
            await client.query("INSERT INTO _migrations (name) VALUES ($1)", [name]);
            await client.query("COMMIT");
            console.log(`[db] applied ${name}`);
          } catch (err) {
            try {
              await client.query("ROLLBACK");
            } catch {
              // keep original
            }
            throw err;
          }
        }
        const tables = await client.query<{ table_name: string }>(
          `select table_name from information_schema.tables
           where table_schema = 'public' and table_name in ('lb_rounds','lb_scores','lb_rate')
           order by table_name`,
        );
        const names = tables.rows.map((r) => r.table_name);
        console.log(`[db] leaderboard tables: ${names.join(",") || "(none)"}`);
      } finally {
        client.release();
      }
    };
    const pass = (globalRef.__neonMigrateChain__ ?? Promise.resolve())
      .catch(() => undefined)
      .then(migrate);
    globalRef.__neonMigrateChain__ = pass;
    await pass;

    return toSql(async <T>(text: string, params: unknown[]) => {
      const res = await pool.query(text, params);
      return res.rows as T[];
    });
  })().catch((err) => {
    globalRef.__pgSqlPromise__ = undefined;
    throw err;
  });
  return globalRef.__pgSqlPromise__;
}

async function createPgliteSql(): Promise<Sql> {
  // Embedded Postgres, imported on demand so it never loads on the Neon path.
  // One in-memory instance per process, shared across HMR module instances, so
  // data survives source edits (it resets on dev-server restart).
  globalRef.__pgliteInstance__ ??= (async () => {
    const { PGlite } = await import("@electric-sql/pglite");
    const pg = new PGlite({
      parsers: {
        [OID_INT8]: Number,
        [OID_DATE]: identity,
        [OID_INTERVAL]: identity,
      },
    });
    await pg.waitReady;
    await pg.exec(
      "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    return pg;
  })().catch((err) => {
    globalRef.__pgliteInstance__ = undefined;
    throw err;
  });
  const pg = await globalRef.__pgliteInstance__;

  // Apply migrations/ (the single schema source) so preview matches production.
  // SQL is inlined by the bundler via import.meta.glob (no runtime fs); applied
  // files are tracked in _migrations. The glob does not descend, so the opt-in
  // auth schema under migrations/auth/ stays out. Runs once per module instance
  // — so an HMR reload after adding a migration file applies it live — with
  // passes serialized on a global chain so concurrent callers never
  // double-apply.
  const migrate = async (): Promise<void> => {
    const migrations = import.meta.glob("/migrations/*.sql", {
      query: "?raw",
      import: "default",
      eager: true,
    }) as Record<string, string>;
    const doneRows = await pg.query<{ name: string }>(
      "select name from _migrations",
    );
    const done = doneRows.rows.map((r) => r.name);
    for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) {
      // Apply + record atomically (parity with scripts/migrate.mjs) so a failed
      // statement can't leave a file half-applied but untracked.
      await pg.transaction(async (tx) => {
        await tx.exec(migrations[path]);
        await tx.query("insert into _migrations (name) values ($1)", [name]);
      });
    }
  };
  const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve())
    .catch(() => undefined) // an earlier failed pass must not wedge the chain
    .then(migrate);
  globalRef.__pgliteMigrateChain__ = pass;
  await pass;

  return toSql(async <T>(text: string, params: unknown[]) => {
    const result = await pg.query<T>(text, params);
    return result.rows;
  });
}

let sqlPromise: Promise<Sql> | null = null;

async function createSql(): Promise<Sql> {
  if (typeof window !== "undefined") {
    throw new Error(
      "@/lib/db is server-only — call getSql() from a createServerFn handler " +
        "or a server route loader, never from client code.",
    );
  }
  return getDbSource() === "neon" ? createNeonSql() : createPgliteSql();
}

/**
 * Get the shared, **server-only** SQL client. Neon when `DATABASE_URL` is set,
 * otherwise the local PGLite fallback. Memoized — safe to call per request.
 *
 * Schema comes from `migrations/*.sql`, auto-applied before the first query on
 * both backends — define tables there, never inline in server functions.
 */
export function getSql(): Promise<Sql> {
  sqlPromise ??= createSql().catch((err) => {
    sqlPromise = null; // don't memoize failures — let the next call retry
    throw err;
  });
  return sqlPromise;
}

/**
 * The shared PGLite instance (preview only), with `migrations/*.sql` applied.
 * Lets Better Auth persist to the SAME embedded DB as app data in preview (via a
 * Kysely dialect). Throws when `DATABASE_URL` is set (that path uses Neon).
 */
export async function getPglite(): Promise<import("@electric-sql/pglite").PGlite> {
  if (getDbSource() !== "pglite") {
    throw new Error("getPglite() is only available on the PGLite fallback (no DATABASE_URL)");
  }
  await getSql();
  const pg = await globalRef.__pgliteInstance__;
  if (!pg) throw new Error("PGLite instance failed to initialize");
  return pg;
}

/**
 * Finish DB bootstrap before the server handles traffic.
 *
 * - **PGLite** (preview / no `DATABASE_URL`): open the in-memory DB and apply
 *   `migrations/*.sql`. Idempotent — concurrent callers share one promise.
 * - **Neon**: no-op (pool is created lazily on first query).
 *
 * Vite `configureServer` awaits this at dev startup; production imports of this
 * module kick it off immediately (see bottom of file).
 */
export function ensureDbReady(): Promise<void> {
  if (getDbSource() !== "pglite") return Promise.resolve();
  return getSql().then(() => undefined);
}

// Server-only eager start: kick PGLite bootstrap as soon as this module loads in
// Node. Client bundles never hit this path (`getSql` throws in the browser).
const globalBoot = globalThis as typeof globalThis & {
  __pgBootstrapPromise__?: Promise<void>;
};
if (typeof window === "undefined" && getDbSource() === "pglite") {
  globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
    globalBoot.__pgBootstrapPromise__ = undefined;
    console.error("[db] PGLite bootstrap failed:", err);
    throw err;
  });
}
