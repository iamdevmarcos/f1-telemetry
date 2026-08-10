import Image from "next/image";
import Link from "next/link";

import { formatNewsDate } from "@/lib/format-news";
import type { NewsArticleTeaser } from "@/lib/domain/types";

export function NewsCard({ article }: { article: NewsArticleTeaser }) {
  return (
    <Link
      href={`/news/${article.slug}`}
      className="group panel animate-rise block overflow-hidden transition-colors hover:border-[var(--accent)]"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--bg-elevated)]">
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
            No image
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <p className="absolute bottom-3 left-3 text-[0.68rem] uppercase tracking-[0.14em] text-white/90">
          {article.sourceName}
        </p>
      </div>
      <div className="space-y-2 p-4">
        <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[var(--muted)]">
          {formatNewsDate(article.publishedAt)}
        </p>
        <h2 className="font-[family-name:var(--font-teko)] text-3xl uppercase leading-none tracking-wide transition-colors group-hover:text-[var(--accent)]">
          {article.title}
        </h2>
        {article.excerpt ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-[var(--muted)]">
            {article.excerpt}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
