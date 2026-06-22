"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, signupAction, type ActionResult } from "@/lib/actions";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <h1 className="mb-1 text-2xl font-bold">{mode === "login" ? "Sign in" : "Create your account"}</h1>
      <p className="mb-6 text-sm text-[var(--color-muted)]">
        {mode === "login" ? "Welcome back to RaceHub." : "Save your series and filters across devices."}
      </p>

      <form action={formAction} className="flex flex-col gap-3">
        {mode === "signup" && (
          <input
            name="name"
            placeholder="Name (optional)"
            autoComplete="name"
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm"
          />
        )}
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          autoComplete="email"
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm"
        />

        {state && !state.ok && <p className="text-sm text-[var(--color-accent)]">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-md bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Please wait…" : mode === "login" ? "Sign in" : "Sign up"}
        </button>
      </form>

      <p className="mt-4 text-sm text-[var(--color-muted)]">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link href="/signup" className="text-white hover:underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have one?{" "}
            <Link href="/login" className="text-white hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
