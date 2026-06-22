import ical from "node-ical";
import { db, series, events } from "@racehub/db";
import { eq, isNotNull, and } from "drizzle-orm";
import { slugify } from "./slug.js";

interface IngestStats {
  series: string;
  fetched: number;
  upserted: number;
  error?: string;
}

/**
 * Fetch + parse the ICS feed for one series and upsert its events.
 * Idempotent: keyed on (seriesId, sourceUid) so re-runs update in place.
 */
async function ingestSeries(s: { id: number; slug: string; icsUrl: string }): Promise<IngestStats> {
  const stats: IngestStats = { series: s.slug, fetched: 0, upserted: 0 };
  try {
    const data = await ical.async.fromURL(s.icsUrl);
    const vevents = Object.values(data).filter(
      (c): c is ical.VEvent => (c as ical.CalendarComponent).type === "VEVENT",
    );
    stats.fetched = vevents.length;

    for (const ev of vevents) {
      const name = (ev.summary ?? "Untitled").toString().trim();
      const startsAt = ev.start instanceof Date ? ev.start : new Date(ev.start as unknown as string);
      if (Number.isNaN(startsAt.getTime())) continue;
      const endsAt = ev.end instanceof Date ? ev.end : ev.end ? new Date(ev.end as unknown as string) : null;
      const uid = (ev.uid ?? `${s.slug}-${startsAt.toISOString()}-${name}`).toString();

      await db
        .insert(events)
        .values({
          seriesId: s.id,
          slug: slugify(`${name}-${startsAt.getUTCFullYear()}`) || slugify(uid),
          name,
          location: ev.location ? ev.location.toString() : null,
          startsAt,
          endsAt,
          sourceUid: uid,
          sourceUrl: ev.url ? ev.url.toString() : null,
        })
        .onConflictDoUpdate({
          target: [events.seriesId, events.sourceUid],
          set: {
            name,
            location: ev.location ? ev.location.toString() : null,
            startsAt,
            endsAt,
            sourceUrl: ev.url ? ev.url.toString() : null,
            updatedAt: new Date(),
          },
        });
      stats.upserted++;
    }
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

  if (targets.length === 0) {
    console.log("[schedules] No series have an icsUrl configured yet — nothing to ingest.");
    return [];
  }

  console.log(`[schedules] Ingesting ${targets.length} series…`);
  const results: IngestStats[] = [];
  for (const t of targets) {
    const stat = await ingestSeries(t as { id: number; slug: string; icsUrl: string });
    results.push(stat);
    if (stat.error) {
      console.error(`[schedules] ${stat.series}: ERROR ${stat.error}`);
    } else {
      console.log(`[schedules] ${stat.series}: ${stat.upserted}/${stat.fetched} events`);
    }
  }
  return results;
}
