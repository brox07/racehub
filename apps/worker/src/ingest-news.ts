import Parser from "rss-parser";
import { createHash } from "node:crypto";
import { db, series, newsItems } from "@racehub/db";
import { eq, isNotNull, and } from "drizzle-orm";

const parser = new Parser({ timeout: 15000 });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "anthropic/claude-3.5-haiku";

function hashItem(url: string, title: string): string {
  return createHash("sha256").update(`${url}::${title}`).digest("hex").slice(0, 32);
}

/**
 * Summarise a headline + excerpt into 1-2 sentences via OpenRouter.
 * Returns null when no API key is configured (summary filled in later).
 */
async function summarize(title: string, excerpt: string, seriesName: string): Promise<string | null> {
  if (!OPENROUTER_API_KEY) return null;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You summarise motorsport news for a race fan dashboard. Reply with one or two concise, factual sentences. No preamble, no markdown.",
          },
          {
            role: "user",
            content: `Series: ${seriesName}\nHeadline: ${title}\n\nArticle excerpt:\n${excerpt.slice(0, 1500)}`,
          },
        ],
        max_tokens: 120,
        temperature: 0.3,
      }),
    });
    if (!res.ok) {
      console.error(`[news] OpenRouter ${res.status}: ${await res.text()}`);
      return null;
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return json.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (err) {
    console.error(`[news] summarise failed: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

export async function ingestNews(): Promise<void> {
  const targets = await db
    .select({ id: series.id, name: series.name, feedUrl: series.feedUrl })
    .from(series)
    .where(and(eq(series.active, true), isNotNull(series.feedUrl)));

  if (targets.length === 0) {
    console.log("[news] No series have a feedUrl configured yet — nothing to ingest.");
    return;
  }

  for (const t of targets) {
    try {
      const feed = await parser.parseURL(t.feedUrl!);
      let added = 0;
      for (const item of feed.items.slice(0, 15)) {
        const url = item.link ?? "";
        const title = item.title ?? "";
        if (!url || !title) continue;
        const dedupeHash = hashItem(url, title);
        const excerpt = (item.contentSnippet ?? item.content ?? "").toString();
        const summary = await summarize(title, excerpt, t.name);

        const result = await db
          .insert(newsItems)
          .values({
            seriesId: t.id,
            title,
            url,
            source: feed.title ?? t.name,
            excerpt: excerpt.slice(0, 2000),
            summary,
            publishedAt: item.isoDate ? new Date(item.isoDate) : null,
            dedupeHash,
          })
          .onConflictDoNothing({ target: newsItems.dedupeHash })
          .returning({ id: newsItems.id });
        if (result.length > 0) added++;
      }
      console.log(`[news] ${t.name}: +${added} new items`);
    } catch (err) {
      console.error(`[news] ${t.name}: ERROR ${err instanceof Error ? err.message : err}`);
    }
  }
}
