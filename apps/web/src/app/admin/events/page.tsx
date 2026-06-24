import Link from "next/link";
import { listEventsAdmin } from "@/lib/admin-queries";
import { getAllSeries } from "@/lib/queries";
import { deleteEventAction } from "@/lib/admin-actions";

function fmt(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const seriesId = sp.series ? Number(Array.isArray(sp.series) ? sp.series[0] : sp.series) : undefined;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() || undefined;

  const [series, events] = await Promise.all([
    getAllSeries(),
    listEventsAdmin({ seriesId, q, limit: 300 }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <form className="flex flex-wrap items-center gap-2" action="/admin/events">
          <select
            name="series"
            defaultValue={seriesId ?? ""}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1.5 text-sm"
          >
            <option value="">All series</option>
            {series.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search name…"
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-sm"
          />
          <button className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-surface-2)]">
            Filter
          </button>
        </form>
        <Link
          href="/admin/events/new"
          className="ml-auto rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + New event
        </Link>
      </div>

      <div className="text-sm text-[var(--color-muted)]">{events.length} events</div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase text-[var(--color-muted)]">
              <th className="px-3 py-2">Start (UTC)</th>
              <th className="px-3 py-2">Series</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-[var(--color-muted)]">
                  No events match.
                </td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e.id} className="border-b border-[var(--color-border)]/60 last:border-0">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-[var(--color-muted)]">
                    {fmt(e.startsAt)}
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: e.seriesColor }} />
                      {e.seriesShort}
                    </span>
                  </td>
                  <td className="px-3 py-2">{e.name}</td>
                  <td className="px-3 py-2 text-[var(--color-muted)]">{e.status}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <Link href={`/admin/events/${e.id}`} className="text-[var(--color-accent)] hover:underline">
                      Edit
                    </Link>
                    <form action={deleteEventAction} className="ml-3 inline">
                      <input type="hidden" name="id" value={e.id} />
                      <button className="text-[var(--color-muted)] hover:text-white" type="submit">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
