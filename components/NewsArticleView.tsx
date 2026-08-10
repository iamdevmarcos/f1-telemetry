import Image from "next/image";
import Link from "next/link";

import { NewsShareButtons } from "@/components/NewsShareButtons";
import { formatNewsDate } from "@/lib/format-news";
import type { NewsArticle } from "@/lib/domain/types";

export function NewsArticleView({
  article,
  shareUrl,
}: {
  article: NewsArticle;
  shareUrl: string;
}) {
  return (
    <article className="animate-rise w-full space-y-5">
      <header className="w-full space-y-6 border-b border-[var(--border)] pb-8 md:space-y-8 md:pb-10">
        <div className="flex items-center justify-between gap-4">
          <p className="field-label mb-0">
            {article.sourceName} · {formatNewsDate(article.publishedAt)}
          </p>
          <Link
            href="/news"
            className="shrink-0 text-[0.68rem] uppercase tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
          >
            Back to news →
          </Link>
        </div>

        <div className="flex w-full flex-col gap-5 md:gap-6">
          <h1 className="w-full font-[family-name:var(--font-teko)] text-4xl uppercase leading-[0.95] tracking-wide md:text-5xl lg:text-6xl">
            {article.title}
          </h1>

          {article.excerpt ? (
            <p className="w-full max-w-none text-base leading-relaxed text-[var(--muted)] md:text-lg md:leading-8">
              {article.excerpt}
            </p>
          ) : null}

          <NewsShareButtons title={article.title} url={shareUrl} />
        </div>
      </header>

      {article.imageUrl ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden border border-[var(--border)] bg-[var(--bg-elevated)]">
          <Image
            src={article.imageUrl}
            alt=""
            fill
            priority
            sizes="(max-width: 1400px) 100vw, 1400px"
            className="object-cover"
          />
        </div>
      ) : null}

      <div
        className="news-prose panel w-full space-y-4 p-5 text-sm leading-7 text-[var(--text)] md:p-8 md:text-base"
        dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
      />

      <div className="panel w-full space-y-3 p-5 md:p-6">
        <p className="field-label">Source</p>
        <p className="text-sm text-[var(--muted)]">
          Originally published by{" "}
          <span className="text-[var(--text)]">{article.sourceName}</span>.
        </p>
        <a
          href={article.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex select-control !w-auto cursor-pointer px-4 font-[family-name:var(--font-teko)] text-xl uppercase tracking-wide"
          style={{
            borderColor: "var(--accent)",
            background: "var(--accent)",
            color: "white",
          }}
        >
          Read original
        </a>
      </div>
    </article>
  );
}
