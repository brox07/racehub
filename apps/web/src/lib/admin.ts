import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Emails granted admin access, from ADMIN_EMAILS (comma-separated). */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

/** True when the current session belongs to an allowlisted admin. */
export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return isAdminEmail(session?.user?.email);
}

/**
 * Guard for admin pages: redirects non-admins to the login page (or home if
 * already signed in). Returns the admin's email when allowed.
 */
export async function requireAdmin(): Promise<string> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login?next=/admin");
  if (!isAdminEmail(email)) redirect("/");
  return email!;
}

/** Throws in server actions when the caller is not an admin. */
export async function assertAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error("Forbidden");
}
