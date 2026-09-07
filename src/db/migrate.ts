/**
 * Applies pending migrations: lists which ones (if any) are about to run,
 * then applies them; prints a clean "already up to date" message and exits
 * 0 when there's nothing to do.
 *
 * `drizzle-kit migrate` (the CLI) can't be configured to give us this. Every
 * run — even a no-op one where nothing is pending — has its underlying
 * postgres.js connection bootstrap the migrations-tracking table with
 * `CREATE SCHEMA/TABLE IF NOT EXISTS`, and on an already-initialized
 * database that raises two harmless NOTICEs. postgres.js's default
 * `onnotice` is `console.log`, and drizzle-kit's `dbCredentials` exposes no
 * way to override it — so those NOTICEs print as raw objects straight to
 * the console, which reads exactly like a thrown error even though the
 * migrate call fully succeeded. This script calls drizzle-orm's migrator
 * directly instead, over our own connection where we control `onnotice`, so
 * those two specific expected notices are the only thing silenced — any
 * real SQL error still throws and fails the script loudly.
 *
 * Run with: npm run db:migrate
 */
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const MIGRATIONS_FOLDER = "./src/db/migrations";
// Drizzle-orm's defaults — mirrored here (not imported) since they're not
// exported as constants, only baked into `PgDialect.migrate`.
const MIGRATIONS_SCHEMA = "drizzle";
const MIGRATIONS_TABLE = "__drizzle_migrations";

function readJournal(): { tag: string; when: number }[] {
  const journalPath = path.join(MIGRATIONS_FOLDER, "meta", "_journal.json");
  const journal = JSON.parse(fs.readFileSync(journalPath, "utf-8"));
  return journal.entries;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set (check .env.local).");
    process.exitCode = 1;
    return;
  }

  const client = postgres(databaseUrl, { onnotice: () => {}, max: 1 });

  try {
    const journal = readJournal();

    let lastAppliedAt = -1;
    try {
      const [row] = await client<{ created_at: string }[]>`
        select created_at from ${client(MIGRATIONS_SCHEMA)}.${client(MIGRATIONS_TABLE)}
        order by created_at desc limit 1
      `;
      if (row) lastAppliedAt = Number(row.created_at);
    } catch (err) {
      // undefined_table (42P01) / undefined_schema (3F000) means a fresh
      // database — every migration in the journal is pending. Anything
      // else (wrong password, unreachable host, ...) is a real failure and
      // must not be misreported as "nothing applied yet".
      const code = (err as { code?: string }).code;
      if (code !== "42P01" && code !== "3F000") throw err;
    }

    const pending = journal.filter((entry) => entry.when > lastAppliedAt);

    if (pending.length === 0) {
      console.log("Database is already up to date — nothing to migrate.");
      return;
    }

    console.log(`Applying ${pending.length} migration(s):`);
    for (const entry of pending) console.log(`  - ${entry.tag}`);

    const db = drizzle(client);
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

    console.log("Done.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
