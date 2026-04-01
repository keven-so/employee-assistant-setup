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
  "customaize-relevant": { label: "Relevant", color: "var(--purple)" },
  "business-ai": { label: "Business AI", color: "var(--teal)" },
  industry: { label: "Industry", color: "var(--text-3)" },
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
    <div
      id="news-card"
      className="glass-card p-5"
      style={{ animation: "fadeUp 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.45s both" }}
    >
      <div className="flex items-center justify-between mb-3.5">
        <div className="font-bold text-[14px]" style={{ color: "var(--text-1)" }}>Industry News</div>
        {articles.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] font-medium cursor-pointer"
            style={{ color: "var(--teal)" }}
          >
            {expanded ? "Show less" : `View all ${articles.length} →`}
          </button>
        )}
      </div>

      {error && <p className="text-[12px]" style={{ color: "var(--amber)" }}>{error}</p>}

      <div className="grid grid-cols-3 gap-2.5">
        {visibleArticles.map((article, i) => {
          const tier = TIER_STYLES[article.tier] || TIER_STYLES.industry;
          return (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[14px] p-4 transition-all no-underline"
              style={{
                background: "var(--glass)",
                border: "1.5px solid var(--border)",
                opacity: 0,
                animation: `fadeUp 0.35s ease ${0.6 + i * 0.08}s both`,
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.80)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--glass)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                className="text-[9px] uppercase font-bold mb-1.5 tracking-wider"
                style={{ color: tier.color }}
              >
                {tier.label}
              </div>
              <div className="text-[12px] font-semibold mb-1.5 line-clamp-2" style={{ color: "var(--text-1)" }}>
                {article.title}
              </div>
              <div className="text-[10px]" style={{ color: "var(--text-3)" }}>
                {article.source}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
