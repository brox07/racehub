import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const email = await requireAdmin();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4 border-b border-[var(--color-border)] pb-4">
        <h1 className="text-xl font-bold">Admin</h1>
        <nav className="flex items-center gap-4 text-sm text-[var(--color-muted)]">
          <Link href="/admin" className="hover:text-white">Overview</Link>
          <Link href="/admin/events" className="hover:text-white">Events</Link>
          <Link href="/admin/import" className="hover:text-white">Import ICS</Link>
        </nav>
        <span className="ml-auto text-xs text-[var(--color-muted)]">{email}</span>
      </div>
      {children}
    </div>
  );
}
