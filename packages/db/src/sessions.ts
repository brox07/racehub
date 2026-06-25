import { and, eq, notInArray } from "drizzle-orm";
import { db } from "./client";
import { events, eventSessions } from "./schema";

export type SessionKind = "practice" | "qualifying" | "sprint" | "race" | "warmup" | "other";

/** Minimal shape of a parsed calendar entry, decoupled from any ICS library. */
export interface RawVEvent {
  summary: string;
  start: Date;
  end: Date | null;
  uid: string;
  location: string | null;
}

export interface ParsedSession {
  name: string;
  kind: SessionKind;
  startsAt: Date;
  endsAt: Date | null;
  sourceUid: string;
}

export interface Weekend {
  name: string;
  startsAt: Date;
  endsAt: Date | null;
  location: string | null;
  sourceUid: string;
  sessions: ParsedSession[];
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

/** Classify a session label (e.g. "FP1", "Sprint Qualifying") into a kind. */
export function classifyKind(sessionName: string): SessionKind {
  const s = sessionName.toLowerCase();
  if (/warm/.test(s)) return "warmup";
  if (/sprint/.test(s) && /(qual|shootout)/.test(s)) return "qualifying";
  if (/sprint/.test(s)) return "sprint";
  if (/(practice|free practice|shakedown)/.test(s) || /\bfp\s?\d\b/.test(s)) return "practice";
  if (/(qualifying|qualy|qual|pole)/.test(s)) return "qualifying";
  if (/(race|grand prix|feature|day\s?\d|final|\bgp\b)/.test(s)) return "race";
  return "other";
}

/**
 * Split a calendar SUMMARY into a session label and the weekend/event name.
 * Handles "SERIES: Session (Event Name)" and "Event Name - Session"; falls back
 * to treating the whole summary as a single race.
 */
export function parseSummary(summary: string): { sessionName: string; eventName: string } {
  const s = summary.trim();
  let m = s.match(/^[^:]+:\s*(.+?)\s*\(([^)]+)\)\s*$/);
  if (m) return { sessionName: m[1].trim(), eventName: m[2].trim() };
  m = s.match(/^(.+?)\s+[-–]\s+(.+)$/);
  if (m) return { eventName: m[1].trim(), sessionName: m[2].trim() };
  return { eventName: s, sessionName: "Race" };
}

/** Group raw calendar entries into race weekends, each with its sessions. */
export function groupIntoWeekends(raw: RawVEvent[]): Weekend[] {
  const byEvent = new Map<string, Weekend>();

  for (const ev of raw) {
    if (!(ev.start instanceof Date) || Number.isNaN(ev.start.getTime())) continue;
    const { sessionName, eventName } = parseSummary(ev.summary);
    const key = eventName.toLowerCase();

    let wk = byEvent.get(key);
    if (!wk) {
      wk = { name: eventName, startsAt: ev.start, endsAt: ev.end ?? ev.start, location: ev.location, sourceUid: "", sessions: [] };
      byEvent.set(key, wk);
    }

    wk.sessions.push({
      name: sessionName,
      kind: classifyKind(sessionName),
      startsAt: ev.start,
      endsAt: ev.end ?? null,
      sourceUid: `${ev.uid}::${slugify(sessionName) || "session"}`,
    });

    if (ev.start < wk.startsAt) wk.startsAt = ev.start;
    const endCandidate = ev.end ?? ev.start;
    if (!wk.endsAt || endCandidate > wk.endsAt) wk.endsAt = endCandidate;
    if (!wk.location && ev.location) wk.location = ev.location;
  }

  for (const wk of byEvent.values()) {
    wk.sourceUid = `${slugify(wk.name) || "event"}-${wk.startsAt.getUTCFullYear()}`;
    wk.sessions.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }

  return [...byEvent.values()].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

/**
 * Upsert weekends + their sessions for a series. Idempotent on
 * (seriesId, sourceUid) for events and (eventId, sourceUid) for sessions;
 * sessions no longer present in the feed are removed.
 */
export async function upsertWeekends(
  seriesId: number,
  weekends: Weekend[],
): Promise<{ weekends: number; sessions: number }> {
  let sessionCount = 0;

  for (const wk of weekends) {
    const [row] = await db
      .insert(events)
      .values({
        seriesId,
        slug: slugify(`${wk.name}-${wk.startsAt.getUTCFullYear()}`) || slugify(wk.sourceUid),
        name: wk.name,
        location: wk.location,
        startsAt: wk.startsAt,
        endsAt: wk.endsAt,
        sourceUid: wk.sourceUid,
      })
      .onConflictDoUpdate({
        target: [events.seriesId, events.sourceUid],
        set: {
          name: wk.name,
          location: wk.location,
          startsAt: wk.startsAt,
          endsAt: wk.endsAt,
          updatedAt: new Date(),
        },
      })
      .returning({ id: events.id });

    const eventId = row.id;
    const seen: string[] = [];

    for (const s of wk.sessions) {
      seen.push(s.sourceUid);
      await db
        .insert(eventSessions)
        .values({
          eventId,
          name: s.name,
          kind: s.kind,
          startsAt: s.startsAt,
          endsAt: s.endsAt,
          sourceUid: s.sourceUid,
        })
        .onConflictDoUpdate({
          target: [eventSessions.eventId, eventSessions.sourceUid],
          set: { name: s.name, kind: s.kind, startsAt: s.startsAt, endsAt: s.endsAt },
        });
      sessionCount++;
    }

    if (seen.length) {
      await db
        .delete(eventSessions)
        .where(and(eq(eventSessions.eventId, eventId), notInArray(eventSessions.sourceUid, seen)));
    }
  }

  return { weekends: weekends.length, sessions: sessionCount };
}
