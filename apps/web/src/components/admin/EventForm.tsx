"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createEventAction, updateEventAction } from "@/lib/admin-actions";
import type { ActionResult } from "@/lib/actions";

interface SeriesOption {
  id: number;
  name: string;
}

export interface EventFormValues {
  id?: number;
  seriesId?: number;
  name?: string;
  startsAt?: Date | null;
  endsAt?: Date | null;
  location?: string | null;
  circuit?: string | null;
  country?: string | null;
  round?: number | null;
  status?: string;
  sourceUrl?: string | null;
}

const STATUSES = ["scheduled", "in-progress", "completed", "cancelled", "postponed"];

/** Date -> "YYYY-MM-DDTHH:mm" in UTC for <input type="datetime-local">. */
function toLocalInput(d?: Date | null): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 16);
}

const inputCls =
  "rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm";
const labelCls = "flex flex-col gap-1 text-sm";

export function EventForm({
  mode,
  series,
  values = {},
}: {
  mode: "create" | "edit";
  series: SeriesOption[];
  values?: EventFormValues;
}) {
  const action = mode === "create" ? createEventAction : updateEventAction;
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      {mode === "edit" && <input type="hidden" name="id" value={values.id} />}

      <label className={labelCls}>
        <span className="text-[var(--color-muted)]">Series</span>
        <select name="seriesId" defaultValue={values.seriesId ?? ""} required className={inputCls}>
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

      <label className={labelCls}>
        <span className="text-[var(--color-muted)]">Name</span>
        <input name="name" defaultValue={values.name ?? ""} required className={inputCls} />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelCls}>
          <span className="text-[var(--color-muted)]">Starts (UTC)</span>
          <input
            type="datetime-local"
            name="startsAt"
            defaultValue={toLocalInput(values.startsAt)}
            required
            className={inputCls}
          />
        </label>
        <label className={labelCls}>
          <span className="text-[var(--color-muted)]">Ends (UTC, optional)</span>
          <input
            type="datetime-local"
            name="endsAt"
            defaultValue={toLocalInput(values.endsAt)}
            className={inputCls}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelCls}>
          <span className="text-[var(--color-muted)]">Location</span>
          <input name="location" defaultValue={values.location ?? ""} className={inputCls} />
        </label>
        <label className={labelCls}>
          <span className="text-[var(--color-muted)]">Circuit</span>
          <input name="circuit" defaultValue={values.circuit ?? ""} className={inputCls} />
        </label>
        <label className={labelCls}>
          <span className="text-[var(--color-muted)]">Country</span>
          <input name="country" defaultValue={values.country ?? ""} className={inputCls} />
        </label>
        <label className={labelCls}>
          <span className="text-[var(--color-muted)]">Round (optional)</span>
          <input
            type="number"
            name="round"
            defaultValue={values.round ?? ""}
            className={inputCls}
          />
        </label>
      </div>

      <label className={labelCls}>
        <span className="text-[var(--color-muted)]">Status</span>
        <select name="status" defaultValue={values.status ?? "scheduled"} className={inputCls}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className={labelCls}>
        <span className="text-[var(--color-muted)]">Official URL (optional)</span>
        <input
          type="url"
          name="sourceUrl"
          defaultValue={values.sourceUrl ?? ""}
          placeholder="https://…  (overrides the auto race-search link)"
          className={inputCls}
        />
      </label>

      {state && !state.ok && <p className="text-sm text-[var(--color-accent)]">{state.error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : mode === "create" ? "Create event" : "Save changes"}
        </button>
        <Link href="/admin/events" className="text-sm text-[var(--color-muted)] hover:text-white">
          Cancel
        </Link>
      </div>
    </form>
  );
}
