import Parser from "rss-parser";

const parser = new Parser();

export interface NewsArticle {
  title: string;
  source: string;
  url: string;
  tier: "customaize-relevant" | "business-ai" | "industry";
  published: string;
  publishedAt: Date;
  description?: string;
}

const RSS_FEEDS = [
  { url: "https://www.anthropic.com/feed", source: "Anthropic" },
  { url: "https://openai.com/blog/rss.xml", source: "OpenAI" },
  { url: "https://techcrunch.com/category/artificial-intelligence/feed/", source: "TechCrunch" },
];

const HN_API = "https://hn.algolia.com/api/v1/search_by_date?query=AI+OR+LLM+OR+GPT&tags=story&hitsPerPage=5";

let cachedArticles: NewsArticle[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 60 * 1000;

async function fetchRSSArticles(): Promise<Omit<NewsArticle, "tier">[]> {
  const articles: Omit<NewsArticle, "tier">[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      for (const item of (parsed.items || []).slice(0, 5)) {
        const snippet = item.contentSnippet || item.summary || item.content || "";
        articles.push({
          title: item.title || "(No title)",
          source: feed.source,
          url: item.link || "",
          published: timeAgo(new Date(item.pubDate || Date.now())),
          publishedAt: new Date(item.pubDate || Date.now()),
          description: snippet
            ? snippet.replace(/<[^>]+>/g, "").trim().slice(0, 200)
            : undefined,
        });
      }
    } catch {
      // Skip failed feeds silently
    }
  }

  return articles;
}

async function fetchHNArticles(): Promise<Omit<NewsArticle, "tier">[]> {
  try {
    const res = await fetch(HN_API);
    const data = await res.json();
    return (data.hits || []).map((hit: { title: string; url: string; created_at: string; objectID: string }) => ({
      title: hit.title,
      source: "Hacker News",
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      published: timeAgo(new Date(hit.created_at)),
      publishedAt: new Date(hit.created_at),
    }));
  } catch {
    return [];
  }
}

export async function getNews(): Promise<{ articles: NewsArticle[]; lastUpdated: number }> {
  const now = Date.now();
  if (cachedArticles.length > 0 && now - lastFetchTime < CACHE_DURATION) {
    return { articles: cachedArticles, lastUpdated: lastFetchTime };
  }

  const [rssArticles, hnArticles] = await Promise.all([
    fetchRSSArticles(),
    fetchHNArticles(),
  ]);

  const allArticles = [...rssArticles, ...hnArticles]
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, 15);

  cachedArticles = allArticles.map((a) => ({
    ...a,
    tier: "industry" as const,
  }));

  lastFetchTime = now;
  return { articles: cachedArticles, lastUpdated: lastFetchTime };
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
