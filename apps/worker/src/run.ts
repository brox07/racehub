// One-shot CLI: `tsx src/run.ts schedules|news|all`
import { ingestSchedules } from "./ingest-schedules.js";
import { ingestNews } from "./ingest-news.js";
import { sql } from "@racehub/db";

const task = process.argv[2] ?? "all";

async function main() {
  if (task === "schedules" || task === "all") await ingestSchedules();
  if (task === "news" || task === "all") await ingestNews();
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
