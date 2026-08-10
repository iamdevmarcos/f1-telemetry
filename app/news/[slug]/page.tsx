import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { ModeNav } from "@/components/ModeNav";
import { NewsArticleView } from "@/components/NewsArticleView";
import { getNewsBySlug, listNewsSlugs } from "@/lib/application/news";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await listNewsSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);

  if (!article) {
    return { title: "News · F1 Apex" };
  }

  return {
    title: `${article.title} · F1 Apex`,
    description: article.excerpt || article.title,
    openGraph: {
      title: article.title,
      description: article.excerpt || article.title,
      images: article.imageUrl ? [article.imageUrl] : undefined,
    },
  };
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);

  if (!article) {
    notFound();
  }

  const shareUrl = `/news/${article.slug}`;

  return (
    <AppShell modeLabel="News" contextLabel={article.sourceName}>
      <ModeNav active="news" />
      <NewsArticleView article={article} shareUrl={shareUrl} />
    </AppShell>
  );
}
