"use client";

import { useActionState } from "react";
import { importIcsAction, type ImportResult } from "@/lib/admin-actions";

interface SeriesOption {
  id: number;
  name: string;
}

const inputCls =
  "rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm";

export function ImportForm({ series }: { series: SeriesOption[] }) {
  const [state, formAction, pending] = useActionState<ImportResult | null, FormData>(
    importIcsAction,
    null,
  );

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--color-muted)]">Series</span>
        <select name="seriesId" required defaultValue="" className={inputCls}>
          <option value="" disabled>
            Select a series…
          </option>
          {series.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--color-muted)]">.ics file</span>
        <input type="file" name="file" accept=".ics,text/calendar" required className={inputCls} />
      </label>

      <p className="text-xs text-[var(--color-muted)]">
        Events are matched on their calendar UID, so re-importing an updated file edits existing
        events in place instead of duplicating them.
      </p>

      {state && !state.ok && <p className="text-sm text-[var(--color-accent)]">{state.error}</p>}
      {state && state.ok && (
        <p className="text-sm text-green-400">
          Imported {state.entries} entries into {state.weekends} weekend{state.weekends === 1 ? "" : "s"} (
          {state.sessions} session{state.sessions === 1 ? "" : "s"}).
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Importing…" : "Import events"}
      </button>
    </form>
  );
}
