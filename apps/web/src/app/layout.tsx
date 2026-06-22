import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "RaceHub";

export const metadata: Metadata = {
  title: { default: `${siteName} — Motorsport Schedules & News`, template: `%s · ${siteName}` },
  description: "Every racing series schedule, results, and AI-curated news in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header siteName={siteName} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
        <footer className="mx-auto w-full max-w-7xl px-4 py-10 text-sm text-[var(--color-muted)]">
          {siteName} · built for race fans
        </footer>
      </body>
    </html>
  );
}
