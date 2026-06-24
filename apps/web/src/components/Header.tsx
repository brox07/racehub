import Link from "next/link";
import { auth, signOut } from "@/auth";
import { isAdminEmail } from "@/lib/admin";

export async function Header({ siteName }: { siteName: string }) {
  const session = await auth();
  const showAdmin = isAdminEmail(session?.user?.email);

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/60 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-6 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="inline-block h-5 w-5 rounded-sm bg-[var(--color-accent)]" />
          <span className="text-lg">{siteName}</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-[var(--color-muted)]">
          <Link href="/" className="hover:text-white">Schedule</Link>
          <Link href="/series" className="hover:text-white">Series</Link>
          <Link href="/news" className="hover:text-white">News</Link>
          {showAdmin && <Link href="/admin" className="hover:text-white">Admin</Link>}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {session?.user ? (
            <>
              <span className="text-[var(--color-muted)] hidden sm:inline">
                {session.user.name ?? session.user.email}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button className="rounded-md border border-[var(--color-border)] px-3 py-1.5 hover:bg-[var(--color-surface-2)]">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-white">Sign in</Link>
              <Link
                href="/signup"
                className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 font-medium text-white hover:opacity-90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
