import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://racehub:racehub@localhost:5432/racehub";

// Reuse a single connection across hot reloads in dev.
const globalForDb = globalThis as unknown as { __racehub_sql?: ReturnType<typeof postgres> };

const sql = globalForDb.__racehub_sql ?? postgres(connectionString, { max: 10 });
if (process.env.NODE_ENV !== "production") globalForDb.__racehub_sql = sql;

export const db = drizzle(sql, { schema, casing: "snake_case" });
export type Db = typeof db;
export { sql };
