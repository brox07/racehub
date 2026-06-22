"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import { db, users, userPreferences } from "@racehub/db";
import { auth, signIn } from "@/auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: "Invalid email or password." };
    throw err; // re-throw Next.js redirect
  }
  return { ok: true };
}

export async function signupAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim() || null;

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Enter a valid email." };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return { ok: false, error: "An account with that email already exists." };

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(users).values({ email, name, passwordHash }).returning({ id: users.id });
  await db.insert(userPreferences).values({ userId: user.id }).onConflictDoNothing();

  await signIn("credentials", { email, password, redirectTo: "/" });
  return { ok: true };
}

export async function savePreferencesAction(input: {
  followedSeriesIds: number[] | null;
  filters?: Record<string, unknown>;
  timezone?: string;
  theme?: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not signed in." };

  await db
    .insert(userPreferences)
    .values({
      userId: session.user.id,
      followedSeriesIds: input.followedSeriesIds,
      filters: input.filters ?? {},
      timezone: input.timezone ?? "UTC",
      theme: input.theme ?? "system",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        followedSeriesIds: input.followedSeriesIds,
        ...(input.filters ? { filters: input.filters } : {}),
        ...(input.timezone ? { timezone: input.timezone } : {}),
        ...(input.theme ? { theme: input.theme } : {}),
        updatedAt: new Date(),
      },
    });

  revalidatePath("/");
  return { ok: true };
}
