import { Suspense } from "react";
import { redirect } from "next/navigation";
import { FilterBar } from "@/components/FilterBar";
import { EventCard } from "@/components/EventCard";
import { getAllSeries, getUpcomingEvents, getMyPreferences, type UpcomingEvent } from "@/lib/queries";
import { relativeDayLabel } from "@/lib/format";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const allSeries = await getAllSeries();
  const prefs = await getMyPreferences();
  const isLoggedIn = prefs !== null;

  // Logged-in users with saved defaults and no explicit filters: hydrate the URL.
  const hasParams = Object.keys(sp).length > 0;
  if (!hasParams && prefs) {
    const next = new URLSearchParams();
    const f = (prefs.filters ?? {}) as { categories?: string[]; kinds?: string[]; days?: string };
    if (f.categories?.length) next.set("cat", f.categories.join(","));
    if (f.kinds?.length) next.set("kinds", f.kinds.join(","));
    if (prefs.followedSeriesIds?.length) {
      const slugs = allSeries.filter((s) => prefs.followedSeriesIds!.includes(s.id)).map((s) => s.slug);
      if (slugs.length) next.set("series", slugs.join(","));
    }
    if (f.days) next.set("days", f.days);
    if (next.toString()) redirect(`/?${next.toString()}`);
  }

  const csv = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v.join(",") : (v ?? "")).split(",").filter(Boolean);

  const catFilter = csv(sp.cat);
  const seriesFilter = csv(sp.series);
  const kindFilter = csv(sp.kinds);
  const days = Number(Array.isArray(sp.days) ? sp.days[0] : sp.days) || 60;
  const to = new Date(Date.now() + days * 86400000);
  const seriesIds = seriesFilter.length
    ? allSeries.filter((s) => seriesFilter.includes(s.slug)).map((s) => s.id)
    : undefined;

  const events = await getUpcomingEvents({
    categories: catFilter.length ? catFilter : undefined,
    seriesIds,
    kinds: kindFilter.length ? (kindFilter as never[]) : undefined,
    to,
    limit: 300,
  });

  // Group events into ordered date sections.
  const groups: { label: string; items: UpcomingEvent[] }[] = [];
  for (const ev of events) {
    const label = relativeDayLabel(new Date(ev.startsAt));
    const g = groups.find((x) => x.label === label);
    if (g) g.items.push(ev);
    else groups.push({ label, items: [ev] });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
      <Suspense fallback={<div className="card p-4 text-sm text-[var(--color-muted)]">Loading filters…</div>}>
        <FilterBar allSeries={allSeries} isLoggedIn={isLoggedIn} />
      </Suspense>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h1 className="text-2xl font-bold">Upcoming Races</h1>
          <span className="text-sm text-[var(--color-muted)]">{events.length} events</span>
        </div>

        {events.length === 0 ? (
          <div className="card p-8 text-center text-[var(--color-muted)]">
            <p className="mb-2 font-medium text-white">No races match your filters yet.</p>
            <p className="text-sm">
              Schedules populate once the ingestion worker has ICS feeds configured, or you can add events manually.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {groups.map((g) => (
              <div key={g.label}>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  {g.label}
                </h2>
                <div className="flex flex-col gap-2">
                  {g.items.map((ev) => (
                    <EventCard key={ev.id} event={ev} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
