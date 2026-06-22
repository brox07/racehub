"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { savePreferencesAction } from "@/lib/actions";
import { CATEGORY_ORDER, categoryLabel } from "@/lib/categories";

export interface FilterSeries {
  id: number;
  slug: string;
  shortName: string;
  name: string;
  color: string;
  category: string;
}

const LS_KEY = "racehub:filters";

export function FilterBar({
  allSeries,
  isLoggedIn,
}: {
  allSeries: FilterSeries[];
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const cats = new Set((params.get("cat") ?? "").split(",").filter(Boolean));
  const seriesSlugs = new Set((params.get("series") ?? "").split(",").filter(Boolean));
  const days = params.get("days") ?? "60";

  const categories = useMemo(
    () => CATEGORY_ORDER.filter((c) => allSeries.some((s) => s.category === c)),
    [allSeries],
  );

  // Restore anonymous defaults from localStorage on first load (when no URL filters).
  useEffect(() => {
    if (isLoggedIn) return;
    if (params.toString()) return;
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(LS_KEY) : null;
    if (!raw) return;
    try {
      const next = new URLSearchParams(JSON.parse(raw));
      if (next.toString()) router.replace(`${pathname}?${next.toString()}`);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function apply(next: { cat?: Set<string>; series?: Set<string>; days?: string }) {
    setSaved(false);
    const sp = new URLSearchParams(params.toString());
    const setOrDelete = (key: string, val: string) => (val ? sp.set(key, val) : sp.delete(key));
    setOrDelete("cat", [...(next.cat ?? cats)].join(","));
    setOrDelete("series", [...(next.series ?? seriesSlugs)].join(","));
    sp.set("days", next.days ?? days);
    startTransition(() => router.replace(`${pathname}?${sp.toString()}`));
  }

  function toggleCat(c: string) {
    const n = new Set(cats);
    n.has(c) ? n.delete(c) : n.add(c);
    apply({ cat: n });
  }

  function toggleSeries(slug: string) {
    const n = new Set(seriesSlugs);
    n.has(slug) ? n.delete(slug) : n.add(slug);
    apply({ series: n });
  }

  function clearAll() {
    setSaved(false);
    startTransition(() => router.replace(pathname));
  }

  async function saveDefaults() {
    if (isLoggedIn) {
      const followedIds = seriesSlugs.size
        ? allSeries.filter((s) => seriesSlugs.has(s.slug)).map((s) => s.id)
        : null;
      await savePreferencesAction({
        followedSeriesIds: followedIds,
        filters: { categories: [...cats], days },
      });
    } else {
      const obj: Record<string, string> = {};
      params.forEach((v, k) => (obj[k] = v));
      window.localStorage.setItem(LS_KEY, JSON.stringify(obj));
    }
    setSaved(true);
  }

  return (
    <aside className="card sticky top-4 flex flex-col gap-5 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">Filters</h2>
        <button onClick={clearAll} className="text-xs text-[var(--color-muted)] hover:text-white">
          Reset
        </button>
      </div>

      <div>
        <label className="mb-1 block text-xs text-[var(--color-muted)]">Time window</label>
        <select
          value={days}
          onChange={(e) => apply({ days: e.target.value })}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1.5 text-sm"
        >
          <option value="14">Next 2 weeks</option>
          <option value="30">Next 30 days</option>
          <option value="60">Next 60 days</option>
          <option value="120">Next 4 months</option>
          <option value="3650">Full season</option>
        </select>
      </div>

      <div>
        <h3 className="mb-2 text-xs text-[var(--color-muted)]">Categories</h3>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => toggleCat(c)}
              className={`chip border transition ${
                cats.has(c)
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/20 text-white"
                  : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-white"
              }`}
            >
              {categoryLabel(c)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs text-[var(--color-muted)]">
          Series {seriesSlugs.size > 0 && <span className="text-white">({seriesSlugs.size})</span>}
        </h3>
        <div className="flex max-h-72 flex-col gap-1 overflow-y-auto pr-1">
          {allSeries
            .filter((s) => cats.size === 0 || cats.has(s.category))
            .map((s) => {
              const on = seriesSlugs.has(s.slug);
              return (
                <button
                  key={s.slug}
                  onClick={() => toggleSeries(s.slug)}
                  className={`flex items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition ${
                    on ? "bg-[var(--color-surface-2)]" : "hover:bg-[var(--color-surface-2)]/60"
                  }`}
                >
                  <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className={`truncate ${on ? "text-white" : "text-[var(--color-muted)]"}`}>{s.name}</span>
                  {on && <span className="ml-auto text-xs text-[var(--color-accent)]">✓</span>}
                </button>
              );
            })}
        </div>
      </div>

      <button
        onClick={saveDefaults}
        disabled={isPending}
        className="rounded-md bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {saved ? "Saved ✓" : isLoggedIn ? "Save as my defaults" : "Remember on this device"}
      </button>
      {!isLoggedIn && (
        <p className="-mt-2 text-xs text-[var(--color-muted)]">
          Sign in to sync your filters across devices.
        </p>
      )}
    </aside>
  );
}
