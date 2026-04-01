"use client";

import { useEffect, useState } from "react";

interface Task {
  id: string;
  text: string;
  done: boolean;
}

interface TaskSection {
  name: string;
  slug: string;
  tasks: Task[];
}

interface TasksData {
  sections: TaskSection[];
  stats: { total: number; done: number };
}

export function TasksCard() {
  const [data, setData] = useState<TasksData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      setData(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const toggleTask = async (task: Task) => {
    if (task.done) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", taskId: task.id }),
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // Silently fail
    }
  };

  const nowTasks = data?.sections.find((s) => s.slug === "now")?.tasks ?? [];
  const stats = data?.stats ?? { total: 0, done: 0 };

  return (
    <div
      id="tasks-card"
      className="glass-card p-5"
      style={{ animation: "fadeUp 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.45s both" }}
    >
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-3">
          <div className="font-bold text-[14px]" style={{ color: "var(--text-1)" }}>Tasks</div>
          <div className="text-[11px]" style={{ color: "var(--text-2)" }}>
            {stats.done} of {stats.total} done
          </div>
        </div>
        <a
          href="https://tasks.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-medium cursor-pointer"
          style={{ color: "var(--teal)" }}
        >
          Open Tasks →
        </a>
      </div>

      {error && (
        <p className="text-[12px]" style={{ color: "var(--amber)" }}>{error}</p>
      )}

      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {nowTasks.map((task, i) => (
          <button
            key={task.id}
            onClick={() => toggleTask(task)}
            disabled={task.done}
            className="flex items-center gap-2 py-2 px-3 rounded-[10px] cursor-pointer transition-colors flex-shrink-0"
            style={{
              background: "var(--glass)",
              border: "1.5px solid var(--border)",
              opacity: 0,
              animation: `fadeUp 0.35s ease ${0.6 + i * 0.08}s both`,
            }}
            onMouseEnter={(e) => {
              if (!task.done) e.currentTarget.style.background = "rgba(255,255,255,0.80)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--glass)";
            }}
          >
            <div
              className="w-[16px] h-[16px] rounded-[5px] flex items-center justify-center flex-shrink-0 text-[10px]"
              style={
                task.done
                  ? {
                      background: "var(--purple)",
                      border: "2px solid var(--purple)",
                      color: "white",
                      animation: "checkPop 0.3s ease both",
                    }
                  : { border: "2px solid #C4CFDF" }
              }
            >
              {task.done && "\u2713"}
            </div>
            <div
              className="text-[12px] font-semibold whitespace-nowrap"
              style={task.done ? { color: "var(--text-3)", textDecoration: "line-through" } : {}}
            >
              {task.text}
            </div>
          </button>
        ))}
        {!error && nowTasks.length === 0 && (
          <p className="text-[12px]" style={{ color: "var(--text-3)" }}>No tasks yet</p>
        )}
      </div>
    </div>
  );
}
