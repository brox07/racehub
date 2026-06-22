import Link from "next/link";
import { getAllSeries } from "@/lib/queries";
import { CATEGORY_ORDER, categoryLabel } from "@/lib/categories";

export const metadata = { title: "Series" };
export const dynamic = "force-dynamic";

export default async function SeriesIndexPage() {
  const all = await getAllSeries();
  const byCat = CATEGORY_ORDER.map((c) => ({
    cat: c,
    items: all.filter((s) => s.category === c),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Racing Series</h1>
      <div className="flex flex-col gap-8">
        {byCat.map((g) => (
          <section key={g.cat}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {categoryLabel(g.cat)}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((s) => (
                <Link
                  key={s.id}
                  href={`/series/${s.slug}`}
                  className="card flex items-center gap-3 p-4 transition hover:border-[var(--color-muted)]"
                >
                  <span className="inline-block h-8 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{s.name}</div>
                    <div className="text-xs text-[var(--color-muted)]">{s.region}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
