import cron from "node-cron";
import { ingestSchedules } from "./ingest-schedules.js";
import { ingestNews } from "./ingest-news.js";

const INGEST_CRON = process.env.INGEST_CRON ?? "0 */6 * * *";
const NEWS_CRON = process.env.NEWS_CRON ?? "0 * * * *";

let scheduleRunning = false;
let newsRunning = false;

async function runSchedules() {
  if (scheduleRunning) return;
  scheduleRunning = true;
  try {
    await ingestSchedules();
  } catch (err) {
    console.error("[schedules] run failed:", err);
  } finally {
    scheduleRunning = false;
  }
}

async function runNews() {
  if (newsRunning) return;
  newsRunning = true;
  try {
    await ingestNews();
  } catch (err) {
    console.error("[news] run failed:", err);
  } finally {
    newsRunning = false;
  }
}

console.log(`[worker] starting. schedules="${INGEST_CRON}" news="${NEWS_CRON}"`);

cron.schedule(INGEST_CRON, runSchedules);
cron.schedule(NEWS_CRON, runNews);

// Kick once on boot so a fresh stack populates immediately.
runSchedules();
runNews();
