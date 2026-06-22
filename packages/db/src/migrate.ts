import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://racehub:racehub@localhost:5432/racehub";

const sql = postgres(connectionString, { max: 1 });

async function main() {
  console.log("Running migrations…");
  await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
  console.log("Migrations complete.");
  await sql.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
