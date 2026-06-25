"use server";

import ical from "node-ical";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, events, groupIntoWeekends, upsertWeekends, type RawVEvent } from "@racehub/db";
import { assertAdmin } from "@/lib/admin";
import { slugify } from "@/lib/slug";
import type { ActionResult } from "@/lib/actions";

export type ImportResult =
  | { ok: true; entries: number; weekends: number; sessions: number }
  | { ok: false; error: string };

const eventStatuses = ["scheduled", "in-progress", "completed", "cancelled", "postponed"] as const;
type EventStatus = (typeof eventStatuses)[number];

/** Parse a datetime-local string ("YYYY-MM-DDTHH:mm") as UTC. */
function parseUtc(value: string): Date | null {
  if (!value) return null;
  const d = new Date(`${value}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function readEventFields(fd: FormData) {
  const name = String(fd.get("name") ?? "").trim();
  const seriesId = Number(fd.get("seriesId"));
  const startsAt = parseUtc(String(fd.get("startsAt") ?? ""));
  const endsAt = parseUtc(String(fd.get("endsAt") ?? ""));
  const location = String(fd.get("location") ?? "").trim() || null;
  const circuit = String(fd.get("circuit") ?? "").trim() || null;
  const country = String(fd.get("country") ?? "").trim() || null;
  const roundRaw = String(fd.get("round") ?? "").trim();
  const round = roundRaw ? Number(roundRaw) : null;
  const statusRaw = String(fd.get("status") ?? "scheduled");
  const status = (eventStatuses as readonly string[]).includes(statusRaw)
    ? (statusRaw as EventStatus)
    : "scheduled";
  return { name, seriesId, startsAt, endsAt, location, circuit, country, round, status };
}

function validate(f: ReturnType<typeof readEventFields>): string | null {
  if (!f.name) return "Name is required.";
  if (!f.seriesId || Number.isNaN(f.seriesId)) return "Pick a series.";
  if (!f.startsAt) return "A valid start date/time is required.";
  if (f.round !== null && Number.isNaN(f.round)) return "Round must be a number.";
  return null;
}

export async function createEventAction(
  _prev: ActionResult | null,
  fd: FormData,
): Promise<ActionResult> {
  await assertAdmin();
  const f = readEventFields(fd);
  const err = validate(f);
  if (err) return { ok: false, error: err };

  await db.insert(events).values({
    seriesId: f.seriesId,
    slug: slugify(`${f.name}-${f.startsAt!.getUTCFullYear()}`) || slugify(f.name),
    name: f.name,
    round: f.round,
    circuit: f.circuit,
    location: f.location,
    country: f.country,
    startsAt: f.startsAt!,
    endsAt: f.endsAt,
    status: f.status,
  });

  revalidatePath("/", "layout");
  redirect("/admin/events");
}

export async function updateEventAction(
  _prev: ActionResult | null,
  fd: FormData,
): Promise<ActionResult> {
  await assertAdmin();
  const id = Number(fd.get("id"));
  if (!id) return { ok: false, error: "Missing event id." };
  const f = readEventFields(fd);
  const err = validate(f);
  if (err) return { ok: false, error: err };

  await db
    .update(events)
    .set({
      seriesId: f.seriesId,
      name: f.name,
      round: f.round,
      circuit: f.circuit,
      location: f.location,
      country: f.country,
      startsAt: f.startsAt!,
      endsAt: f.endsAt,
      status: f.status,
      updatedAt: new Date(),
    })
    .where(eq(events.id, id));

  revalidatePath("/", "layout");
  redirect("/admin/events");
}

export async function deleteEventAction(fd: FormData): Promise<void> {
  await assertAdmin();
  const id = Number(fd.get("id"));
  if (id) {
    await db.delete(events).where(eq(events.id, id));
    revalidatePath("/", "layout");
  }
  redirect("/admin/events");
}

/**
 * Parse an uploaded .ics file and upsert its events under the chosen series.
 * Idempotent on (seriesId, sourceUid), matching the worker's ingestion.
 */
export async function importIcsAction(
  _prev: ImportResult | null,
  fd: FormData,
): Promise<ImportResult> {
  await assertAdmin();
  const seriesId = Number(fd.get("seriesId"));
  if (!seriesId) return { ok: false, error: "Pick a series for the import." };

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a .ics file." };

  let text: string;
  try {
    text = await file.text();
  } catch {
    return { ok: false, error: "Could not read the uploaded file." };
  }

  let parsed: Record<string, ical.CalendarComponent>;
  try {
    parsed = await ical.async.parseICS(text);
  } catch (e) {
    return { ok: false, error: `Invalid ICS file: ${e instanceof Error ? e.message : String(e)}` };
  }

  const vevents = Object.values(parsed).filter(
    (c): c is ical.VEvent => (c as ical.CalendarComponent).type === "VEVENT",
  );
  if (vevents.length === 0) return { ok: false, error: "No calendar events (VEVENT) found in the file." };

  // Group sessions into weekends, identical to the worker's ingestion.
  const raw: RawVEvent[] = vevents.map((ev) => ({
    summary: (ev.summary ?? "Untitled").toString().trim(),
    start: ev.start instanceof Date ? ev.start : new Date(ev.start as unknown as string),
    end: ev.end instanceof Date ? ev.end : ev.end ? new Date(ev.end as unknown as string) : null,
    uid: (ev.uid ?? "").toString(),
    location: ev.location ? ev.location.toString() : null,
  }));

  const weekends = groupIntoWeekends(raw);
  const res = await upsertWeekends(seriesId, weekends);

  revalidatePath("/", "layout");
  return { ok: true, entries: vevents.length, weekends: res.weekends, sessions: res.sessions };
}
