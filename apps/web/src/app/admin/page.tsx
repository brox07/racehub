import Link from "next/link";
import { adminCounts } from "@/lib/admin-queries";
import { getAllSeries } from "@/lib/queries";

export default async function AdminHome() {
  const [counts, series] = await Promise.all([adminCounts(), getAllSeries()]);

  const cards = [
    { label: "Total events", value: counts.events },
    { label: "Upcoming events", value: counts.upcoming },
    { label: "Active series", value: series.length },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-sm text-[var(--color-muted)]">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/events/new"
          className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + New event
        </Link>
        <Link
          href="/admin/events"
          className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-surface-2)]"
        >
          Manage events
        </Link>
        <Link
          href="/admin/import"
          className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-surface-2)]"
        >
          Import an .ics file
        </Link>
      </div>
    </div>
  );
}
