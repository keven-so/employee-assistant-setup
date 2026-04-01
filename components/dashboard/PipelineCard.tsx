"use client";

import { useEffect, useState } from "react";

interface Lead {
  id: string;
  company: string;
  contact_name: string;
  value: number;
  stage: string;
  expected_close: string | null;
  notes: string | null;
}

interface PipelineData {
  leads: Lead[];
  stats: { total: number; totalValue: number; activeDeals: number };
}

const STAGE_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  lead: { label: "Lead", color: "var(--text-3)", bg: "rgba(155,170,191,0.15)" },
  qualified: { label: "Qualified", color: "var(--teal)", bg: "var(--teal-lt)" },
  proposal: { label: "Proposal", color: "var(--purple)", bg: "var(--purple-lt)" },
  negotiation: { label: "Negotiation", color: "var(--amber)", bg: "rgba(245,158,11,0.12)" },
};

function formatCurrency(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value.toLocaleString()}`;
}

function daysUntilClose(dateStr: string | null): { text: string; urgent: boolean } {
  if (!dateStr) return { text: "No date", urgent: false };
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, urgent: true };
  if (days === 0) return { text: "Today", urgent: true };
  if (days <= 7) return { text: `${days}d left`, urgent: true };
  return { text: `${days}d left`, urgent: false };
}

export function PipelineCard() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPipeline = async () => {
      try {
        const res = await fetch("/api/pipeline");
        if (!res.ok) throw new Error("Failed to fetch pipeline");
        setData(await res.json());
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load pipeline");
      }
    };

    fetchPipeline();
    const interval = setInterval(fetchPipeline, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const leads = data?.leads ?? [];
  const stats = data?.stats ?? { total: 0, totalValue: 0, activeDeals: 0 };

  return (
    <div
      className="glass-card p-5 flex flex-col overflow-hidden"
      style={{ animation: "fadeUp 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.37s both" }}
    >
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <div className="font-bold text-[14px]" style={{ color: "var(--text-1)" }}>Pipeline</div>
          <div className="text-[11px]" style={{ color: "var(--text-2)" }}>
            {stats.activeDeals} deal{stats.activeDeals !== 1 ? "s" : ""} · {formatCurrency(stats.totalValue)} total
          </div>
        </div>
      </div>

      {error && (
        <p className="text-[12px]" style={{ color: "var(--amber)" }}>{error}</p>
      )}

      <div className="flex-1 overflow-y-auto">
        {leads.map((lead, i) => {
          const stage = STAGE_STYLES[lead.stage] || STAGE_STYLES.lead;
          const closing = daysUntilClose(lead.expected_close);

          return (
            <div
              key={lead.id}
              className="flex items-center gap-2.5 py-2 px-2.5 rounded-[10px] transition-colors"
              style={{
                opacity: 0,
                animation: `fadeUp 0.35s ease ${0.52 + i * 0.08}s both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {/* Urgency indicator */}
              <div
                className="w-[3px] h-[32px] rounded-full flex-shrink-0"
                style={{ background: closing.urgent ? "var(--coral)" : "var(--teal)" }}
              />

              {/* Lead info */}
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold truncate" style={{ color: "var(--text-1)" }}>
                  {lead.company}
                </div>
                <div className="text-[10px] truncate" style={{ color: "var(--text-3)" }}>
                  {lead.contact_name}
                </div>
              </div>

              {/* Stage badge */}
              <div
                className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 tracking-wide"
                style={{ color: stage.color, background: stage.bg }}
              >
                {stage.label}
              </div>

              {/* Value + close date */}
              <div className="text-right flex-shrink-0" style={{ minWidth: "58px" }}>
                <div className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>
                  {formatCurrency(lead.value)}
                </div>
                <div
                  className="text-[9px] font-medium"
                  style={{ color: closing.urgent ? "var(--coral)" : "var(--text-3)" }}
                >
                  {closing.text}
                </div>
              </div>
            </div>
          );
        })}

        {!error && leads.length === 0 && (
          <p className="text-[12px]" style={{ color: "var(--text-3)" }}>No active deals</p>
        )}
      </div>
    </div>
  );
}
