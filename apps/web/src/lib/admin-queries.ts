import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { db, events, series } from "@racehub/db";

export interface AdminEventRow {
  id: number;
  name: string;
  startsAt: Date;
  endsAt: Date | null;
  location: string | null;
  status: string;
  sourceUid: string | null;
  seriesId: number;
  seriesName: string;
  seriesShort: string;
  seriesColor: string;
}

export async function listEventsAdmin(opts: {
  seriesId?: number;
  q?: string;
  limit?: number;
}): Promise<AdminEventRow[]> {
  const conds = [];
  if (opts.seriesId) conds.push(eq(events.seriesId, opts.seriesId));
  if (opts.q) conds.push(ilike(events.name, `%${opts.q}%`));

  const rows = await db
    .select({
      id: events.id,
      name: events.name,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      location: events.location,
      status: events.status,
      sourceUid: events.sourceUid,
      seriesId: events.seriesId,
      seriesName: series.name,
      seriesShort: series.shortName,
      seriesColor: series.color,
    })
    .from(events)
    .innerJoin(series, eq(events.seriesId, series.id))
    .where(conds.length ? and(...conds) : sql`true`)
    .orderBy(desc(events.startsAt))
    .limit(opts.limit ?? 200);

  return rows;
}

export async function getEventById(id: number) {
  const [row] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return row ?? null;
}

export async function adminCounts() {
  const [row] = await db
    .select({
      events: sql<number>`count(*)`,
      upcoming: sql<number>`count(*) filter (where ${events.startsAt} > now())`,
    })
    .from(events);
  return row ?? { events: 0, upcoming: 0 };
}
