import "server-only";

import articlesFile from "@/data/news/articles.json";
import type { NewsArticle } from "@/lib/domain/types";

type NewsFile = {
  articles: NewsArticle[];
};

export function readNewsArticles(): NewsArticle[] {
  const file = articlesFile as NewsFile;
  return [...(file.articles ?? [])].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );
}
