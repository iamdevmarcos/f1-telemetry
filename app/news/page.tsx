import { AppShell } from "@/components/AppShell";
import { ModeNav } from "@/components/ModeNav";
import { NewsCard } from "@/components/NewsCard";
import { listNews } from "@/lib/application/news";

export const metadata = {
  title: "News · F1 Apex",
  description: "Latest Formula 1 headlines curated for F1 Apex.",
};

export default async function NewsPage() {
  const articles = await listNews();

  return (
    <AppShell modeLabel="News" contextLabel="Latest headlines">
      <ModeNav active="news" />

      <section className="mb-6 space-y-2">
        <p className="field-label">Briefing</p>
        <h2 className="font-[family-name:var(--font-teko)] text-4xl uppercase leading-none md:text-5xl">
          Formula 1 News
        </h2>
        <p className="max-w-2xl text-sm text-[var(--muted)]">
          A curated feed of recent F1 stories. Open any piece for the full read,
          then jump to the original source.
        </p>
      </section>

      {articles.length === 0 ? (
        <div className="panel p-6 text-sm text-[var(--muted)]">
          No articles yet. Run{" "}
          <code className="text-[var(--text)]">npm run scrape:news</code> and
          commit the generated JSON.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
