import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db, series, events, results, userPreferences, newsItems } from "@racehub/db";
import { auth } from "@/auth";

export type SeriesRow = typeof series.$inferSelect;
export type EventRow = typeof events.$inferSelect;

export async function getAllSeries(): Promise<SeriesRow[]> {
  return db.select().from(series).where(eq(series.active, true)).orderBy(asc(series.sortOrder), asc(series.name));
}

export interface ScheduleFilters {
  categories?: string[];
  regions?: string[];
  seriesIds?: number[];
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
}

export async function getUpcomingEvents(filters: ScheduleFilters = {}): Promise<UpcomingEvent[]> {
  const from = filters.from ?? new Date();
  const conds = [gte(events.startsAt, from), eq(series.active, true)];
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

  return rows.map((r) => ({
    ...r.event,
    seriesName: r.seriesName,
    seriesShort: r.seriesShort,
    seriesSlug: r.seriesSlug,
    seriesColor: r.seriesColor,
    seriesCategory: r.seriesCategory,
  }));
}

export async function getSeriesBySlug(slug: string) {
  const [row] = await db.select().from(series).where(eq(series.slug, slug)).limit(1);
  return row ?? null;
}

export async function getSeriesSchedule(seriesId: number) {
  const now = new Date();
  const upcoming = await db
    .select()
    .from(events)
    .where(and(eq(events.seriesId, seriesId), gte(events.startsAt, now)))
    .orderBy(asc(events.startsAt));
  const past = await db
    .select()
    .from(events)
    .where(and(eq(events.seriesId, seriesId), lte(events.startsAt, now)))
    .orderBy(desc(events.startsAt))
    .limit(10);
  return { upcoming, past };
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
