import { db, series, upsertWeekends, type Weekend, type ParsedSession } from "@racehub/db";
import { eq } from "drizzle-orm";

const CALENDAR_URL = "https://www.gt-world-challenge.com/calendar?filter_season_id=8";

const MONTHS: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
};

interface IngestStats {
  series: string;
  fetched: number;
  weekends: number;
  sessions: number;
  error?: string;
}

function decodeHtml(str: string): string {
  return str
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&uuml;/g, "ü")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&eacute;/g, "é")
    .replace(/&Eacute;/g, "É")
    .replace(/&auml;/g, "ä")
    .replace(/&Auml;/g, "Ä")
    .replace(/&ouml;/g, "ö")
    .replace(/&Ouml;/g, "Ö");
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function ingestGtwc(): Promise<IngestStats[]> {
  const results: IngestStats[] = [];
  try {
    const res = await fetch(CALENDAR_URL);
    if (!res.ok) {
      throw new Error(`Failed to fetch GTWC calendar: ${res.statusText}`);
    }
    const html = await res.text();
    
    // Split into event list items
    const chunks = html.split('<li class="calendar__list-item">');
    // Drop first chunk as it is everything before the first <li>
    chunks.shift();

    // We'll collect events grouped by subseries slug
    const eventsBySubseries = new Map<string, Weekend[]>();

    for (const chunk of chunks) {
      // 1. Extract dates
      const startMatch = chunk.match(/<div class="calendar__date-start">([\s\S]*?)<\/div>/);
      const endMatch = chunk.match(/<div class="calendar__date-end">([\s\S]*?)<\/div>/);
      
      if (!startMatch) continue;

      const parseDate = (block: string) => {
        const dMatch = block.match(/class="calendar__date-number"[^>]*>\s*(\d+)/);
        const mMatch = block.match(/class="calendar__date-month"[^>]*>\s*([A-Za-z]+)/);
        const yMatch = block.match(/class="calendar__date-year"[^>]*>\s*(\d+)/);
        if (dMatch && mMatch && yMatch) {
          const day = parseInt(dMatch[1], 10);
          const monthStr = mMatch[1].toUpperCase();
          const year = parseInt(yMatch[1], 10);
          const month = MONTHS[monthStr] ?? 0;
          return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
        }
        return null;
      };

      const startsAt = parseDate(startMatch[1]);
      if (!startsAt) continue;

      let endsAt = endMatch ? parseDate(endMatch[1]) : null;
      if (!endsAt) {
        endsAt = new Date(startsAt);
      }
      // Set endsAt to end of that day
      endsAt.setUTCHours(23, 59, 59, 999);

      // 2. Extract circuit/event name
      const circuitMatch = chunk.match(/<h3 class="calendar__race-header">([\s\S]*?)<\/h3>/);
      if (!circuitMatch) continue;
      const circuitName = decodeHtml(circuitMatch[1].trim());

      // 3. Extract country (optional)
      const countryMatch = chunk.match(/class="calendar__race-subheading-text"[^>]*>([\s\S]*?)<\/span>/);
      const country = countryMatch ? decodeHtml(countryMatch[1].trim()) : null;

      // 4. Extract race text (which subseries it belongs to)
      const raceTextMatch = chunk.match(/class="calendar__race-text"[^>]*>([\s\S]*?)<\/span>/);
      if (!raceTextMatch) continue;
      const raceText = decodeHtml(raceTextMatch[1].trim());

      // Determine subseries slug
      let subseriesSlug = "";
      if (/america/i.test(raceText)) {
        subseriesSlug = "gtwc-america";
      } else if (/europe/i.test(raceText)) {
        subseriesSlug = "gtwc-europe";
      } else if (/asia/i.test(raceText)) {
        subseriesSlug = "gtwc-asia";
      } else if (/australia/i.test(raceText)) {
        subseriesSlug = "gtwc-australia";
      } else {
        subseriesSlug = "gt-world-challenge";
      }

      // 5. Create sessions
      const sessions: ParsedSession[] = [];
      const diffDays = Math.round((endsAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24));
      
      const eventIdStr = slugify(circuitName);
      
      if (diffDays >= 2) {
        // 3+ days: Practice (Day 1), Qualifying (Day 2), Race (Day 3)
        const pDate = new Date(startsAt);
        pDate.setUTCHours(10, 0, 0, 0);
        sessions.push({
          name: "Practice",
          kind: "practice",
          startsAt: pDate,
          endsAt: new Date(pDate.getTime() + 60 * 60 * 1000),
          sourceUid: `gtwc-${eventIdStr}-practice`,
        });

        const qDate = new Date(startsAt);
        qDate.setUTCDate(startsAt.getUTCDate() + 1);
        qDate.setUTCHours(10, 0, 0, 0);
        sessions.push({
          name: "Qualifying",
          kind: "qualifying",
          startsAt: qDate,
          endsAt: new Date(qDate.getTime() + 45 * 60 * 1000),
          sourceUid: `gtwc-${eventIdStr}-qualifying`,
        });

        const rDate = new Date(endsAt);
        rDate.setUTCHours(13, 0, 0, 0);
        sessions.push({
          name: "Race",
          kind: "race",
          startsAt: rDate,
          endsAt: new Date(rDate.getTime() + 3 * 60 * 60 * 1000),
          sourceUid: `gtwc-${eventIdStr}-race`,
        });
      } else if (diffDays === 1) {
        // 2 days: Qualifying (Day 1), Race (Day 2)
        const qDate = new Date(startsAt);
        qDate.setUTCHours(10, 0, 0, 0);
        sessions.push({
          name: "Qualifying",
          kind: "qualifying",
          startsAt: qDate,
          endsAt: new Date(qDate.getTime() + 45 * 60 * 1000),
          sourceUid: `gtwc-${eventIdStr}-qualifying`,
        });

        const rDate = new Date(endsAt);
        rDate.setUTCHours(13, 0, 0, 0);
        sessions.push({
          name: "Race",
          kind: "race",
          startsAt: rDate,
          endsAt: new Date(rDate.getTime() + 3 * 60 * 60 * 1000),
          sourceUid: `gtwc-${eventIdStr}-race`,
        });
      } else {
        // 1 day: Race
        const rDate = new Date(startsAt);
        rDate.setUTCHours(13, 0, 0, 0);
        sessions.push({
          name: "Race",
          kind: "race",
          startsAt: rDate,
          endsAt: new Date(rDate.getTime() + 3 * 60 * 60 * 1000),
          sourceUid: `gtwc-${eventIdStr}-race`,
        });
      }

      const weekend: Weekend = {
        name: circuitName,
        startsAt,
        endsAt,
        location: country ? `${circuitName}, ${country}` : circuitName,
        sourceUid: `gtwc-${eventIdStr}-${startsAt.getUTCFullYear()}`,
        sessions,
      };

      let list = eventsBySubseries.get(subseriesSlug);
      if (!list) {
        list = [];
        eventsBySubseries.set(subseriesSlug, list);
      }
      list.push(weekend);
    }

    // Upsert events for each subseries
    for (const [subseriesSlug, weekends] of eventsBySubseries.entries()) {
      const [seriesRow] = await db
        .select({ id: series.id })
        .from(series)
        .where(eq(series.slug, subseriesSlug));

      if (seriesRow) {
        try {
          const res = await upsertWeekends(seriesRow.id, weekends);
          results.push({
            series: subseriesSlug,
            fetched: weekends.length,
            weekends: res.weekends,
            sessions: res.sessions,
          });
        } catch (err) {
          results.push({
            series: subseriesSlug,
            fetched: weekends.length,
            weekends: 0,
            sessions: 0,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      } else {
        console.warn(`[gtwc] Warning: Series with slug "${subseriesSlug}" not found in database.`);
      }
    }
  } catch (error) {
    console.error("[gtwc] Error during ingest:", error);
    results.push({
      series: "gt-world-challenge",
      fetched: 0,
      weekends: 0,
      sessions: 0,
      error: error instanceof Error ? error.message : String(error),
    });
  }
  return results;
}
