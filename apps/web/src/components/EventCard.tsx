import Link from "next/link";
import { SeriesChip } from "./SeriesChip";
import { countdown, formatRange, formatEventTime } from "@/lib/format";
import type { UpcomingEvent } from "@/lib/queries";

export function EventCard({ event, tz }: { event: UpcomingEvent; tz?: string }) {
  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : null;
  return (
    <div className="card flex items-center gap-4 p-4 transition hover:border-[var(--color-muted)]">
      <div className="flex w-20 shrink-0 flex-col items-center justify-center rounded-md bg-[var(--color-surface-2)] px-2 py-2 text-center">
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
        </div>
        <h3 className="truncate font-semibold">{event.name}</h3>
        <p className="truncate text-sm text-[var(--color-muted)]">
          {formatRange(start, end, tz)} · {formatEventTime(start, tz)}
          {event.location ? ` · ${event.location}` : ""}
        </p>
      </div>
      <div className="shrink-0 text-right text-sm font-medium text-[var(--color-accent)]">{countdown(start)}</div>
    </div>
  );
}
