"use client";

import { useEffect, useState } from "react";

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  calendar: string;
}

const EVENT_COLORS = ["var(--purple)", "var(--teal)", "var(--amber)", "var(--coral)"];

export function CalendarCard() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/calendar");
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setEvents(data.events);
        }
      } catch {
        setError("Failed to load calendar");
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (isoString: string) => {
    if (!isoString.includes("T")) return "All day";
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div
      className="glass-card p-5 flex flex-col overflow-hidden"
      style={{ animation: "fadeUp 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.3s both" }}
    >
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <div className="font-bold text-[14px]" style={{ color: "var(--text-1)" }}>Calendar</div>
          <div className="text-[11px]" style={{ color: "var(--text-2)" }}>
            {events.length} event{events.length !== 1 ? "s" : ""} today
          </div>
        </div>
        <a
          href="https://calendar.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-medium cursor-pointer"
          style={{ color: "var(--teal)" }}
        >
          Open Calendar →
        </a>
      </div>

      {error && (
        <p className="text-[12px]" style={{ color: "var(--amber)" }}>{error}</p>
      )}

      {!error && events.length === 0 && (
        <p className="text-[12px]" style={{ color: "var(--text-3)" }}>No events today</p>
      )}

      <div className="flex-1 overflow-y-auto">
        {events.map((event, i) => (
          <div
            key={event.id}
            className="flex items-start gap-2.5 py-2 px-2.5 rounded-[10px]"
            style={{
              opacity: 0,
              animation: `fadeUp 0.35s ease ${0.45 + i * 0.1}s both`,
            }}
          >
            <div
              className="w-[3px] h-[32px] rounded-full flex-shrink-0 mt-0.5"
              style={{ background: EVENT_COLORS[i % EVENT_COLORS.length] }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[11px]" style={{ color: "var(--text-3)" }}>
                {formatTime(event.start)}
              </div>
              <div className="text-[12.5px] font-semibold truncate">
                {event.summary}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
