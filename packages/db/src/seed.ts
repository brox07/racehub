import { db, sql } from "./client";
import { series } from "./schema";
import { SERIES_SEED } from "./series";
import { eq } from "drizzle-orm";

async function main() {
  console.log(`Seeding ${SERIES_SEED.length} series…`);

  for (const s of SERIES_SEED) {
    await db
      .insert(series)
      .values({
        slug: s.slug,
        name: s.name,
        shortName: s.shortName,
        category: s.category,
        region: s.region,
        color: s.color,
        websiteUrl: s.websiteUrl,
        newsUrl: s.newsUrl,
        feedUrl: s.feedUrl,
        icsUrl: s.icsUrl,
        sortOrder: s.sortOrder ?? 100,
      })
      // Re-seeding refreshes metadata but never clobbers ingested events.
      .onConflictDoUpdate({
        target: series.slug,
        set: {
          name: s.name,
          shortName: s.shortName,
          category: s.category,
          region: s.region,
          color: s.color,
          websiteUrl: s.websiteUrl,
          newsUrl: s.newsUrl ?? null,
          feedUrl: s.feedUrl ?? null,
          icsUrl: s.icsUrl ?? null,
          sortOrder: s.sortOrder ?? 100,
        },
      });
  }

  // Second pass: wire parent relationships.
  for (const s of SERIES_SEED) {
    if (!s.parentSlug) continue;
    const [parent] = await db.select({ id: series.id }).from(series).where(eq(series.slug, s.parentSlug));
    if (parent) {
      await db.update(series).set({ parentId: parent.id }).where(eq(series.slug, s.slug));
    }
  }

  console.log("Seed complete.");
  await sql.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
