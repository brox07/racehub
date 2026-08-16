import ical from "node-ical";
import { db, series, type RawVEvent, groupIntoWeekends, upsertWeekends } from "@racehub/db";
import { eq, isNotNull, and } from "drizzle-orm";
import { ingestGtwc } from "./ingest-gtwc.js";

interface IngestStats {
  series: string;
  fetched: number;
  weekends: number;
  sessions: number;
  error?: string;
}

/**
 * Fetch + parse the ICS feed for one series, group its sessions into race
 * weekends, and upsert them. Idempotent across re-runs.
 */
async function ingestSeries(s: { id: number; slug: string; icsUrl: string }): Promise<IngestStats> {
  const stats: IngestStats = { series: s.slug, fetched: 0, weekends: 0, sessions: 0 };
  try {
    const data = await ical.async.fromURL(s.icsUrl);
    const vevents = Object.values(data).filter(
      (c): c is ical.VEvent => (c as ical.CalendarComponent).type === "VEVENT",
    );
    stats.fetched = vevents.length;

    const raw: RawVEvent[] = vevents.map((ev) => ({
      summary: (ev.summary ?? "Untitled").toString().trim(),
      start: ev.start instanceof Date ? ev.start : new Date(ev.start as unknown as string),
      end: ev.end instanceof Date ? ev.end : ev.end ? new Date(ev.end as unknown as string) : null,
      uid: (ev.uid ?? "").toString(),
      location: ev.location ? ev.location.toString() : null,
    }));

    const weekends = groupIntoWeekends(raw);
    const res = await upsertWeekends(s.id, weekends);
    stats.weekends = res.weekends;
    stats.sessions = res.sessions;
  } catch (err) {
    stats.error = err instanceof Error ? err.message : String(err);
  }
  return stats;
}

export async function ingestSchedules(): Promise<IngestStats[]> {
  const targets = await db
    .select({ id: series.id, slug: series.slug, icsUrl: series.icsUrl })
    .from(series)
    .where(and(eq(series.active, true), isNotNull(series.icsUrl)));

  const results: IngestStats[] = [];

  if (targets.length > 0) {
    console.log(`[schedules] Ingesting ${targets.length} series via ICS…`);
    for (const t of targets) {
      const stat = await ingestSeries(t as { id: number; slug: string; icsUrl: string });
      results.push(stat);
      if (stat.error) {
        console.error(`[schedules] ${stat.series}: ERROR ${stat.error}`);
      } else {
        console.log(
          `[schedules] ${stat.series}: ${stat.weekends} weekends, ${stat.sessions} sessions (${stat.fetched} entries)`,
        );
      }
    }
  } else {
    console.log("[schedules] No series have an icsUrl configured yet.");
  }

  // Ingest GTWC calendar using the scraper
  console.log("[schedules] Ingesting GTWC series via scraper...");
  try {
    const gtwcStats = await ingestGtwc();
    results.push(...gtwcStats);
    for (const stat of gtwcStats) {
      if (stat.error) {
        console.error(`[schedules] ${stat.series}: ERROR ${stat.error}`);
      } else {
        console.log(
          `[schedules] ${stat.series}: ${stat.weekends} weekends, ${stat.sessions} sessions (${stat.fetched} entries)`,
        );
      }
    }
  } catch (err) {
    console.error("[schedules] GTWC scraper failed:", err);
  }

  return results;
}
