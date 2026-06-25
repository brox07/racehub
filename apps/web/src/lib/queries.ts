import { and, asc, desc, eq, inArray, lte, sql } from "drizzle-orm";
import {
  db,
  series,
  events,
  eventSessions,
  results,
  userPreferences,
  newsItems,
  type SessionKind,
} from "@racehub/db";
import { auth } from "@/auth";

export type SeriesRow = typeof series.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type SessionRow = typeof eventSessions.$inferSelect;

export async function getAllSeries(): Promise<SeriesRow[]> {
  return db.select().from(series).where(eq(series.active, true)).orderBy(asc(series.sortOrder), asc(series.name));
}

export interface ScheduleFilters {
  categories?: string[];
  regions?: string[];
  seriesIds?: number[];
  kinds?: SessionKind[];
  from?: Date;
  to?: Date;
  limit?: number;
}

export interface UpcomingEvent extends EventRow {
  seriesName: string;
  seriesShort: string;
  seriesSlug: string;
  seriesColor: string;
  seriesCategory: string;
  sessions: SessionRow[];
}

/** Fetch sessions for the given event ids, optionally filtered by kind. */
async function sessionsFor(eventIds: number[], kinds?: SessionKind[]): Promise<Map<number, SessionRow[]>> {
  const map = new Map<number, SessionRow[]>();
  if (eventIds.length === 0) return map;
  const conds = [inArray(eventSessions.eventId, eventIds)];
  if (kinds?.length) conds.push(inArray(eventSessions.kind, kinds));
  const rows = await db
    .select()
    .from(eventSessions)
    .where(and(...conds))
    .orderBy(asc(eventSessions.startsAt));
  for (const r of rows) {
    const list = map.get(r.eventId);
    if (list) list.push(r);
    else map.set(r.eventId, [r]);
  }
  return map;
}

export async function getUpcomingEvents(filters: ScheduleFilters = {}): Promise<UpcomingEvent[]> {
  const from = filters.from ?? new Date();
  // A weekend stays "upcoming" until its last session ends.
  const conds = [sql`coalesce(${events.endsAt}, ${events.startsAt}) >= ${from.toISOString()}`, eq(series.active, true)];
  if (filters.to) conds.push(lte(events.startsAt, filters.to));
  if (filters.categories?.length) conds.push(inArray(series.category, filters.categories as never[]));
  if (filters.regions?.length) conds.push(inArray(series.region, filters.regions));
  if (filters.seriesIds?.length) conds.push(inArray(events.seriesId, filters.seriesIds));

  const rows = await db
    .select({
      event: events,
      seriesName: series.name,
      seriesShort: series.shortName,
      seriesSlug: series.slug,
      seriesColor: series.color,
      seriesCategory: series.category,
    })
    .from(events)
    .innerJoin(series, eq(events.seriesId, series.id))
    .where(and(...conds))
    .orderBy(asc(events.startsAt))
    .limit(filters.limit ?? 200);

  const sessions = await sessionsFor(rows.map((r) => r.event.id), filters.kinds);

  const mapped = rows.map((r) => ({
    ...r.event,
    seriesName: r.seriesName,
    seriesShort: r.seriesShort,
    seriesSlug: r.seriesSlug,
    seriesColor: r.seriesColor,
    seriesCategory: r.seriesCategory,
    sessions: sessions.get(r.event.id) ?? [],
  }));

  // When a kind filter is active, hide weekends with no matching session.
  return filters.kinds?.length ? mapped.filter((e) => e.sessions.length > 0) : mapped;
}

export async function getSeriesBySlug(slug: string) {
  const [row] = await db.select().from(series).where(eq(series.slug, slug)).limit(1);
  return row ?? null;
}

export interface ScheduledEvent extends EventRow {
  sessions: SessionRow[];
}

export async function getSeriesSchedule(seriesId: number, kinds?: SessionKind[]) {
  const now = new Date();
  const upcomingRows = await db
    .select()
    .from(events)
    .where(and(eq(events.seriesId, seriesId), sql`coalesce(${events.endsAt}, ${events.startsAt}) >= ${now.toISOString()}`))
    .orderBy(asc(events.startsAt));
  const pastRows = await db
    .select()
    .from(events)
    .where(and(eq(events.seriesId, seriesId), sql`coalesce(${events.endsAt}, ${events.startsAt}) < ${now.toISOString()}`))
    .orderBy(desc(events.startsAt))
    .limit(10);

  const sessions = await sessionsFor([...upcomingRows, ...pastRows].map((e) => e.id), kinds);
  const attach = (e: EventRow): ScheduledEvent => ({ ...e, sessions: sessions.get(e.id) ?? [] });

  let upcoming = upcomingRows.map(attach);
  if (kinds?.length) upcoming = upcoming.filter((e) => e.sessions.length > 0);
  return { upcoming, past: pastRows.map(attach) };
}

export async function getEventResults(eventId: number) {
  return db.select().from(results).where(eq(results.eventId, eventId)).orderBy(asc(results.position));
}

export async function getRecentNews(seriesId?: number, limit = 30) {
  const conds = seriesId ? [eq(newsItems.seriesId, seriesId)] : [];
  return db
    .select({ item: newsItems, seriesSlug: series.slug, seriesShort: series.shortName, seriesColor: series.color })
    .from(newsItems)
    .leftJoin(series, eq(newsItems.seriesId, series.id))
    .where(conds.length ? and(...conds) : sql`true`)
    .orderBy(desc(newsItems.publishedAt))
    .limit(limit);
}

export async function getMyPreferences() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, session.user.id)).limit(1);
  return prefs ?? null;
}
