import type { SessionKind } from "@racehub/db";

export const SESSION_KIND_LABELS: Record<SessionKind, string> = {
  practice: "Practice",
  qualifying: "Qualifying",
  sprint: "Sprint",
  race: "Race",
  warmup: "Warm-up",
  other: "Other",
};

/** Kinds offered as filter toggles (the meaningful, common ones). */
export const SESSION_KIND_FILTERS: SessionKind[] = ["practice", "qualifying", "sprint", "race"];

export function sessionKindLabel(kind: string): string {
  return SESSION_KIND_LABELS[kind as SessionKind] ?? kind;
}

/** Tailwind text colour per kind for subtle visual grouping. */
export const SESSION_KIND_COLOR: Record<SessionKind, string> = {
  practice: "text-sky-400",
  qualifying: "text-amber-400",
  sprint: "text-fuchsia-400",
  race: "text-[var(--color-accent)]",
  warmup: "text-emerald-400",
  other: "text-[var(--color-muted)]",
};

export function sessionKindColor(kind: string): string {
  return SESSION_KIND_COLOR[kind as SessionKind] ?? "text-[var(--color-muted)]";
}
