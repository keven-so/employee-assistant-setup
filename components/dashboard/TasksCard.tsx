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
      // Silently fail — task stays unchecked
    }
  };

  const nowTasks = data?.sections.find((s) => s.slug === "now")?.tasks ?? [];
  const stats = data?.stats ?? { total: 0, done: 0 };

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--bg-card))] p-6">
      <div className="flex items-center justify-between mb-5">
        <span className="font-semibold text-base">Today&apos;s Tasks</span>
        <span className="text-sm text-[hsl(var(--text-dim))]">
          {stats.done}/{stats.total} done
        </span>
      </div>

      {error && (
        <p className="text-base text-red-400">{error}</p>
      )}

      {!error && nowTasks.length === 0 && (
        <p className="text-base text-[hsl(var(--text-dim))]">No tasks yet</p>
      )}

      <div className="space-y-1">
        {nowTasks.map((task) => (
          <button
            key={task.id}
            onClick={() => toggleTask(task)}
            className="flex items-start gap-3 py-2.5 w-full text-left border-b border-[hsl(var(--border))] last:border-0"
          >
            <span className={`mt-0.5 text-lg ${task.done ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--text-dim))]"}`}>
              {task.done ? "\u2611" : "\u2610"}
            </span>
            <span
              className={`text-base leading-relaxed ${
                task.done
                  ? "line-through text-[hsl(var(--text-dim))]"
                  : "text-[hsl(var(--text-primary))]"
              }`}
            >
              {task.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
