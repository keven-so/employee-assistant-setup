"use client";

import { useEffect, useState } from "react";

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  calendar: string;
}

const EVENT_COLORS = [
  "border-[hsl(var(--primary))]",
  "border-[hsl(var(--primary-muted))]",
  "border-amber-500",
  "border-rose-500",
];

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
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--bg-card))] p-6">
      <div className="flex items-center justify-between mb-5">
        <span className="font-semibold text-base">Today&apos;s Calendar</span>
        <span className="text-sm text-[hsl(var(--text-dim))]">
          {events.length} event{events.length !== 1 ? "s" : ""}
        </span>
      </div>

      {error && (
        <p className="text-base text-amber-400">{error}</p>
      )}

      {!error && events.length === 0 && (
        <p className="text-base text-[hsl(var(--text-dim))]">No events today</p>
      )}

      <div className="space-y-3">
        {events.map((event, i) => (
          <div
            key={event.id}
            className={`border-l-[3px] ${EVENT_COLORS[i % EVENT_COLORS.length]} rounded px-4 py-3 bg-[hsl(var(--bg-base))]/50`}
          >
            <div className="text-sm text-[hsl(var(--text-secondary))]">
              {formatTime(event.start)}
            </div>
            <div className="text-base font-medium">{event.summary}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
