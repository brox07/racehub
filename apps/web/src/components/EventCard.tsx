import Link from "next/link";
import { SeriesChip } from "./SeriesChip";
import { countdown, formatRange, formatDayTime } from "@/lib/format";
import { sessionKindColor } from "@/lib/sessions";
import type { UpcomingEvent } from "@/lib/queries";

export function EventCard({ event, tz }: { event: UpcomingEvent; tz?: string }) {
  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : null;
  const now = Date.now();
  const sessions = event.sessions ?? [];

  // Count down to the next session that hasn't started yet (else the weekend start).
  const next = sessions.find((s) => new Date(s.startsAt).getTime() > now);
  const countdownTarget = next ? new Date(next.startsAt) : start;

  return (
    <div className="card flex gap-4 p-4 transition hover:border-[var(--color-muted)]">
      <div className="flex w-16 shrink-0 flex-col items-center justify-center self-start rounded-md bg-[var(--color-surface-2)] px-2 py-2 text-center">
        <span className="text-xs uppercase text-[var(--color-muted)]">
          {new Intl.DateTimeFormat("en-US", { month: "short", timeZone: tz }).format(start)}
        </span>
        <span className="text-2xl font-bold leading-tight">
          {new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: tz }).format(start)}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Link href={`/series/${event.seriesSlug}`}>
            <SeriesChip color={event.seriesColor} label={event.seriesShort} />
          </Link>
          {event.round != null && <span className="text-xs text-[var(--color-muted)]">Round {event.round}</span>}
          <span className="ml-auto text-sm font-medium text-[var(--color-accent)]">
            {countdown(countdownTarget)}
          </span>
        </div>

        <h3 className="truncate font-semibold">{event.name}</h3>
        <p className="truncate text-sm text-[var(--color-muted)]">
          {formatRange(start, end, tz)}
          {event.location ? ` · ${event.location}` : ""}
        </p>

        {sessions.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1 border-t border-[var(--color-border)] pt-3">
            {sessions.map((s) => {
              const sStart = new Date(s.startsAt);
              const isPast = sStart.getTime() <= now;
              return (
                <li
                  key={s.id}
                  className={`flex items-center justify-between gap-3 text-sm ${isPast ? "opacity-50" : ""}`}
                >
                  <span className={`font-medium ${sessionKindColor(s.kind)}`}>{s.name}</span>
                  <span className="shrink-0 text-xs text-[var(--color-muted)]">{formatDayTime(sStart, tz)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
