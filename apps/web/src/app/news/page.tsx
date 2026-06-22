import { getRecentNews } from "@/lib/queries";
import { SeriesChip } from "@/components/SeriesChip";

export const metadata = { title: "News" };
export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const news = await getRecentNews();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold">Race News</h1>
      <p className="mb-6 text-sm text-[var(--color-muted)]">
        AI-curated summaries from each series, with a link to the full story.
      </p>

      {news.length === 0 ? (
        <div className="card p-8 text-center text-[var(--color-muted)]">
          <p className="mb-2 font-medium text-white">No news yet.</p>
          <p className="text-sm">
            Add RSS/Atom feed URLs to series and set an OpenRouter API key on the worker to populate this feed.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {news.map(({ item, seriesShort, seriesColor }) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card block p-4 transition hover:border-[var(--color-muted)]"
            >
              <div className="mb-1.5 flex items-center gap-2">
                {seriesShort && <SeriesChip color={seriesColor ?? "#888"} label={seriesShort} />}
                {item.publishedAt && (
                  <span className="text-xs text-[var(--color-muted)]">
                    {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
                      new Date(item.publishedAt),
                    )}
                  </span>
                )}
                {item.source && <span className="text-xs text-[var(--color-muted)]">· {item.source}</span>}
              </div>
              <h2 className="font-semibold">{item.title}</h2>
              {item.summary && <p className="mt-1 text-sm text-[var(--color-muted)]">{item.summary}</p>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
