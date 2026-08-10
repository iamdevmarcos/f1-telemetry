import "server-only";

import type { NewsArticle, NewsArticleTeaser } from "@/lib/domain/types";
import { sanitizeNewsHtml } from "@/lib/infrastructure/news/sanitize";
import { readNewsArticles } from "@/lib/infrastructure/news/store";

function toTeaser(article: NewsArticle): NewsArticleTeaser {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    imageUrl: article.imageUrl,
    sourceName: article.sourceName,
    sourceUrl: article.sourceUrl,
    publishedAt: article.publishedAt,
  };
}

export async function listNews(): Promise<NewsArticleTeaser[]> {
  return readNewsArticles().map(toTeaser);
}

export async function getNewsBySlug(
  slug: string,
): Promise<NewsArticle | null> {
  const article = readNewsArticles().find((item) => item.slug === slug);
  if (!article) {
    return null;
  }

  return {
    ...article,
    bodyHtml: sanitizeNewsHtml(article.bodyHtml),
  };
}

export async function listNewsSlugs(): Promise<string[]> {
  return readNewsArticles().map((article) => article.slug);
}
