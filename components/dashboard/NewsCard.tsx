"use client";

import { useEffect, useState } from "react";

interface NewsArticle {
  title: string;
  source: string;
  url: string;
  tier: "customaize-relevant" | "business-ai" | "industry";
  published: string;
}

const TIER_STYLES: Record<string, { label: string; color: string }> = {
  "customaize-relevant": { label: "Highly Relevant", color: "text-[hsl(var(--primary))]" },
  "business-ai": { label: "Business AI", color: "text-[hsl(var(--primary-muted))]" },
  industry: { label: "Industry", color: "text-[hsl(var(--text-dim))]" },
};

export function NewsCard() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch("/api/news");
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setArticles(data.articles);
        }
      } catch {
        setError("Failed to load news");
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const visibleArticles = expanded ? articles : articles.slice(0, 3);

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--bg-card))] p-6">
      <div className="flex items-center justify-between mb-5">
        <span className="font-semibold text-base">Industry News</span>
        {articles.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-[hsl(var(--primary))] hover:underline"
          >
            {expanded ? "Show less" : "View all \u2192"}
          </button>
        )}
      </div>

      {error && <p className="text-base text-amber-400">{error}</p>}

      <div className="grid grid-cols-3 gap-4">
        {visibleArticles.map((article, i) => {
          const tier = TIER_STYLES[article.tier] || TIER_STYLES.industry;
          return (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[hsl(var(--bg-base))] rounded-lg p-5 border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] transition-colors"
            >
              <div className={`text-xs uppercase font-semibold mb-2 ${tier.color}`}>
                {tier.label}
              </div>
              <div className="text-base font-medium mb-2 line-clamp-2">
                {article.title}
              </div>
              <div className="text-sm text-[hsl(var(--text-dim))]">
                {article.source} · {article.published}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
