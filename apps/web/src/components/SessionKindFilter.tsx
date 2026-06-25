"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SESSION_KIND_FILTERS, sessionKindLabel } from "@/lib/sessions";

export function SessionKindFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const active = new Set((params.get("kinds") ?? "").split(",").filter(Boolean));

  function toggle(kind: string) {
    const next = new Set(active);
    next.has(kind) ? next.delete(kind) : next.add(kind);
    const sp = new URLSearchParams(params.toString());
    const value = [...next].join(",");
    value ? sp.set("kinds", value) : sp.delete("kinds");
    startTransition(() => router.replace(sp.toString() ? `${pathname}?${sp.toString()}` : pathname));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-[var(--color-muted)]">Sessions:</span>
      {SESSION_KIND_FILTERS.map((k) => (
        <button
          key={k}
          onClick={() => toggle(k)}
          disabled={pending}
          className={`chip border transition ${
            active.has(k)
              ? "border-[var(--color-accent)] bg-[var(--color-accent)]/20 text-white"
              : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-white"
          }`}
        >
          {sessionKindLabel(k)}
        </button>
      ))}
    </div>
  );
}
