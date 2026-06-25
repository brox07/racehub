import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeriesBySlug, getSeriesSchedule, getEventResults } from "@/lib/queries";
import { formatRange, formatDayTime, countdown } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";
import { sessionKindColor } from "@/lib/sessions";
import { SessionKindFilter } from "@/components/SessionKindFilter";
import type { SessionKind } from "@racehub/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await getSeriesBySlug(slug);
  return { title: s?.name ?? "Series" };
}

export default async function SeriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const series = await getSeriesBySlug(slug);
  if (!series) notFound();

  const kinds = (Array.isArray(sp.kinds) ? sp.kinds[0] : sp.kinds ?? "")
    .split(",")
    .filter(Boolean) as SessionKind[];

  const { upcoming, past } = await getSeriesSchedule(series.id, kinds.length ? kinds : undefined);
  const lastEvent = past[0];
  const lastResults = lastEvent ? await getEventResults(lastEvent.id) : [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <span className="inline-block h-12 w-2 rounded-full" style={{ backgroundColor: series.color }} />
        <div>
          <h1 className="text-2xl font-bold">{series.name}</h1>
          <p className="text-sm text-[var(--color-muted)]">
            {categoryLabel(series.category)} · {series.region}
          </p>
        </div>
        <div className="ml-auto flex gap-2 text-sm">
          {series.websiteUrl && (
            <a
              href={series.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-[var(--color-border)] px-3 py-1.5 hover:bg-[var(--color-surface-2)]"
            >
              Official site ↗
            </a>
          )}
          {series.newsUrl && (
            <a
              href={series.newsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-[var(--color-border)] px-3 py-1.5 hover:bg-[var(--color-surface-2)]"
            >
              News ↗
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">Upcoming</h2>
            <SessionKindFilter />
          </div>
          {upcoming.length === 0 ? (
            <div className="card p-6 text-sm text-[var(--color-muted)]">
              No upcoming events match. Add a calendar feed for this series or enter events manually.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {upcoming.map((e) => {
                const start = new Date(e.startsAt);
                const end = e.endsAt ? new Date(e.endsAt) : null;
                const now = Date.now();
                return (
                  <div key={e.id} className="card p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{e.name}</div>
                        <div className="text-xs text-[var(--color-muted)]">
                          {formatRange(start, end)}
                          {e.location ? ` · ${e.location}` : ""}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-[var(--color-accent)]">{countdown(start)}</span>
                    </div>
                    {e.sessions.length > 0 && (
                      <ul className="mt-3 flex flex-col gap-1 border-t border-[var(--color-border)] pt-3">
                        {e.sessions.map((s) => {
                          const sStart = new Date(s.startsAt);
                          return (
                            <li
                              key={s.id}
                              className={`flex items-center justify-between gap-3 text-sm ${
                                sStart.getTime() <= now ? "opacity-50" : ""
                              }`}
                            >
                              <span className={`font-medium ${sessionKindColor(s.kind)}`}>{s.name}</span>
                              <span className="shrink-0 text-xs text-[var(--color-muted)]">{formatDayTime(sStart)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Latest Results
          </h2>
          {lastResults.length === 0 ? (
            <div className="card p-6 text-sm text-[var(--color-muted)]">
              No results recorded yet.
              {past.length > 0 && lastEvent && <> Most recent event: {lastEvent.name}.</>}
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="border-b border-[var(--color-border)] px-4 py-2 text-sm font-semibold">
                {lastEvent?.name}
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {lastResults.slice(0, 10).map((r) => (
                    <tr key={r.id} className="border-b border-[var(--color-border)]/60 last:border-0">
                      <td className="w-10 px-4 py-2 font-mono text-[var(--color-muted)]">
                        {r.position ?? r.classification ?? "—"}
                      </td>
                      <td className="px-2 py-2 font-medium">{r.driver}</td>
                      <td className="px-4 py-2 text-right text-[var(--color-muted)]">{r.team ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {past.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase text-[var(--color-muted)]">Recent events</h3>
              <ul className="flex flex-col gap-1 text-sm">
                {past.slice(0, 6).map((e) => (
                  <li key={e.id} className="flex justify-between text-[var(--color-muted)]">
                    <span className="truncate">{e.name}</span>
                    <span className="shrink-0">{formatRange(new Date(e.startsAt), null)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <div className="mt-8">
        <Link href="/series" className="text-sm text-[var(--color-muted)] hover:text-white">
          ← All series
        </Link>
      </div>
    </div>
  );
}
