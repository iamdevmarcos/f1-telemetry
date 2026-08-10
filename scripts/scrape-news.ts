import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { load, type CheerioAPI } from "cheerio";

import { buildNewsSlug } from "../lib/domain/news";
import type { NewsArticle } from "../lib/domain/types";

const MAX_ARTICLES = 10;
const CANDIDATE_LIMIT = 18;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

type RssSource = {
  key: string;
  name: string;
  feedUrl: string;
};

type FeedItem = {
  title: string;
  link: string;
  publishedAt: string;
  excerpt: string;
  sourceKey: string;
  sourceName: string;
};

// RaceFans may block datacenter IPs (403). Autosport is the fallback second source.
const SOURCES: RssSource[] = [
  {
    key: "motorsport",
    name: "Motorsport.com",
    feedUrl: "https://www.motorsport.com/rss/f1/news/",
  },
  {
    key: "racefans",
    name: "RaceFans",
    feedUrl: "https://www.racefans.net/feed/",
  },
  {
    key: "autosport",
    name: "Autosport",
    feedUrl: "https://www.autosport.com/rss/f1/news/",
  },
];

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml, text/html, */*",
      "User-Agent": USER_AGENT,
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.google.com/",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseDate(value: string | undefined): string {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return new Date().toISOString();
  }

  return new Date(parsed).toISOString();
}

function parseRssItems(xml: string, source: RssSource): FeedItem[] {
  const $ = load(xml, { xml: true });
  const items: FeedItem[] = [];

  $("item").each((_, element) => {
    const node = $(element);
    const title = decodeXml(node.find("title").first().text());
    const link = decodeXml(
      node.find("link").first().text() ||
        node.find("guid").first().text() ||
        "",
    );
    const publishedAt = parseDate(
      node.find("pubDate").first().text() ||
        node.find("published").first().text(),
    );
    const excerpt = stripTags(
      decodeXml(
        node.find("description").first().text() ||
          node.find("content\\:encoded").first().text() ||
          "",
      ),
    ).slice(0, 280);

    if (!title || !link) {
      return;
    }

    items.push({
      title,
      link,
      publishedAt,
      excerpt,
      sourceKey: source.key,
      sourceName: source.name,
    });
  });

  return items;
}

function pickMeta($: CheerioAPI, selectors: string[]): string | null {
  for (const selector of selectors) {
    const content = $(selector).attr("content")?.trim();
    if (content) {
      return content;
    }
  }
  return null;
}

function sanitizeFragment(html: string): string {
  const $ = load(`<div id="root">${html}</div>`, { xml: false });
  const root = $("#root");

  root
    .find("script, style, iframe, noscript, form, button, svg, nav, aside")
    .remove();
  root.find("*").each((_, element) => {
    const el = $(element);
    const attribs = { ...el.attr() };
    for (const name of Object.keys(attribs)) {
      const lower = name.toLowerCase();
      if (
        lower.startsWith("on") ||
        lower === "style" ||
        lower === "srcset" ||
        lower === "class" ||
        lower === "id"
      ) {
        el.removeAttr(name);
      }
    }
  });

  root.find("a").each((_, element) => {
    const el = $(element);
    const href = el.attr("href");
    if (!href || href.startsWith("javascript:")) {
      el.removeAttr("href");
      return;
    }
    el.attr("rel", "noopener noreferrer");
    el.attr("target", "_blank");
  });

  root.find("img").each((_, element) => {
    const el = $(element);
    const src = el.attr("src");
    if (!src) {
      el.remove();
      return;
    }
    el.attr("loading", "lazy");
  });

  return root.html()?.trim() ?? "";
}

function extractArticle(html: string, sourceKey: string): {
  imageUrl: string | null;
  bodyHtml: string;
  excerpt: string;
} {
  const $ = load(html);

  const imageUrl =
    pickMeta($, [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'meta[name="og:image"]',
    ]) ??
    $("article img").first().attr("src") ??
    $(".entry-content img").first().attr("src") ??
    null;

  const excerptMeta =
    pickMeta($, [
      'meta[property="og:description"]',
      'meta[name="description"]',
      'meta[name="twitter:description"]',
    ]) ?? "";

  let bodyHtml = "";

  if (sourceKey === "racefans") {
    bodyHtml =
      $(".entry-content").first().html() ||
      $("article .content").first().html() ||
      $("article").first().html() ||
      "";
  } else if (sourceKey === "autosport") {
    bodyHtml =
      $("article .text").first().html() ||
      $(".article-content").first().html() ||
      $("article").first().html() ||
      "";
  } else {
    bodyHtml =
      $("article .ms-article-content").first().html() ||
      $("article .text").first().html() ||
      $(".article-content").first().html() ||
      $("article").first().html() ||
      $(".content").first().html() ||
      "";
  }

  if (!bodyHtml) {
    const paragraphs = $("p")
      .toArray()
      .slice(0, 12)
      .map((node) => $.html(node))
      .join("");
    bodyHtml = paragraphs;
  }

  const sanitized = sanitizeFragment(bodyHtml);
  const excerpt =
    stripTags(excerptMeta).slice(0, 280) ||
    stripTags(sanitized).slice(0, 280);

  return {
    imageUrl,
    bodyHtml: sanitized,
    excerpt,
  };
}

async function enrichItem(item: FeedItem): Promise<NewsArticle | null> {
  try {
    const html = await fetchText(item.link);
    const extracted = extractArticle(html, item.sourceKey);

    if (!extracted.bodyHtml || stripTags(extracted.bodyHtml).length < 80) {
      console.warn(`Skipping (thin body): ${item.link}`);
      return null;
    }

    const id = createHash("sha1").update(item.link).digest("hex").slice(0, 12);
    const slug = buildNewsSlug(item.title, item.sourceKey);

    return {
      id,
      slug,
      title: item.title,
      excerpt: item.excerpt || extracted.excerpt,
      bodyHtml: extracted.bodyHtml,
      imageUrl: extracted.imageUrl,
      sourceName: item.sourceName,
      sourceUrl: item.link,
      publishedAt: item.publishedAt,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn(
      `Failed article ${item.link}:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

async function main(): Promise<void> {
  const feedItems: FeedItem[] = [];

  for (const source of SOURCES) {
    console.log(`Fetching feed: ${source.name}`);
    try {
      const xml = await fetchText(source.feedUrl);
      const items = parseRssItems(xml, source);
      console.log(`  → ${items.length} items`);
      feedItems.push(...items);
    } catch (error) {
      console.warn(
        `  × feed failed:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  if (feedItems.length === 0) {
    throw new Error("No RSS items available from any source");
  }

  const seenLinks = new Set<string>();
  const candidates = feedItems
    .sort(
      (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
    )
    .filter((item) => {
      if (seenLinks.has(item.link)) {
        return false;
      }
      seenLinks.add(item.link);
      return true;
    })
    .slice(0, CANDIDATE_LIMIT);

  const articles: NewsArticle[] = [];
  const usedSlugs = new Set<string>();

  for (const item of candidates) {
    if (articles.length >= MAX_ARTICLES) {
      break;
    }

    const article = await enrichItem(item);
    if (!article) {
      continue;
    }

    let slug = article.slug;
    let suffix = 2;
    while (usedSlugs.has(slug)) {
      slug = `${article.slug}-${suffix}`;
      suffix += 1;
    }
    usedSlugs.add(slug);
    articles.push({ ...article, slug });

    console.log(`  ✓ ${article.sourceName}: ${article.title}`);
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  const output = { articles };
  const outPath = path.join(process.cwd(), "data/news/articles.json");
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(`\nWrote ${articles.length} articles → ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
